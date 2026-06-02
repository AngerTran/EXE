namespace Exe.DTOs.Common;

public record PagedResponse<T>(
    IReadOnlyList<T> Data,
    int Page,
    int PageSize,
    int Total);

public record PagedQuery(int Page = 1, int PageSize = 20)
{
    public int NormalizedPage => Page < 1 ? 1 : Page;

    public int NormalizedPageSize => PageSize switch
    {
        < 1 => 20,
        > 100 => 100,
        _ => PageSize
    };

    public int Skip => (NormalizedPage - 1) * NormalizedPageSize;
}
