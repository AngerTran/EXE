namespace Exe.Services;

/// <summary>
/// Maps Vietnamese user phrases to English marketplace search terms (tags/titles are mostly English).
/// </summary>
internal static class AiSearchTermLocalizer
{
    private static readonly (string[] Triggers, string[] EnglishTerms)[] Mappings =
    [
        (["xe hoi", "xe hơi", "oto", "o to", "xe"], ["car", "vehicle"]),
        (["phuong tien", "phương tiện", "giao thong", "giao thông"], ["vehicle", "transportation"]),
        (["may bay", "máy bay", "tau bay", "tàu bay"], ["aircraft", "plane"]),
        (["tau", "tàu", "thuyen", "thuyền"], ["ship", "boat"]),
        (["xe dap", "xe đạp"], ["bicycle", "bike"]),
        (["xe may", "xe máy", "motor", "motorcycle"], ["motorcycle", "vehicle"]),
        (["xe tai", "xe tải", "xe buyt", "xe buýt"], ["truck", "vehicle", "transportation"]),
        (["vu khi", "vũ khí", "sung", "kiem", "kiếm"], ["weapon", "combat"]),
        (["nhan vat", "nhân vật", "nhan vat chinh"], ["character"]),
        (["quai vat", "quái vật", "enemy", "ke thu", "kẻ thù"], ["enemy", "monster", "character"]),
        (["dong vat", "động vật", "thu", "thú"], ["animal", "creature"]),
        (["cay", "cây", "rung", "rừng"], ["tree", "forest", "nature"]),
        (["nha", "nhà", "toa nha", "tòa nhà", "kien truc", "kiến trúc"], ["building", "house", "architecture"]),
        (["ban do", "bản đồ", "map game"], ["map", "tileset", "tile"]),
        (["noi that", "nội thất", "phong ngu", "phòng ngủ", "bep", "bếp", "phong khach", "phòng khách"], ["interior", "furniture", "tileset"]),
        (["tileset", "tile set", "o vuong", "ô vuông", "luoi", "lưới"], ["tileset", "tile", "top-down"]),
        (["top down", "top-down", "nhin tu tren", "nhìn từ trên"], ["top-down", "tileset", "rpg"]),
        (["life sim", "mo phong cuoc song", "mô phỏng cuộc sống", "stardew", "cozy"], ["life-sim", "simulation", "cozy"]),
        (["moi truong", "môi trường", "canh quan", "cảnh quan"], ["environment", "tileset"]),
        (["giao dien", "giao diện", "menu", "nut bam", "nút bấm"], ["ui", "button", "interface", "input"]),
        (["am thanh", "âm thanh", "nhac nen", "nhạc nền", "nhac game", "nhạc game", "bgm"], ["audio", "music", "bgm", "loop"]),
        (["hieu ung am thanh", "sfx", "tieng ban", "tiếng bắn"], ["sfx", "audio"]),
        (["chiptune", "chip tune", "8bit", "8-bit", "nhac 8 bit"], ["chiptune", "retro", "music-pack"]),
        (["soundtrack", "nhac phim", "nhạc phim", "ost"], ["soundtrack", "bgm", "music-pack"]),
        (["vong lap", "vòng lặp", "loop nhac", "loop nhạc"], ["loop", "bgm", "music-pack"]),
        (["hanh dong", "hành động"], ["action"]),
        (["kinh di", "kinh dị", "ma", "má"], ["horror"]),
        (["the thao", "thể thao", "bong da", "bóng đá"], ["sports", "football"]),
        (["khoa hoc", "khoa học", "vu tru", "vũ trụ", "khong gian", "không gian"], ["sci-fi", "space", "futuristic"]),
        (["co dien", "cổ điện", "trung co", "trung cổ"], ["medieval", "fantasy"]),
        (["duong pho", "đường phố"], ["city", "street", "urban"]),
        (["nuoc", "nước", "bien", "biển"], ["water", "ocean"]),
        (["icon"], ["icon", "ui"]),
    ];

    public static void AppendEnglishSearchTerms(string prompt, Action<string> addTerm)
    {
        var normalized = AiReplyHelpers.NormalizeForSearch(prompt);
        if (string.IsNullOrWhiteSpace(normalized))
            return;

        foreach (var (triggers, englishTerms) in Mappings)
        {
            var matched = false;
            foreach (var trigger in triggers)
            {
                var triggerNorm = AiReplyHelpers.NormalizeForSearch(trigger);
                if (ContainsPhrase(normalized, triggerNorm))
                {
                    matched = true;
                    break;
                }
            }

            if (!matched)
                continue;

            foreach (var term in englishTerms)
                addTerm(term);
        }
    }

    private static bool ContainsPhrase(string normalized, string phrase)
    {
        if (string.IsNullOrWhiteSpace(phrase))
            return false;

        if (normalized == phrase)
            return true;

        if (normalized.Contains(' ' + phrase + ' ', StringComparison.Ordinal))
            return true;

        if (normalized.StartsWith(phrase + ' ', StringComparison.Ordinal))
            return true;

        if (normalized.EndsWith(' ' + phrase, StringComparison.Ordinal))
            return true;

        return false;
    }
}
