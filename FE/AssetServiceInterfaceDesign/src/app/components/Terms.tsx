import { FileText, Shield, AlertCircle, Scale } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-purple-600/20 rounded-xl mb-4">
            <FileText className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Điều Khoản Sử Dụng</h1>
          <p className="text-gray-400">
            Cập nhật lần cuối: 24 tháng 3, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 space-y-8">

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">1. Chấp Nhận Điều Khoản</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>
                Bằng việc truy cập và sử dụng GameAssets AI, bạn đồng ý tuân theo các điều khoản và điều kiện được nêu dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">2. Dịch Vụ Cung Cấp</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>GameAssets AI cung cấp:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>AI Assistant:</strong> Hệ thống tư vấn AI hỗ trợ gợi ý và hướng dẫn sử dụng assets phù hợp với ý tưởng game của bạn</li>
                <li><strong>Assets Marketplace:</strong> Kho tài nguyên game (sprites, sounds, UI elements, etc.) có cả miễn phí và trả phí</li>
                <li><strong>Tư vấn chuyên gia:</strong> Dịch vụ tư vấn trực tiếp 1-1 với các chuyên gia game development (chỉ áp dụng cho gói INDIE và PRO)</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">3. Hệ Thống Credits & Gói Dịch Vụ</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <h3 className="text-xl font-semibold text-white">3.1. Hệ thống Credits</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Mỗi câu hỏi gửi đến AI Assistant tiêu tốn 1 credit</li>
                <li>Credits được cung cấp theo gói dịch vụ bạn đăng ký</li>
                <li>Credits không được hoàn lại khi hủy gói</li>
                <li>Credits hết hạn khi chu kỳ thanh toán kết thúc (không chuyển sang tháng sau)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">3.2. Các gói dịch vụ</h3>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold text-white">FREE (10 xu)</h4>
                  <p>20 lượt hỏi AI miễn phí, truy cập Assets miễn phí</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold text-white">STUDENT (100 xu/tháng)</h4>
                  <p>100 lượt hỏi AI/tháng, Full Assets Library access</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold text-white">INDIE (∞ xu/tháng)</h4>
                  <p>Unlimited AI queries, 1 giờ tư vấn trực tiếp/tháng, Priority support</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold text-white">PRO (∞ xu/tháng)</h4>
                  <p>Unlimited AI queries, Team collaboration tools, Unlimited consulting hours</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mt-6">3.3. Thanh toán & Hoàn tiền</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Thanh toán được xử lý hàng tháng (recurring subscription)</li>
                <li>Bạn có thể hủy gói bất kỳ lúc nào, dịch vụ sẽ còn hiệu lực đến hết chu kỳ thanh toán</li>
                <li><strong>Chính sách không hoàn tiền:</strong> Chúng tôi không hoàn lại tiền cho các gói đã thanh toán, trừ trường hợp lỗi kỹ thuật từ phía chúng tôi</li>
              </ul>
            </div>
          </section>

          {/* Section 4 - Copyright */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">4. Bản Quyền & Sở Hữu Trí Tuệ</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <h3 className="text-xl font-semibold text-white">4.1. Assets từ Marketplace</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Giấy phép sử dụng:</strong> Khi bạn tải xuống asset từ Marketplace, bạn được cấp giấy phép sử dụng không độc quyền để sử dụng trong các dự án game của mình</li>
                <li><strong>Quyền sử dụng thương mại:</strong> Assets có thể được sử dụng trong các dự án thương mại (game bán ra) mà không cần trả thêm phí</li>
                <li><strong>Không được phân phối lại:</strong> Bạn KHÔNG được phép bán, phân phối lại, hoặc chia sẻ assets dưới dạng tài nguyên đơn lẻ. Assets chỉ được sử dụng trong game đã được tích hợp</li>
                <li><strong>Không chuyển nhượng:</strong> Giấy phép không được chuyển nhượng cho bên thứ ba</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">4.2. Nội dung do AI tạo ra</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Các gợi ý và hướng dẫn từ AI Assistant thuộc quyền sở hữu của bạn sau khi được tạo ra</li>
                <li>Bạn có thể sử dụng các gợi ý này cho bất kỳ mục đích nào, bao gồm thương mại</li>
                <li>GameAssets AI không chịu trách nhiệm cho việc sử dụng các gợi ý từ AI</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">4.3. Bản quyền của chúng tôi</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tất cả nội dung trên website (logo, design, code, AI models) thuộc sở hữu của GameAssets AI</li>
                <li>Bạn không được phép sao chép, phân phối, hoặc tạo phiên bản tương tự của dịch vụ</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">5. Trách Nhiệm Người Dùng</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>Bạn đồng ý:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sử dụng dịch vụ một cách hợp pháp và tuân thủ luật pháp Việt Nam</li>
                <li>Không sử dụng dịch vụ cho mục đích bất hợp pháp hoặc gây hại</li>
                <li>Không cố gắng xâm nhập, phá hoại, hoặc làm gián đoạn hệ thống</li>
                <li>Không sử dụng bot, script, hoặc công cụ tự động để khai thác dịch vụ</li>
                <li>Bảo mật thông tin đăng nhập của bạn</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">6. Giới Hạn Trách Nhiệm</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>GameAssets AI cung cấp dịch vụ "AS IS" (như hiện tại) mà không có bảo đảm nào</li>
                <li>Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng dịch vụ</li>
                <li>AI Assistant chỉ mang tính chất tham khảo, chúng tôi không đảm bảo tính chính xác 100% của các gợi ý</li>
                <li>Chúng tôi có quyền tạm ngưng dịch vụ để bảo trì mà không cần thông báo trước</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">7. Thay Đổi Điều Khoản</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>
                Chúng tôi có quyền cập nhật các Điều khoản sử dụng bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi các thay đổi được đăng tải đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">8. Liên Hệ</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>
                Nếu bạn có bất kỳ câu hỏi nào về Điều khoản sử dụng, vui lòng liên hệ:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li>📧 Email: support@gameassets-ai.com</li>
                <li>📱 Hotline: 1900-xxxx</li>
                <li>🏢 Địa chỉ: [Địa chỉ công ty của bạn]</li>
              </ul>
            </div>
          </section>

        </div>

        {/* Bottom Notice */}
        <div className="mt-8 p-6 bg-purple-600/10 border border-purple-500/20 rounded-xl">
          <p className="text-sm text-gray-400 text-center">
            Bằng việc sử dụng GameAssets AI, bạn xác nhận rằng đã đọc, hiểu và đồng ý với các Điều khoản sử dụng này.
          </p>
        </div>
      </div>
    </div>
  );
}
