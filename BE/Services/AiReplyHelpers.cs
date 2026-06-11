using System.Text;

namespace Exe.Services;

internal static class AiReplyHelpers
{
    private static readonly HashSet<string> GreetingPhrases = new(StringComparer.OrdinalIgnoreCase)
    {
        "xin chao", "xin chào", "chao", "chào", "hello", "hi", "hey", "yo",
        "cam on", "cảm ơn", "thanks", "thank you", "tam biet", "tạm biệt", "bye", "goodbye",
        "ok", "oke", "okay", "duoc", "được", "haha", "hihi", ":)", "=)",
        "chao ban", "chào bạn", "chao admin", "chào admin",
    };

    private static readonly string[] GameIntentKeywords =
    [
        "game", "rpg", "asset", "sprite", "tileset", "tile", "ui", "2d", "3d", "pixel",
        "platformer", "platform", "mobile", "unity", "godot", "thanh pho", "thành phố", "city",
        "character", "nhan vat", "nhân vật", "lam game", "làm game", "muon lam", "muốn làm",
        "goi y", "gợi ý", "can ", "cần ", "audio", "sfx", "shooter", "puzzle", "horror",
        "indie", "dev", "project", "du an", "dự án", "marketplace", "cho tro", "chợ",
        "xe", "oto", "o to", "phuong tien", "phương tiện",
    ];

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "tôi", "toi", "muốn", "muon", "làm", "lam", "game", "các", "cac", "nào", "nao",
        "cần", "can", "cho", "gợi", "goi", "ý", "ý", "assets", "asset", "trên", "tren",
        "trang", "web", "có", "co", "thể", "the", "được", "duoc", "lấy", "lay", "từ", "tu",
        "và", "va", "hoặc", "hoac", "một", "mot", "vài", "vai", "những", "nhung", "gì", "gi",
        "bao", "nhiêu", "nhieu", "là", "la", "của", "cua", "bạn", "ban", "không", "khong",
        "nên", "nen", "hãy", "hay", "để", "de", "với", "voi", "trong", "khi", "này", "nay",
    };

    public static IReadOnlyList<string> ExtractSearchTerms(
        string prompt,
        IReadOnlyList<string>? recentUserMessages = null)
    {
        var terms = new List<string>();

        void Merge(string text)
        {
            foreach (var term in ExtractSearchTermsFromSingle(text))
            {
                if (!terms.Contains(term, StringComparer.OrdinalIgnoreCase))
                    terms.Add(term);
            }
        }

        Merge(prompt);
        if (recentUserMessages is { Count: > 0 })
        {
            foreach (var msg in recentUserMessages.TakeLast(4))
                Merge(msg);
        }

        return terms.Take(8).ToList();
    }

    internal static string NormalizeForSearch(string prompt)
    {
        var normalized = NormalizePrompt(prompt)
            .Replace('?', ' ').Replace('!', ' ').Replace(',', ' ').Replace('.', ' ')
            .Replace(';', ' ').Replace(':', ' ');
        while (normalized.Contains("  ", StringComparison.Ordinal))
            normalized = normalized.Replace("  ", " ", StringComparison.Ordinal);
        return normalized.Trim();
    }

    private static IReadOnlyList<string> ExtractSearchTermsFromSingle(string prompt)
    {
        var lower = prompt.ToLowerInvariant();
        var terms = new List<string>();

        void Add(string term)
        {
            term = term.Trim();
            if (term.Length >= 2 && !terms.Contains(term, StringComparer.OrdinalIgnoreCase))
                terms.Add(term);
        }

        AiSearchTermLocalizer.AppendEnglishSearchTerms(prompt, Add);
        if (lower.Contains("rpg")) Add("rpg");
        if (lower.Contains("platformer") || lower.Contains("platform")) Add("platformer");
        if (lower.Contains("thành phố") || lower.Contains("thanh pho") || lower.Contains("city"))
            Add("city");
        if (lower.Contains("puzzle") || lower.Contains("giải đố") || lower.Contains("giai do"))
            Add("puzzle");
        if (lower.Contains("shooter") || lower.Contains("bắn") || lower.Contains("ban"))
            Add("shooter");
        if (lower.Contains("horror") || lower.Contains("kinh dị") || lower.Contains("kinh di"))
            Add("horror");
        if (lower.Contains("phiêu lưu") || lower.Contains("phieu luu") || lower.Contains("adventure"))
            Add("adventure");
        if (lower.Contains("2d")) Add("2d");
        if (lower.Contains("3d")) Add("3d");
        if (lower.Contains("pixel")) Add("pixel");
        if (lower.Contains("tileset") || lower.Contains("tile")) Add("tileset");
        if (lower.Contains("sprite") || lower.Contains("nhân vật") || lower.Contains("nhan vat"))
            Add("character");
        if (lower.Contains("ui") || lower.Contains("giao diện") || lower.Contains("giao dien"))
            Add("ui");
        if (lower.Contains("audio") || lower.Contains("sfx") || lower.Contains("nhạc") || lower.Contains("nhac"))
            Add("audio");
        if (lower.Contains("mobile")) Add("mobile");

        foreach (var word in lower.Split([' ', ',', '.', '?', '!', ';', ':', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries))
        {
            if (word.Length < 3 || StopWords.Contains(word))
                continue;
            Add(word);
        }

        return terms;
    }

    public static bool IsCasualMessage(string prompt)
    {
        var normalized = NormalizePrompt(prompt);
        if (string.IsNullOrWhiteSpace(normalized))
            return true;

        if (GreetingPhrases.Contains(normalized))
            return true;

        if (ContainsGameIntent(normalized))
            return false;

        var words = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length <= 4 && words.All(w => GreetingPhrases.Contains(w) || w.Length <= 2))
            return true;

        return normalized.Length <= 18 && !ContainsGameIntent(normalized);
    }

    public static bool ShouldSuggestAssets(
        string prompt,
        IReadOnlyList<string>? recentUserMessages = null)
    {
        if (IsCasualMessage(prompt))
            return false;

        if (ContainsGameIntent(NormalizePrompt(prompt)))
            return true;

        if (!IsAssetFollowUpRequest(prompt) || recentUserMessages is not { Count: > 0 })
            return false;

        var context = string.Join(' ', recentUserMessages.TakeLast(5));
        return ContainsGameIntent(NormalizePrompt(context));
    }

    private static bool IsAssetFollowUpRequest(string prompt)
    {
        var normalized = NormalizePrompt(prompt);
        if (normalized.Contains("goi y") || normalized.Contains("de xuat") || normalized.Contains("recommend"))
            return true;
        if (normalized.Contains("phu hop") && normalized.Contains("asset"))
            return true;
        if (normalized.Contains("asset") && normalized.Length <= 72)
            return true;

        return false;
    }

    public static string BuildGreetingReply()
    {
        return """
            Xin chào! Mình là **AssetBox AI** — cứ trò chuyện bình thường nhé.

            Khi bạn sẵn sàng, hãy mô tả ý tưởng game (thể loại, 2D/3D, engine…) hoặc hỏi kiểu *"cần asset gì cho RPG 2D?"* — lúc đó mình sẽ tư vấn chi tiết và gợi ý asset thật từ **Chợ AssetBox** bên dưới.
            """.Trim();
    }

    public static string BuildConversationalFallback(
        string userPrompt,
        bool hasSuggestedAssets)
    {
        if (IsCasualMessage(userPrompt))
            return BuildGreetingReply();

        var lower = userPrompt.ToLowerInvariant();
        var sb = new StringBuilder();

        if (lower.Contains("rpg"))
        {
            sb.AppendLine("RPG 2D là thể loại rất phổ biến cho indie dev — bạn có thể bắt đầu nhỏ rồi mở rộng dần.");
            sb.AppendLine();
            sb.AppendLine("Trước hết, hãy chốt **góc nhìn** (top-down hay side-view) và **phong cách** (pixel, vector, hand-drawn…). Với RPG 2D, nhóm asset cốt lõi thường gồm **sprite nhân vật & quái**, **tileset/map**, **UI** (HP, inventory, dialog), và **SFX/BGM**.");
            sb.AppendLine();
            sb.AppendLine("Workflow gợi ý: prototype map + 1 nhân vật → thêm combat/UI → polish audio. Nên chọn 1–2 pack đồng bộ style thay vì trộn quá nhiều nguồn khác nhau.");
        }
        else if (lower.Contains("thành phố") || lower.Contains("thanh pho") || lower.Contains("city"))
        {
            sb.AppendLine("Game thành phố (city builder / simulation) cần asset tạo cảm giác **sống động** và **dễ đọc** trên màn hình.");
            sb.AppendLine();
            sb.AppendLine("Bạn sẽ cần **building sprites/tileset**, **đường phố & terrain**, **icon UI** (tiền, dân số, năng lượng), và có thể thêm **SFX ambient** (xe, chim, nhạc nền nhẹ). Chú ý scale đồng nhất để zoom in/out vẫn đẹp.");
            sb.AppendLine();
            sb.AppendLine("Bắt đầu với bộ tile nhỏ + vài building mẫu, test layout trên map trước khi mua thêm pack lớn.");
        }
        else if (lower.Contains("platformer") || lower.Contains("platform"))
        {
            sb.AppendLine("Platformer 2D tập trung vào **cảm giác điều khiển** — asset nên hỗ trợ đọc hitbox và chuyển động rõ ràng.");
            sb.AppendLine();
            sb.AppendLine("Ưu tiên **character sprite sheet** (idle, run, jump, fall), **tileset/platform**, **hazard/obstacle**, **UI** đơn giản, và **SFX** nhảy/landing. Animation mượt quan trọng hơn số lượng nhân vật.");
        }
        else if (lower.Contains("ui") || lower.Contains("mobile"))
        {
            sb.AppendLine("UI cho game mobile cần **rõ ràng trên màn nhỏ** và **nhất quán** về màu, bo góc, icon.");
            sb.AppendLine();
            sb.AppendLine("Tìm pack gồm **buttons**, **panels**, **icons** (settings, shop, pause), **font** dễ đọc. Nên chọn style phù hợp thể loại game (casual vs hardcore).");
        }
        else if (!ContainsGameIntent(lower))
        {
            sb.AppendLine("Mình hiểu rồi! Để gợi ý asset chính xác, bạn mô tả thêm về **game** bạn đang làm nhé.");
            sb.AppendLine();
            sb.AppendLine("Ví dụ: thể loại (RPG, platformer, city builder…), **2D hay 3D**, engine (Unity, Godot…), và style (pixel, vector…).");
        }
        else
        {
            sb.AppendLine($"Ý tưởng về **{SummarizePrompt(userPrompt)}** nghe hay đấy!");
            sb.AppendLine();
            sb.AppendLine("Để triển khai, hãy chia asset thành các nhóm: **nhân vật/obj**, **môi trường/map**, **UI/HUD**, **audio**. Mô tả thêm engine và style nếu bạn muốn gợi ý sát hơn.");
        }

        sb.AppendLine();
        if (hasSuggestedAssets)
            sb.Append("Dưới đây là một số asset trên **Chợ AssetBox** có thể phù hợp — bạn có thể mở từng mục để xem chi tiết.");
        else if (ContainsGameIntent(lower))
            sb.Append("Hiện chưa match asset cụ thể trong kho — thử mô tả thể loại hoặc từ khóa (RPG, tileset, pixel…) hoặc vào **Chợ Assets** để duyệt thêm.");
        else
            sb.Append("Khi bạn mô tả rõ hơn về game (thể loại, style, engine…), mình sẽ gợi ý asset cụ thể từ Chợ AssetBox.");

        return sb.ToString().TrimEnd();
    }

    public static string BuildSystemPrompt(
        string userPrompt,
        IReadOnlyList<(string Title, string? Category)> suggestedAssets)
    {
        if (IsCasualMessage(userPrompt))
        {
            return """
                Bạn là AssetBox AI — trợ lý thân thiện cho game developer Việt Nam.
                User đang chào hỏi hoặc trò chuyện xã giao, CHƯA hỏi về game/asset.
                Trả lời ngắn gọn, thân thiện (1–2 đoạn). Giới thiệu bạn có thể tư vấn asset khi user mô tả ý tưởng game.
                KHÔNG gợi ý asset, KHÔNG nói "Dưới đây là asset", KHÔNG phân tích ý tưởng game từ câu chào.
                Tiếng Việt.
                """;
        }

        var assetContext = suggestedAssets.Count > 0
            ? "Asset đã match từ kho AssetBox (chỉ để bạn hiểu ngữ cảnh, KHÔNG liệt kê tên trong câu trả lời):\n"
              + string.Join("\n", suggestedAssets.Select(a =>
                  $"- {a.Title}{(string.IsNullOrWhiteSpace(a.Category) ? "" : $" ({a.Category})")}"))
            : "Chưa tìm thấy asset khớp trong kho — tư vấn loại asset cần tìm, khuyên user vào Chợ Assets.";

        var endingRule = suggestedAssets.Count > 0
            ? """
              - Kết thúc bằng đúng 1 câu ngắn dẫn xuống phần asset bên dưới, ví dụ: "Dưới đây là vài asset trên AssetBox có thể phù hợp với dự án của bạn."
              """
            : """
              - KHÔNG nói "Dưới đây là asset", KHÔNG hứa hiển thị asset bên dưới. Gợi ý user vào **Chợ Assets** hoặc mô tả thêm từ khóa (RPG, tileset, pixel…).
              """;

        return $"""
            Bạn là AssetBox AI — trợ lý thân thiện cho game developer Việt Nam trên nền tảng AssetBox.

            CÁCH TRẢ LỜI (bắt buộc):
            - Viết tự nhiên như ChatGPT: 2–4 đoạn văn ngắn, thân thiện, có thể hỏi lại 1 câu nếu thiếu thông tin.
            - Phân tích ý tưởng game, giải thích loại asset cần (sprite, tileset, UI, audio…) và workflow thực tế.
            - KHÔNG liệt kê tên asset cụ thể, KHÔNG dùng bullet "Gợi ý cho:", KHÔNG paste danh sách asset trong nội dung.
            {endingRule}
            - Tiếng Việt. Markdown nhẹ (đoạn văn, **in đậm**) — tránh bullet dài.

            {assetContext}
            """;
    }

    private static string SummarizePrompt(string prompt)
    {
        var oneLine = prompt.Replace('\n', ' ').Trim();
        return oneLine.Length <= 60 ? oneLine : oneLine[..57] + "...";
    }

    private static string NormalizePrompt(string prompt) =>
        prompt.Trim().ToLowerInvariant()
            .Replace('à', 'a').Replace('á', 'a').Replace('ả', 'a').Replace('ã', 'a').Replace('ạ', 'a')
            .Replace('ă', 'a').Replace('ằ', 'a').Replace('ắ', 'a').Replace('ẳ', 'a').Replace('ẵ', 'a').Replace('ặ', 'a')
            .Replace('â', 'a').Replace('ầ', 'a').Replace('ấ', 'a').Replace('ẩ', 'a').Replace('ẫ', 'a').Replace('ậ', 'a')
            .Replace('è', 'e').Replace('é', 'e').Replace('ẻ', 'e').Replace('ẽ', 'e').Replace('ẹ', 'e')
            .Replace('ê', 'e').Replace('ề', 'e').Replace('ế', 'e').Replace('ể', 'e').Replace('ễ', 'e').Replace('ệ', 'e')
            .Replace('ì', 'i').Replace('í', 'i').Replace('ỉ', 'i').Replace('ĩ', 'i').Replace('ị', 'i')
            .Replace('ò', 'o').Replace('ó', 'o').Replace('ỏ', 'o').Replace('õ', 'o').Replace('ọ', 'o')
            .Replace('ô', 'o').Replace('ồ', 'o').Replace('ố', 'o').Replace('ổ', 'o').Replace('ỗ', 'o').Replace('ộ', 'o')
            .Replace('ơ', 'o').Replace('ờ', 'o').Replace('ớ', 'o').Replace('ở', 'o').Replace('ỡ', 'o').Replace('ợ', 'o')
            .Replace('ù', 'u').Replace('ú', 'u').Replace('ủ', 'u').Replace('ũ', 'u').Replace('ụ', 'u')
            .Replace('ư', 'u').Replace('ừ', 'u').Replace('ứ', 'u').Replace('ử', 'u').Replace('ữ', 'u').Replace('ự', 'u')
            .Replace('ỳ', 'y').Replace('ý', 'y').Replace('ỷ', 'y').Replace('ỹ', 'y').Replace('ỵ', 'y')
            .Replace('đ', 'd')
            .Trim(' ', '.', '!', '?', ',', ';', ':');

    private static bool ContainsGameIntent(string normalizedLower) =>
        GameIntentKeywords.Any(k => normalizedLower.Contains(k, StringComparison.OrdinalIgnoreCase));

    internal sealed record BlueprintAdaptiveFlags(bool OnlineBackend, bool Monetization);

    private static readonly string[] OnlineBackendKeywords =
    [
        "multiplayer", "online", "server", "database", "account", "backend", "api",
        "mmo", "co-op", "coop", "pvp", "realtime", "socket", "cloud save", "login",
        "dang nhap", "đăng nhập", "ket noi", "kết nối", "may chu", "máy chủ",
    ];

    private static readonly string[] MonetizationKeywords =
    [
        "free-to-play", "f2p", "iap", "in-app", "ads", "quang cao", "quảng cáo",
        "monetization", "retention", "analytics", "mobile game", "game mobile",
        "kiem tien", "kiếm tiền", "mua trong app", "steam marketing",
    ];

    public static BlueprintAdaptiveFlags DetectBlueprintAdaptiveFlags(
        IReadOnlyList<(string Role, string Content)> messages)
    {
        var blob = NormalizeForSearch(string.Join(" ", messages.Select(m => m.Content)));
        var online = OnlineBackendKeywords.Any(k => blob.Contains(k, StringComparison.OrdinalIgnoreCase));
        var monetization = MonetizationKeywords.Any(k => blob.Contains(k, StringComparison.OrdinalIgnoreCase));
        return new BlueprintAdaptiveFlags(online, monetization);
    }

    public static string BuildBlueprintAdaptiveSectionGuide(BlueprintAdaptiveFlags flags)
    {
        var sb = new StringBuilder();
        sb.AppendLine("PHẦN THÍCH ỨNG (chỉ thêm khi phù hợp ngữ cảnh — KHÔNG ép nếu không liên quan):");
        if (flags.OnlineBackend)
        {
            sb.AppendLine("- Thêm: ## Kiến trúc kỹ thuật (Database, API, Server) — ngắn gọn, thực tế.");
        }
        else
        {
            sb.AppendLine("- KHÔNG thêm Database Schema / API / Microservice nếu game offline hoặc single-player đơn giản.");
        }

        if (flags.Monetization)
        {
            sb.AppendLine("- Thêm: ## Monetization & Retention (IAP/Ads, retention, analytics) — nếu dự án commercial mobile/F2P.");
        }
        else
        {
            sb.AppendLine("- KHÔNG thêm Monetization / Steam Marketing nếu user chỉ học làm game hoặc prototype.");
        }

        return sb.ToString().TrimEnd();
    }

    public static string BuildOutlineFallback(
        string sessionTitle,
        IReadOnlyList<(string Role, string Content)> messages)
    {
        var flags = DetectBlueprintAdaptiveFlags(messages);
        var userMsgs = messages.Where(m => m.Role.Equals("user", StringComparison.OrdinalIgnoreCase)).ToList();
        var idea = userMsgs.Count > 0 ? userMsgs[0].Content.Trim() : "Ý tưởng game chưa mô tả chi tiết.";
        var projectName = sessionTitle is "New AI Session" or "AssetBox AI Chat" or "Phiên chat mới"
            ? SummarizePrompt(idea)
            : sessionTitle;

        var sb = new StringBuilder();
        sb.AppendLine($"# Project Blueprint — {projectName}");
        sb.AppendLine();
        sb.AppendLine("## 1. Tóm tắt ý tưởng (Executive Summary)");
        sb.AppendLine($"- **Tên dự án (đề xuất):** {projectName}");
        sb.AppendLine("- **Thể loại:** (suy luận từ hội thoại — cần xác nhận)");
        sb.AppendLine("- **Đối tượng người chơi:** Casual / học làm game / indie");
        sb.AppendLine("- **Nền tảng phát hành:** PC hoặc Mobile (ưu tiên theo mô tả)");
        sb.AppendLine($"- **Pitch:** {idea}");
        sb.AppendLine();

        sb.AppendLine("## 2. Gameplay Loop");
        sb.AppendLine("Người chơi làm gì?");
        sb.AppendLine("↓");
        sb.AppendLine("Nhận phần thưởng gì?");
        sb.AppendLine("↓");
        sb.AppendLine("Dùng phần thưởng để làm gì?");
        sb.AppendLine("↓");
        sb.AppendLine("Tiếp tục vòng lặp");
        sb.AppendLine();
        sb.AppendLine("*(Điền cụ thể sau khi chat thêm với AI — hiện suy luận từ ý tưởng ban đầu.)*");
        sb.AppendLine();

        sb.AppendLine("## 3. MVP (phiên bản tối thiểu)");
        sb.AppendLine("**Cần có:**");
        sb.AppendLine("- ✓ Di chuyển / tương tác cơ bản");
        sb.AppendLine("- ✓ Một vòng gameplay loop hoàn chỉnh");
        sb.AppendLine("- ✓ UI tối thiểu (HUD, menu)");
        sb.AppendLine();
        sb.AppendLine("**Chưa cần:**");
        sb.AppendLine("- ✗ Nội dung quá lớn / multiplayer / polish nặng");
        sb.AppendLine();

        sb.AppendLine("## 4. Roadmap phát triển");
        sb.AppendLine("1. **Prototype** — chứng minh core loop");
        sb.AppendLine("2. **Core Features** — hệ thống chính");
        sb.AppendLine("3. **Content** — asset, level, nhân vật");
        sb.AppendLine("4. **Polish** — UX, SFX, balance");
        sb.AppendLine("5. **Release** — build, store page (nếu cần)");
        sb.AppendLine();

        sb.AppendLine("## 5. Asset cần tìm (AssetBox)");
        sb.AppendLine("- **Environment** — tileset, nội thất, map");
        sb.AppendLine("- **Character** — sprite, animation");
        sb.AppendLine("- **UI** — button, panel, icon");
        sb.AppendLine("- **Audio** — BGM, SFX");
        sb.AppendLine("- **Animation / VFX** — hiệu ứng, particle");
        sb.AppendLine();

        sb.AppendLine("## 6. Rủi ro dự án");
        sb.AppendLine("- ⚠ Scope creep — làm quá nhiều tính năng sớm");
        sb.AppendLine("- ⚠ Asset chưa đủ — cần lên checklist asset sớm");
        if (flags.OnlineBackend)
            sb.AppendLine("- ⚠ Multiplayer / server — nên để sau MVP");
        sb.AppendLine();

        sb.AppendLine("## 7. Checklist & bước tiếp theo");
        sb.AppendLine("- [ ] Khóa MVP (3–5 tính năng)");
        sb.AppendLine("- [ ] Chọn engine (Unity / Godot)");
        sb.AppendLine("- [ ] Tìm asset trên Chợ AssetBox");
        sb.AppendLine("- [ ] Prototype trong 1–2 tuần");
        sb.AppendLine();

        if (flags.OnlineBackend)
        {
            sb.AppendLine("## 8. Kiến trúc kỹ thuật (mở rộng)");
            sb.AppendLine("- Database: lưu tài khoản / tiến trình (nếu online)");
            sb.AppendLine("- API: auth, save game, leaderboard (nếu cần)");
            sb.AppendLine("- Server: realtime hoặc REST — ưu tiên sau MVP");
            sb.AppendLine();
        }

        if (flags.Monetization)
        {
            sb.AppendLine("## 9. Monetization & Retention (mở rộng)");
            sb.AppendLine("- Monetization: IAP / quảng cáo (nếu F2P mobile)");
            sb.AppendLine("- Retention: daily reward, progression");
            sb.AppendLine("- Analytics: theo dõi funnel, session length");
            sb.AppendLine();
        }

        return sb.ToString().TrimEnd();
    }

    public static string BuildOutlineSystemPrompt() =>
        """
        Bạn là trợ lý sinh **Project Blueprint** cho game developer Việt Nam trên AssetBox.
        Đọc toàn bộ hội thoại user ↔ AI và viết MỘT bản thiết kế dự án hoàn chỉnh.

        NGUYÊN TẮC: **Core Structure (cố định) + Adaptive Sections (linh hoạt)**.
        Ngay cả khi user chỉ nói một câu ngắn (vd. "làm game quản lý quán cà phê 2D"), bạn PHẢI tự suy luận và điền đầy đủ phần cốt lõi — đừng chỉ tóm tắt lại chat.

        KHÔNG liệt kê chat log. KHÔNG copy nguyên văn từng tin nhắn. Tiếng Việt, markdown rõ ràng.

        ## PHẦN CỐ ĐỊNH — LUÔN CÓ (đánh số ## 1–7):

        ### 1. Tóm tắt ý tưởng (Executive Summary)
        - Tên dự án (đề xuất nếu chưa có)
        - Thể loại
        - Đối tượng người chơi
        - Nền tảng phát hành
        - Pitch 1–2 câu

        ### 2. Gameplay Loop
        Dạng chuỗi:
        Người chơi làm gì? → Nhận phần thưởng gì? → Dùng phần thưởng để làm gì? → Lặp lại
        Viết cụ thể cho dự án, không để placeholder trống.

        ### 3. MVP
        **Cần có** (✓) — 3–6 mục tối thiểu để chơi được
        **Chưa cần** (✗) — những thứ nên hoãn (scope creep)

        ### 4. Roadmap phát triển
        1. Prototype → 2. Core Features → 3. Content → 4. Polish → 5. Release
        Mỗi giai đoạn 1–2 dòng mô tả việc cần làm.

        ### 5. Asset cần tìm (AssetBox)
        Nhóm bắt buộc (điền cụ thể theo dự án):
        - Environment
        - Character
        - UI
        - Audio
        - Animation / VFX (nếu cần)
        Gợi ý loại asset phù hợp — không cần tên file cụ thể.

        ### 6. Rủi ro dự án
        2–4 cảnh báo ⚠ thực tế (scope, kỹ thuật, thời gian, multiplayer sớm…).

        ### 7. Checklist & bước tiếp theo
        Checklist ngắn + 3–5 việc nên làm NGAY.

        ## PHẦN THÍCH ỨNG — CHỈ THÊM KHI PHÙ HỢP:

        Nếu hội thoại nhắc multiplayer / online / server / database / account:
        → Thêm ## 8. Kiến trúc kỹ thuật (Database, API, Server) — ngắn gọn.

        Nếu hội thoại nhắc mobile F2P / ads / IAP / monetization / retention:
        → Thêm ## Monetization & Retention (IAP, ads, analytics).

        KHÔNG thêm nếu không liên quan:
        - Database / API / Microservice cho game offline Unity đơn giản
        - Monetization / Steam Marketing nếu user chỉ học làm game

        Độ dài: khoảng 400–900 từ, đủ chi tiết để xuất file và bắt đầu làm.
        """;

    public static string BuildRefineOutlineSystemPrompt() =>
        """
        Bạn chỉnh sửa **Project Blueprint** cho game developer Việt Nam trên AssetBox.
        Giữ cấu trúc Core (mục 1–7) + Adaptive (nếu đã có).
        Áp dụng yêu cầu chỉnh sửa của user; không thêm chat log.
        Trả về TOÀN BỘ blueprint đã chỉnh (không chỉ phần thay đổi). Tiếng Việt, markdown.
        """;
}
