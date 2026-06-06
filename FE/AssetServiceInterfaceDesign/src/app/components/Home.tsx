import { Link } from "react-router";
import { Sparkles, Zap, Brain, Palette, Code, ArrowRight, CheckCircle, Star, Boxes } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Phân Tích Thông Minh",
      description: "AI phân tích ý tưởng game của bạn và đưa ra góp ý về gameplay, mechanics và art style"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Kho Asset Phong Phú",
      description: "Hàng ngàn asset 2D, 3D, audio, UI miễn phí được phân loại rõ ràng"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Đề Xuất Tức Thì",
      description: "AI gợi ý asset phù hợp với ý tưởng game trong vài giây"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Dễ Sử Dụng",
      description: "Giao diện thân thiện, dễ hiểu cho người mới bắt đầu làm game"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Mô tả ý tưởng",
      description: "Chia sẻ ý tưởng game của bạn với AI - thể loại, gameplay, phong cách đồ họa"
    },
    {
      number: "02",
      title: "Nhận phân tích",
      description: "AI phân tích và đưa ra góp ý về mechanics, art style, hướng phát triển"
    },
    {
      number: "03",
      title: "Chọn asset",
      description: "Duyệt qua các asset được AI đề xuất hoặc tìm kiếm theo ý muốn"
    },
    {
      number: "04",
      title: "Bắt đầu tạo",
      description: "Tải asset miễn phí và bắt đầu xây dựng game của bạn"
    }
  ];

  const stats = [
    { value: "1000+", label: "Assets" },
    { value: "500+", label: "Người dùng" },
    { value: "98%", label: "Hài lòng" },
    { value: "24/7", label: "AI Support" }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm font-medium">Powered by AI</span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                Tìm Assets Cho Game{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-gradient">
                  Dễ Dàng Hơn
                </span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Hỗ trợ người mới bắt đầu phát triển game với AI phân tích ý tưởng và kho asset miễn phí chất lượng cao.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                >
                  Bắt đầu ngay <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center justify-center gap-2 bg-card hover:bg-card/80 text-foreground border border-border px-8 py-4 rounded-xl font-medium transition-all hover:scale-105"
                >
                  <Boxes className="w-5 h-5" />
                  Khám phá Assets
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center sm:text-left">
                    <div className="text-3xl font-bold text-primary font-mono">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-8 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl" />

                <div className="relative space-y-4">
                  {/* AI Chat Preview */}
                  <div className="bg-background/80 border border-primary/30 rounded-xl p-4 shadow-[0_0_20px_rgba(0,217,255,0.15)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">AI Assistant</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "Game platformer 2D phong cách retro với pixel art, nhân vật có thể nhảy đôi..."
                    </p>
                  </div>

                  <div className="bg-background/80 border border-secondary/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-secondary" />
                      <span className="text-sm font-medium text-foreground">Phân tích</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">Gameplay: Thêm wall-jump cho mobility</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">Art: Pixel art 16x16, palette 8-bit</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">Assets: Character sprites, tileset, SFX</span>
                      </div>
                    </div>
                  </div>

                  {/* Asset Preview */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square bg-background/80 border border-border rounded-lg flex items-center justify-center group hover:border-primary/50 transition-all">
                        <Palette className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl p-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-warning fill-warning" />
                  <div>
                    <div className="text-sm font-bold text-foreground">100 xu miễn phí</div>
                    <div className="text-xs text-muted-foreground">Cho tài khoản mới</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Tại sao chọn GameAssets AI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Giải pháp toàn diện cho người mới làm game
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:bg-card hover:border-primary/50 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.15)]"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors group-hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Cách hoạt động
            </h2>
            <p className="text-xl text-muted-foreground">
              4 bước đơn giản để bắt đầu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold font-mono mb-4 shadow-[0_0_30px_rgba(0,217,255,0.4)]">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border border-primary/30 rounded-2xl p-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMGQ5ZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI4YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyOGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

            <div className="relative text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Sẵn sàng bắt đầu?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Nhận ngay 100 xu miễn phí để trải nghiệm AI và khám phá kho assets
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-medium text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(0,217,255,0.6)]"
              >
                Tạo tài khoản miễn phí <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-sm text-muted-foreground mt-4">
                Không cần thẻ tín dụng • 100 xu miễn phí • Hủy bất cứ lúc nào
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
