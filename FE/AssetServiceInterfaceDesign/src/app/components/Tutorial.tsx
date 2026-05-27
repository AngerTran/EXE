import { useState } from "react";
import { Link } from "react-router";
import { 
  ArrowRight, 
  CheckCircle, 
  Mouse, 
  Keyboard,
  Eye,
  ChevronRight,
  ChevronLeft,
  Home
} from "lucide-react";

interface Step {
  title: string;
  description: string;
  action: string;
  page: string;
  image: string;
  tips: string[];
}

export default function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: "Bước 1: Trang chủ",
      description: "Khám phá giao diện trang chủ",
      action: "Xem các tính năng và cách hoạt động của dịch vụ",
      page: "/",
      image: "🏠",
      tips: [
        "Xem hero section giới thiệu dịch vụ",
        "Tìm hiểu 4 tính năng chính",
        "Đọc quy trình hoạt động 4 bước",
        "Nhấn 'Bắt đầu ngay' hoặc 'Dùng thử miễn phí'"
      ]
    },
    {
      title: "Bước 2: Đăng ký tài khoản",
      description: "Tạo tài khoản để nhận 10 lượt miễn phí",
      action: "Nhấn nút 'Đăng nhập' trên thanh menu",
      page: "/auth",
      image: "👤",
      tips: [
        "Chọn 'Đăng ký ngay' nếu chưa có tài khoản",
        "Nhập tên, email và mật khẩu (tối thiểu 6 ký tự)",
        "Ví dụ: Tên: 'Nguyễn Văn A', Email: 'test@example.com', Mật khẩu: '123456'",
        "Nhấn 'Đăng ký' - Bạn sẽ tự động nhận 10 lượt miễn phí!"
      ]
    },
    {
      title: "Bước 3: Vào AI Dashboard",
      description: "Sử dụng AI để hỏi về assets",
      action: "Tự động chuyển đến Dashboard sau khi đăng ký",
      page: "/dashboard",
      image: "🤖",
      tips: [
        "Xem số lượt còn lại ở góc trên bên phải (10 lượt)",
        "Thử các câu hỏi nhanh: 'Assets nào cần cho game RPG 2D?'",
        "Hoặc gõ câu hỏi riêng: 'Tôi muốn làm game platformer giống Mario'",
        "Nhấn 'Gửi' hoặc Enter - Mỗi câu hỏi tiêu tốn 1 lượt"
      ]
    },
    {
      title: "Bước 4: Xem gợi ý từ AI",
      description: "AI phân tích và đưa ra gợi ý chi tiết",
      action: "Đọc câu trả lời từ AI Assistant",
      page: "/dashboard",
      image: "✨",
      tips: [
        "AI sẽ gợi ý các loại assets phù hợp (Character, Environment, UI...)",
        "Nhận link tham khảo nguồn assets (OpenGameArt, Kenney, Itch.io...)",
        "Tips về style, tools và best practices",
        "Hỏi thêm để được chi tiết hơn"
      ]
    },
    {
      title: "Bước 5: Hết lượt? Nạp thêm!",
      description: "Chọn gói phù hợp khi hết lượt miễn phí",
      action: "Nhấn 'Nạp thêm' hoặc vào menu 'Gói dịch vụ'",
      page: "/pricing",
      image: "💳",
      tips: [
        "Gói Cơ Bản: 99k cho 50 lượt (phổ biến nhất)",
        "Gói Pro: 299k cho 200 lượt + 3h tư vấn chuyên gia",
        "Xem thêm gói tư vấn trực tiếp với chuyên gia",
        "Chọn 'Mua Gói' để thanh toán"
      ]
    },
    {
      title: "Bước 6: Cần hỗ trợ chuyên sâu?",
      description: "Đặt lịch tư vấn trực tiếp với chuyên gia",
      action: "Vào trang 'Liên hệ' từ menu",
      page: "/contact",
      image: "📞",
      tips: [
        "Điền form: Tên, Email, Loại tư vấn",
        "Mô tả ý tưởng game và vấn đề cần giải quyết",
        "Chọn gói tư vấn: Cơ bản (1h), Chuyên sâu (3h), hoặc VIP",
        "Nhấn 'Gửi Yêu Cầu' - Nhận phản hồi trong 24h"
      ]
    },
    {
      title: "Bước 7: Đăng xuất",
      description: "Thoát tài khoản khi hoàn tất",
      action: "Nhấn nút 'Đăng xuất' trên thanh menu",
      page: "/",
      image: "👋",
      tips: [
        "Credits của bạn được lưu an toàn",
        "Đăng nhập lại bất cứ lúc nào để tiếp tục",
        "Lịch sử chat và số lượt vẫn được giữ nguyên",
        "Lần sau đăng nhập sẽ không mất dữ liệu"
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎓 Hướng Dẫn Sử Dụng
          </h1>
          <p className="text-xl text-gray-300">
            Thao tác từng bước để sử dụng GameAssets AI
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Tiến độ</span>
            <span className="text-sm text-purple-400 font-medium">
              Bước {currentStep + 1}/{steps.length}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
          {/* Step Icon */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">{currentStepData.image}</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-xl text-gray-300">{currentStepData.description}</p>
          </div>

          {/* Action */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Mouse className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-purple-200 font-bold mb-1">Thao tác:</p>
                <p className="text-white">{currentStepData.action}</p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-300 mb-4">
              <Eye className="w-5 h-5 text-purple-400" />
              <span className="font-bold">Chi tiết từng bước:</span>
            </div>
            {currentStepData.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 pl-4">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-200">{tip}</p>
              </div>
            ))}
          </div>

          {/* Direct Link */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <Link
              to={currentStepData.page}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all hover:scale-105"
            >
              Đi đến trang này <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Bước trước
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Bước tiếp theo
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all hover:scale-105"
            >
              Bắt đầu ngay!
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Quick Steps Overview */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            📋 Tổng quan nhanh
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`p-4 rounded-xl text-left transition-all ${
                  index === currentStep
                    ? "bg-purple-600 scale-105"
                    : index < currentStep
                    ? "bg-green-600/20 border border-green-500/30"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="text-3xl mb-2">{step.image}</div>
                <p className="text-sm font-medium text-white mb-1">
                  Bước {index + 1}
                </p>
                <p className="text-xs text-gray-300 line-clamp-2">
                  {step.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
