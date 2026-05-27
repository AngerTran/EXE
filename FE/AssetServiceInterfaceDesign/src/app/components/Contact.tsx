import { useState } from "react";
import { Mail, MessageSquare, Calendar, Send, CheckCircle } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gameIdea: "",
    consultType: "basic",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log("Form submitted:", formData);
    setSubmitted(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        gameIdea: "",
        consultType: "basic",
        message: "",
      });
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      value: "support@gameassets.ai",
      description: "Phản hồi trong 24h",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Chat",
      value: "Zalo/Telegram",
      description: "Phản hồi nhanh",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Đặt Lịch",
      value: "Video Call",
      description: "Tư vấn trực tiếp",
    },
  ];

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Liên Hệ Chuyên Gia
          </h1>
          <p className="text-xl text-gray-300">
            Chúng tôi sẵn sàng hỗ trợ bạn với mọi thắc mắc
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
                {method.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{method.title}</h3>
              <p className="text-purple-300 font-medium mb-1">{method.value}</p>
              <p className="text-gray-400 text-sm">{method.description}</p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Đặt Lịch Tư Vấn
            </h2>

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Gửi thành công!
                </h3>
                <p className="text-gray-300">
                  Chúng tôi sẽ liên hệ với bạn trong vòng 24h.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Loại tư vấn *
                  </label>
                  <select
                    name="consultType"
                    value={formData.consultType}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="basic" className="bg-slate-800">Tư vấn cơ bản (1h)</option>
                    <option value="advanced" className="bg-slate-800">Tư vấn chuyên sâu (3h)</option>
                    <option value="vip" className="bg-slate-800">Gói VIP (Trọn gói)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ý tưởng game của bạn
                  </label>
                  <textarea
                    name="gameIdea"
                    value={formData.gameIdea}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Mô tả ngắn gọn về game của bạn..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nội dung cần tư vấn *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Bạn cần hỗ trợ về vấn đề gì?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Gửi Yêu Cầu
                </button>

                <p className="text-sm text-gray-400 text-center">
                  Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ
                </p>
              </form>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Working Hours */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                ⏰ Giờ Làm Việc
              </h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span>Thứ 2 - Thứ 6:</span>
                  <span className="text-white font-medium">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Thứ 7:</span>
                  <span className="text-white font-medium">9:00 - 15:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Chủ nhật:</span>
                  <span className="text-white font-medium">Nghỉ</span>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                ❓ Câu Hỏi Thường Gặp
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-white mb-1">
                    Tư vấn có miễn phí không?
                  </p>
                  <p className="text-gray-300 text-sm">
                    Tư vấn qua email miễn phí. Video call theo gói dịch vụ.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">
                    Có thể đặt lịch ngoài giờ không?
                  </p>
                  <p className="text-gray-300 text-sm">
                    Có, vui lòng ghi chú trong form và chúng tôi sẽ sắp xếp.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">
                    Tư vấn bằng tiếng gì?
                  </p>
                  <p className="text-gray-300 text-sm">
                    Tiếng Việt hoặc tiếng Anh, tùy theo yêu cầu.
                  </p>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">
                ⚡ Thời Gian Phản Hồi
              </h3>
              <div className="space-y-3 text-gray-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Email: 24 giờ</p>
                    <p className="text-sm text-gray-300">Ngày làm việc</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Chat: 2-4 giờ</p>
                    <p className="text-sm text-gray-300">Pro users được ưu tiên</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Video Call: Đặt trước 24h</p>
                    <p className="text-sm text-gray-300">Linh hoạt theo lịch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
