import { Check, Sparkles, Crown, Zap, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router";

export default function Pricing() {
  const navigate = useNavigate();

  const packages = [
    {
      name: "Miễn Phí",
      price: "10 xu",
      credits: 10,
      icon: <Sparkles className="w-8 h-8" />,
      color: "from-gray-600 to-gray-700",
      features: [
        "10 xu miễn phí khi đăng ký",
        "Gợi ý assets cơ bản",
        "Truy cập marketplace đầy đủ",
        "Hỗ trợ qua email",
      ],
      limitations: [
        "Giới hạn độ chi tiết",
      ],
      popular: false,
      packageType: "free",
    },
    {
      name: "STUDENT",
      price: "100 xu",
      period: "/tháng",
      credits: 100,
      icon: <GraduationCap className="w-8 h-8" />,
      color: "from-blue-600 to-cyan-600",
      features: [
        "100 xu/tháng",
        "Tất cả assets miễn phí",
        "Gợi ý assets chi tiết từ AI",
        "Hỗ trợ ưu tiên",
        "Tài liệu hướng dẫn tiếng Việt",
        "Tips & tricks cho sinh viên",
      ],
      limitations: [],
      popular: true,
      badge: "SẢN PHẨM CHỦ LỰC",
      packageType: "student",
    },
    {
      name: "INDIE",
      price: "∞ xu",
      period: "/tháng",
      credits: -1, // unlimited
      icon: <Zap className="w-8 h-8" />,
      color: "from-purple-600 to-purple-700",
      features: [
        "Không giới hạn xu (∞)",
        "Tất cả assets miễn phí",
        "Gợi ý assets tùy chỉnh từ AI",
        "Review assets miễn phí",
        "Hỗ trợ 24/7",
      ],
      limitations: [],
      popular: false,
      packageType: "indie",
    },
    {
      name: "PRO",
      price: "∞ xu",
      period: "/tháng",
      credits: -1, // unlimited
      icon: <Crown className="w-8 h-8" />,
      color: "from-yellow-600 to-orange-600",
      features: [
        "Không giới hạn xu (∞)",
        "Tất cả assets miễn phí",
        "Hỗ trợ Team (nhiều thành viên)",
        "Source code mẫu chất lượng cao",
        "Review dự án game",
        "Priority support 24/7",
        "Asset packs độc quyền",
      ],
      limitations: [],
      popular: false,
      packageType: "pro",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Chọn Gói Phù Hợp Với Bạn
          </h1>
          <p className="text-xl text-muted-foreground">
            Giá sinh viên - Phù hợp với mọi nhu cầu
          </p>
        </div>

        {/* AI Credits Packages */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Gói Xu Sử Dụng AI
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Đặc biệt dành cho sinh viên và người mới bắt đầu
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative bg-card/50 backdrop-blur-sm border rounded-xl p-6 transition-all hover:scale-105 ${
                  pkg.popular
                    ? "border-primary shadow-xl shadow-primary/20 lg:scale-105"
                    : "border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg">
                    {pkg.badge}
                  </div>
                )}

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  {pkg.icon}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2">{pkg.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground font-mono">{pkg.price}</span>
                  {pkg.period && (
                    <span className="text-sm text-muted-foreground">{pkg.period}</span>
                  )}
                  {pkg.credits > 0 ? (
                    <p className="text-muted-foreground text-sm mt-1 font-mono">{pkg.credits} xu/tháng</p>
                  ) : pkg.credits === -1 ? (
                    <p className="text-success text-sm mt-1 font-semibold">Không giới hạn ∞</p>
                  ) : (
                    <p className="text-muted-foreground text-sm mt-1">Dùng thử miễn phí</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {pkg.limitations.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Giới hạn:</p>
                    {pkg.limitations.map((limitation, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">×</span>
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (pkg.packageType === "free") {
                      navigate("/auth");
                    } else {
                      navigate(`/checkout?package=${pkg.packageType}`);
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    pkg.popular
                      ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                      : "bg-card border border-border hover:bg-card/80 hover:border-primary/50 text-foreground"
                  }`}
                >
                  {pkg.packageType === "free" ? "Đăng ký ngay" : "Mua Gói"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-20 bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 lg:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            💡 Lưu Ý Quan Trọng
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <p className="font-bold text-foreground mb-2">🎓 Giá sinh viên:</p>
              <p>Chỉ 29k/tháng cho gói STUDENT - giải quyết nỗi lo tài chính cho sinh viên CNTT/Game/Multimedia.</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-2">💰 Hoàn tiền:</p>
              <p>Hoàn 100% nếu không hài lòng trong vòng 7 ngày đầu tiên.</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-2">🎯 Hỗ trợ:</p>
              <p>Email support luôn sẵn sàng. INDIE & PRO users được ưu tiên phản hồi trong 2h.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}