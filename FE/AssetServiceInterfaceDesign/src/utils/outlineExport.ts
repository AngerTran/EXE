import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export type OutlineExportFormat = "md" | "txt" | "docx" | "pdf";

export const OUTLINE_EXPORT_FORMATS: {
  value: OutlineExportFormat;
  label: string;
  extension: string;
}[] = [
  { value: "md", label: "Markdown", extension: "md" },
  { value: "txt", label: "Văn bản", extension: "txt" },
  { value: "docx", label: "Word", extension: "docx" },
  { value: "pdf", label: "PDF", extension: "pdf" },
];

export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "dan-y";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(content: string, filename: string, mime = "text/plain;charset=utf-8") {
  downloadBlob(new Blob([content], { type: mime }), filename);
}

/** Chuyển markdown nhẹ sang plain text khi xuất .txt */
export function outlineContentForExport(content: string, format: OutlineExportFormat): string {
  if (format === "md" || format === "docx" || format === "pdf") return content;

  return content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .trim();
}

type ParsedLine =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "body"; text: string }
  | { kind: "blank" };

function parseOutlineLines(content: string): ParsedLine[] {
  return content.split("\n").map((raw) => {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) return { kind: "blank" as const };
    if (t.startsWith("### ")) return { kind: "h3" as const, text: t.slice(4) };
    if (t.startsWith("## ")) return { kind: "h2" as const, text: t.slice(3) };
    if (t.startsWith("# ")) return { kind: "h1" as const, text: t.slice(2) };
    if (/^[-*+•]\s+/.test(t)) return { kind: "bullet" as const, text: t.replace(/^[-*+•]\s+/, "") };
    return { kind: "body" as const, text: t };
  });
}

function parseInlineRuns(text: string): TextRun[] {
  const parts = text.split(/(\*\*.+?\*\*)/g).filter(Boolean);
  if (parts.length === 0) return [new TextRun("")];

  return parts.map((part) => {
    const bold = part.startsWith("**") && part.endsWith("**");
    const value = bold ? part.slice(2, -2) : part;
    return new TextRun({ text: value, bold });
  });
}

function docxHeading(level: "h1" | "h2" | "h3", text: string): Paragraph {
  const map = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
  } as const;
  return new Paragraph({
    heading: map[level],
    children: parseInlineRuns(text),
  });
}

export async function exportOutlineDocx(content: string, filename: string, documentTitle?: string) {
  const children: Paragraph[] = [];

  if (documentTitle?.trim()) {
    children.push(docxHeading("h1", documentTitle.trim()));
  }

  for (const line of parseOutlineLines(content)) {
    switch (line.kind) {
      case "h1":
        children.push(docxHeading("h1", line.text));
        break;
      case "h2":
        children.push(docxHeading("h2", line.text));
        break;
      case "h3":
        children.push(docxHeading("h3", line.text));
        break;
      case "bullet":
        children.push(
          new Paragraph({
            children: [new TextRun("• "), ...parseInlineRuns(line.text)],
            spacing: { after: 120 },
          })
        );
        break;
      case "body":
        children.push(
          new Paragraph({
            children: parseInlineRuns(line.text),
            spacing: { after: 120 },
          })
        );
        break;
      case "blank":
        children.push(new Paragraph({ text: "" }));
        break;
    }
  }

  const doc = new Document({
    sections: [{ children: children.length > 0 ? children : [new Paragraph({ text: content })] }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

type PdfBlock =
  | { kind: "title"; text: string }
  | { kind: "line"; line: ParsedLine };

const PDF_ROOT_STYLE =
  "font-family:Segoe UI,system-ui,sans-serif;font-size:11pt;line-height:1.55;color:#111111;background:#ffffff;padding:24px;box-sizing:border-box;";

function lineInnerHtml(line: ParsedLine): string {
  switch (line.kind) {
    case "h1":
      return `<h1 style="font-size:16pt;margin:14px 0 8px;">${formatInlineHtml(line.text)}</h1>`;
    case "h2":
      return `<h2 style="font-size:13pt;margin:12px 0 6px;">${formatInlineHtml(line.text)}</h2>`;
    case "h3":
      return `<h3 style="font-size:12pt;margin:10px 0 4px;">${formatInlineHtml(line.text)}</h3>`;
    case "bullet":
      return `<p style="margin:4px 0 4px 18px;">• ${formatInlineHtml(line.text)}</p>`;
    case "body":
      return `<p style="margin:6px 0;">${formatInlineHtml(line.text)}</p>`;
    case "blank":
      return "<br/>";
  }
}

function buildPdfBlocks(lines: ParsedLine[], documentTitle?: string): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  if (documentTitle?.trim()) blocks.push({ kind: "title", text: documentTitle.trim() });
  for (const line of lines) blocks.push({ kind: "line", line });
  return blocks;
}

function blocksToHtml(blocks: PdfBlock[], blockIndices: number[]): string {
  const parts = [`<div style="${PDF_ROOT_STYLE}">`];
  for (const idx of blockIndices) {
    const block = blocks[idx];
    if (block.kind === "title") {
      parts.push(
        `<div class="pdf-block" style="${PDF_BLOCK_STYLE}"><h1 style="font-size:18pt;margin:0 0 14px;">${escapeHtml(block.text)}</h1></div>`
      );
    } else {
      parts.push(`<div class="pdf-block" style="${PDF_BLOCK_STYLE}">${lineInnerHtml(block.line)}</div>`);
    }
  }
  parts.push("</div>");
  return parts.join("");
}

function createPdfHost(widthPx: number): HTMLDivElement {
  const host = document.createElement("div");
  host.setAttribute("data-outline-pdf-export", "true");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${widthPx}px`,
    "background:#ffffff",
    "z-index:-9999",
    "opacity:1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");
  return host;
}

async function renderHtmlToCanvas(host: HTMLDivElement, widthPx: number): Promise<HTMLCanvasElement> {
  await waitForNextPaint();
  const canvas = await html2canvas(host, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width: widthPx,
    windowWidth: widthPx,
  });
  if (canvas.width === 0 || canvas.height === 0) throw new Error("PDF canvas empty");
  return canvas;
}

type BlockLayout = { top: number; bottom: number };

async function measureBlockLayout(
  blocks: PdfBlock[],
  widthPx: number
): Promise<{ layouts: BlockLayout[]; hostHeight: number }> {
  const host = createPdfHost(widthPx);
  const indices = blocks.map((_, i) => i);
  host.innerHTML = blocksToHtml(blocks, indices);
  document.body.appendChild(host);

  try {
    await waitForNextPaint();
    const measured = host.querySelectorAll<HTMLElement>(".pdf-block");
    const layouts = Array.from(measured).map((el) => ({
      top: el.offsetTop,
      bottom: el.offsetTop + el.offsetHeight,
    }));
    return { layouts, hostHeight: host.offsetHeight };
  } finally {
    document.body.removeChild(host);
  }
}

const PDF_BLOCK_STYLE = "page-break-inside:avoid;break-inside:avoid;";

function paginateBlockGroups(layouts: BlockLayout[], maxPageHeightPx: number): number[][] {
  if (layouts.length === 0) return [[]];

  const groups: number[][] = [];
  let start = 0;

  while (start < layouts.length) {
    let end = start;

    while (end + 1 < layouts.length) {
      const span = layouts[end + 1].bottom - layouts[start].top + 48;
      if (span <= maxPageHeightPx) end++;
      else break;
    }

    groups.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
    start = end + 1;
  }

  return groups;
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function canvasHeightPt(canvas: HTMLCanvasElement, printableWidth: number): number {
  return canvas.height * (printableWidth / canvas.width);
}

function addPageCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  margin: number,
  printableWidth: number,
  isFirstPdfPage: boolean
): boolean {
  const imgHeightPt = canvasHeightPt(canvas, printableWidth);

  if (!isFirstPdfPage) pdf.addPage();
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, printableWidth, imgHeightPt);

  return false;
}

async function renderBlockGroupCanvas(
  blocks: PdfBlock[],
  blockIndices: number[],
  contentWidthPx: number
): Promise<HTMLCanvasElement> {
  const host = createPdfHost(contentWidthPx);
  host.innerHTML = blocksToHtml(blocks, blockIndices);
  document.body.appendChild(host);

  try {
    return await renderHtmlToCanvas(host, contentWidthPx);
  } finally {
    document.body.removeChild(host);
  }
}

export async function exportOutlinePdf(content: string, filename: string, documentTitle?: string) {
  const margin = 48;
  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;
  const printableWidth = pageWidthPt - margin * 2;
  const printableHeight = pageHeightPt - margin * 2;
  const contentWidthPx = Math.round(printableWidth);

  const allLines = parseOutlineLines(content);
  const blocks = buildPdfBlocks(allLines, documentTitle);
  const { layouts } = await measureBlockLayout(blocks, contentWidthPx);

  const layoutPxPerPt = contentWidthPx / printableWidth;
  const maxPageHeightPx = Math.floor(printableHeight * layoutPxPerPt * 0.97);
  const pageBlockGroups = paginateBlockGroups(layouts, maxPageHeightPx);

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  let isFirstPdfPage = true;
  let carryOver: number[] = [];

  const flushPage = async (indices: number[]): Promise<number[]> => {
    let batch = [...indices];
    let overflow: number[] = [];

    while (batch.length > 0) {
      let canvas = await renderBlockGroupCanvas(blocks, batch, contentWidthPx);
      let heightPt = canvasHeightPt(canvas, printableWidth);

      while (heightPt > printableHeight && batch.length > 1) {
        overflow.unshift(batch.pop()!);
        canvas = await renderBlockGroupCanvas(blocks, batch, contentWidthPx);
        heightPt = canvasHeightPt(canvas, printableWidth);
      }

      isFirstPdfPage = addPageCanvasToPdf(pdf, canvas, margin, printableWidth, isFirstPdfPage);
      return overflow;
    }

    return overflow;
  };

  for (const group of pageBlockGroups) {
    carryOver = await flushPage([...carryOver, ...group]);
  }

  while (carryOver.length > 0) {
    carryOver = await flushPage(carryOver);
  }

  pdf.save(filename);
}

export async function exportOutlineFile(
  content: string,
  format: OutlineExportFormat,
  filenameBase: string,
  documentTitle?: string
) {
  const meta = OUTLINE_EXPORT_FORMATS.find((f) => f.value === format)!;
  const filename = `${filenameBase}-blueprint.${meta.extension}`;
  const body = outlineContentForExport(content, format);

  switch (format) {
    case "md":
      downloadTextFile(body, filename, "text/markdown;charset=utf-8");
      break;
    case "txt":
      downloadTextFile(body, filename, "text/plain;charset=utf-8");
      break;
    case "docx":
      await exportOutlineDocx(body, filename, documentTitle);
      break;
    case "pdf":
      await exportOutlinePdf(body, filename, documentTitle);
      break;
  }
}
