namespace Exe.Models.Entities;

public class ContactInquiry
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? GameIdea { get; set; }
    public string ConsultType { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Status { get; set; } = "new";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
