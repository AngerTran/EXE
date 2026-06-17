namespace Exe.Helpers;

/// <summary>HTML chuyển OAuth code/hash từ trình duyệt về deep link app Flutter.</summary>
public static class MobileOAuthRedirectHtml
{
    private const string AppDeepLinkBase = "vn.assetbox.app://auth/callback";
    private const string AndroidPackage = "vn.assetbox.assetbox_mobile";

    public static string Build(string message = "Đang quay lại AssetBox…")
    {
        var safeMessage = System.Text.Json.JsonSerializer.Serialize(message);
        var deepLink = System.Text.Json.JsonSerializer.Serialize(AppDeepLinkBase);
        var androidPackage = System.Text.Json.JsonSerializer.Serialize(AndroidPackage);

        return $$"""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Đang chuyển hướng…</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #131b2e; color: #dae2fd;
                  display: flex; flex-direction: column; align-items: center; justify-content: center;
                  min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
                a { color: #00d9ff; }
              </style>
            </head>
            <body>
              <p id="msg">{{message}}</p>
              <p id="fallback" style="display:none;margin-top:16px;font-size:14px;opacity:0.85">
                Nếu app không tự mở, <a id="openLink" href="#">bấm vào đây</a> hoặc quay lại AssetBox.
              </p>
              <script>
                (function () {
                  var deepLinkBase = {{deepLink}};
                  var pkg = {{androidPackage}};
                  var search = window.location.search || "";
                  var hash = window.location.hash || "";
                  var suffix = search || hash;
                  var target = deepLinkBase + suffix;
                  var intentTarget = "intent://auth/callback" + suffix +
                    "#Intent;scheme=vn.assetbox.app;package=" + pkg + ";end";
                  document.getElementById("openLink").href = target;
                  function openApp() {
                    window.location.replace(target);
                    setTimeout(function () {
                      window.location.replace(intentTarget);
                    }, 400);
                  }
                  openApp();
                  setTimeout(function () {
                    document.getElementById("fallback").style.display = "block";
                  }, 1200);
                })();
              </script>
            </body>
            </html>
            """;
    }
}
