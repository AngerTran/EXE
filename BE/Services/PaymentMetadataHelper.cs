using System.Text.Json;
using Exe.Models.Entities;

namespace Exe.Services;

internal static class PaymentMetadataHelper
{
    private const string ReportedAtKey = "userReportedTransferAt";

    public static DateTime? ReadReportedAt(Payment? payment)
    {
        if (payment is null || string.IsNullOrWhiteSpace(payment.Metadata) || payment.Metadata == "{}")
            return null;

        try
        {
            using var doc = JsonDocument.Parse(payment.Metadata);
            if (!doc.RootElement.TryGetProperty(ReportedAtKey, out var prop))
                return null;

            var raw = prop.GetString();
            return string.IsNullOrWhiteSpace(raw) ? null : DateTime.Parse(raw, null, System.Globalization.DateTimeStyles.RoundtripKind);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static string SetReportedAt(string? existingMetadata, DateTime reportedAtUtc)
    {
        var dict = new Dictionary<string, object?>(StringComparer.Ordinal);
        if (!string.IsNullOrWhiteSpace(existingMetadata) && existingMetadata != "{}")
        {
            try
            {
                using var doc = JsonDocument.Parse(existingMetadata);
                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    if (prop.NameEquals(ReportedAtKey))
                        continue;
                    dict[prop.Name] = prop.Value.ValueKind switch
                    {
                        JsonValueKind.String => prop.Value.GetString(),
                        JsonValueKind.Number => prop.Value.GetRawText(),
                        JsonValueKind.True => true,
                        JsonValueKind.False => false,
                        _ => prop.Value.GetRawText()
                    };
                }
            }
            catch (JsonException)
            {
                // ignore invalid metadata and overwrite with reportedAt
            }
        }

        dict[ReportedAtKey] = reportedAtUtc.ToString("O");
        return JsonSerializer.Serialize(dict);
    }
}
