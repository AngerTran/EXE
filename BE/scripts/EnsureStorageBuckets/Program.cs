using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

static string FindBeRoot()
{
    foreach (var dir in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
    {
        var current = new DirectoryInfo(Path.GetFullPath(dir));
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "appsettings.json"))
                && File.Exists(Path.Combine(current.FullName, "Exe.csproj")))
                return current.FullName;
            current = current.Parent!;
        }
    }
    throw new DirectoryNotFoundException("Could not find BE root.");
}

var beRoot = FindBeRoot();
var config = new ConfigurationBuilder()
    .SetBasePath(beRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .AddUserSecrets("gameassets-exe-be-dev")
    .Build();

var url = config["Supabase:Url"]?.Trim().TrimEnd('/')
    ?? throw new InvalidOperationException("Missing Supabase:Url");
var serviceRole = config["Supabase:ServiceRoleKey"]?.Trim();
if (string.IsNullOrWhiteSpace(serviceRole))
    throw new InvalidOperationException("Missing Supabase:ServiceRoleKey — set via dotnet user-secrets.");

var buckets = new (string Name, bool Public)[]
{
    ("asset-files", false),
    ("asset-images", true),
    ("avatars", true),
};

using var http = new HttpClient { BaseAddress = new Uri(url + "/") };
http.DefaultRequestHeaders.Add("apikey", serviceRole);
http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRole);

using var listRes = await http.GetAsync("storage/v1/bucket");
var listBody = await listRes.Content.ReadAsStringAsync();
if (!listRes.IsSuccessStatusCode)
    throw new InvalidOperationException($"Cannot list buckets: {listBody}");

var existing = JsonSerializer.Deserialize<JsonElement>(listBody);
var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
if (existing.ValueKind == JsonValueKind.Array)
{
    foreach (var item in existing.EnumerateArray())
    {
        if (item.TryGetProperty("name", out var n))
            names.Add(n.GetString() ?? "");
    }
}

foreach (var (name, isPublic) in buckets)
{
    if (names.Contains(name))
    {
        Console.WriteLine($"OK: bucket '{name}' exists");
        continue;
    }

    using var createRes = await http.PostAsJsonAsync("storage/v1/bucket", new { name, @public = isPublic });
    var createBody = await createRes.Content.ReadAsStringAsync();
    if (!createRes.IsSuccessStatusCode)
        throw new InvalidOperationException($"Cannot create bucket '{name}': {createBody}");

    Console.WriteLine($"OK: created bucket '{name}' (public={isPublic})");
}

Console.WriteLine("OK: all storage buckets ready.");
