namespace Exe.Configuration;

/// <summary>Thông tin tài khoản ngân hàng nhận chuyển khoản (hiển thị QR VietQR).</summary>
public class BankTransferOptions
{
    public const string SectionName = "BankTransfer";

    /// <summary>Mã BIN ngân hàng (VietQR), VD Vietcombank = 970436.</summary>
    public string BankBin { get; set; } = "970436";

    public string BankName { get; set; } = "Vietcombank";

    public string AccountNumber { get; set; } = "";

    public string AccountHolder { get; set; } = "";

    /// <summary>Ảnh QR tĩnh (tùy chọn). Để trống thì FE/BE sinh QR động qua VietQR.</summary>
    public string? QrImageUrl { get; set; }
}
