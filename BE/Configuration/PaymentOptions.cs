namespace Exe.Configuration;

/// <summary>Dev/MVP: tự hoàn tất payment ngay khi tạo order (giống FE mock). Tắt khi tích hợp MoMo/VNPay thật.</summary>
public class PaymentOptions
{
    public const string SectionName = "Payment";

    public bool AutoCompleteOnCreate { get; set; } = true;
}
