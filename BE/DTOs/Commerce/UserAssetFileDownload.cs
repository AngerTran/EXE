namespace Exe.DTOs.Commerce;

public record UserAssetFileDownloadResult(Stream Content, string FileName, string ContentType);
