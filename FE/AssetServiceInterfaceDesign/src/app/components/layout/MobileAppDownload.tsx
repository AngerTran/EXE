import { Download, Smartphone, Shield } from "lucide-react";
import { AppLogo } from "../AppLogo";
import { mobileAppLinks, mobileAppVersion } from "../../../constants/mobileApp";

type MobileAppDownloadProps = {
  variant?: "section" | "footer";
};

function ApkDownloadButton({ className }: { className?: string }) {
  return (
    <a
      href={mobileAppLinks.apk}
      download="assetbox.apk"
      className={
        className ??
        "inline-flex items-center gap-3 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 to-secondary/10 px-5 py-3.5 text-foreground transition-all hover:border-primary/60 hover:shadow-[0_0_28px_rgba(0,217,255,0.2)] hover:-translate-y-0.5"
      }
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/25 text-primary">
        <Download className="h-5 w-5" />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
          Android • v{mobileAppVersion}
        </span>
        <span className="block text-base font-semibold">Tải APK AssetBox</span>
      </span>
    </a>
  );
}

export function MobileAppDownload({ variant = "section" }: MobileAppDownloadProps) {
  if (variant === "footer") {
    return (
      <div className="mt-5">
        <h3 className="text-foreground font-bold mb-3">Tải app</h3>
        <a
          href={mobileAppLinks.apk}
          download="assetbox.apk"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <Download className="h-4 w-4 text-primary" />
          Tải APK Android (v{mobileAppVersion})
        </a>
      </div>
    );
  }

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-sm font-medium">
              <Smartphone className="w-4 h-4" />
              AssetBox Mobile — Android
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              Tải app Android (APK)
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg">
              Marketplace, AI tư vấn game, ví xu và thư viện asset trên điện thoại. Cài trực tiếp từ
              file APK — CH Play sẽ có sau.
            </p>
            <ApkDownloadButton />
            <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-md">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-primary/80" />
              <p>
                Sau khi tải, mở file và cho phép <strong className="text-foreground">Cài từ nguồn
                không xác định</strong> nếu điện thoại hỏi. Cùng tài khoản với web, đăng nhập Google
                được.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-[260px] sm:w-[280px]">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/10 blur-2xl opacity-80" />
              <div className="relative rounded-[2rem] border-2 border-border/80 bg-card/90 backdrop-blur-xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="rounded-[1.5rem] border border-border/60 bg-background overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground font-mono">9:41</span>
                    <div className="h-4 w-16 rounded-full bg-foreground/10" />
                  </div>
                  <div className="px-5 py-8 space-y-5">
                    <div className="flex justify-center">
                      <AppLogo size="md" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-primary/30 w-full" />
                      <div className="h-2 rounded-full bg-muted w-4/5" />
                      <div className="h-2 rounded-full bg-muted w-3/5" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="rounded-lg bg-primary/15 border border-primary/25 h-14" />
                      <div className="rounded-lg bg-secondary/15 border border-secondary/25 h-14" />
                      <div className="rounded-lg bg-muted/30 border border-border h-14 col-span-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
