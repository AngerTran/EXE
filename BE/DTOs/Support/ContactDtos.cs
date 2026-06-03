using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Support;

public record CreateContactInquiryRequest(
    [Required, MaxLength(200)] string Name,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [MaxLength(50)] string? Phone,
    [MaxLength(2000)] string? GameIdea,
    [Required, MaxLength(100)] string ConsultType,
    [Required, MaxLength(5000)] string Message);

public record ContactInquiryResponse(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string? GameIdea,
    string ConsultType,
    string Message,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record UpdateContactInquiryRequest(
    [Required, MaxLength(20)] string Status);
