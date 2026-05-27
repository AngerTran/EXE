import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-green-600/20 rounded-xl mb-4">
            <Shield className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Chính Sách Bảo Mật</h1>
          <p className="text-gray-400">
            Cập nhật lần cuối: 24 tháng 3, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 space-y-8">

          {/* Introduction */}
          <section>
            <div className="text-gray-300 space-y-3">
              <p>
                GameAssets AI cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, và bảo vệ thông tin cá nhân của bạn khi sử dụng dịch vụ.
              </p>
            </div>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">1. Thông Tin Chúng Tôi Thu Thập</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <h3 className="text-xl font-semibold text-white">1.1. Thông tin bạn cung cấp</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Thông tin tài khoản:</strong> Tên, email, mật khẩu (được mã hóa)</li>
                <li><strong>Thông tin thanh toán:</strong> Thông tin thẻ thanh toán được xử lý qua cổng thanh toán bên thứ ba bảo mật (không lưu trữ trên server của chúng tôi)</li>
                <li><strong>Nội dung tương tác:</strong> Câu hỏi bạn gửi đến AI Assistant, feedback, đánh giá</li>
                <li><strong>Thông tin liên hệ:</strong> Khi bạn đặt lịch tư vấn chuyên gia (số điện thoại, thông tin bổ sung)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">1.2. Thông tin tự động thu thập</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Dữ liệu sử dụng:</strong> Trang bạn truy cập, thời gian sử dụng, tính năng được sử dụng</li>
                <li><strong>Thông tin thiết bị:</strong> IP address, browser type, operating system, device identifier</li>
                <li><strong>Cookies:</strong> Chúng tôi sử dụng cookies để duy trì phiên đăng nhập và cải thiện trải nghiệm người dùng</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">2. Cách Chúng Tôi Sử Dụng Thông Tin</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>Chúng tôi sử dụng thông tin của bạn cho các mục đích sau:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cung cấp dịch vụ:</strong> Xử lý câu hỏi AI, cung cấp assets, quản lý tài khoản</li>
                <li><strong>Cải thiện AI Assistant:</strong> Training và fine-tuning AI models để cung cấp gợi ý chính xác hơn</li>
                <li><strong>Xử lý thanh toán:</strong> Quản lý subscriptions, xử lý giao dịch mua assets</li>
                <li><strong>Hỗ trợ khách hàng:</strong> Trả lời câu hỏi, giải quyết vấn đề kỹ thuật</li>
                <li><strong>Marketing:</strong> Gửi email thông báo về tính năng mới, khuyến mãi (bạn có thể unsubscribe bất kỳ lúc nào)</li>
                <li><strong>Phân tích:</strong> Hiểu cách người dùng sử dụng dịch vụ để cải thiện trải nghiệm</li>
                <li><strong>Bảo mật:</strong> Phát hiện và ngăn chặn gian lận, lạm dụng hệ thống</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">3. Bảo Mật Thông Tin</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>Chúng tôi áp dụng các biện pháp bảo mật tiên tiến:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Mã hóa:</strong> Mật khẩu được hash với bcrypt, dữ liệu được truyền qua HTTPS/SSL</li>
                <li><strong>Access Control:</strong> Chỉ nhân viên được ủy quyền mới có quyền truy cập dữ liệu</li>
                <li><strong>Regular Audits:</strong> Kiểm tra bảo mật định kỳ, cập nhật patches</li>
                <li><strong>Backup:</strong> Dữ liệu được backup thường xuyên và lưu trữ an toàn</li>
                <li><strong>Payment Security:</strong> Sử dụng payment gateways tuân thủ PCI-DSS standards</li>
              </ul>
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>
                    Tuy nhiên, không có hệ thống nào an toàn 100%. Chúng tôi khuyến nghị bạn sử dụng mật khẩu mạnh và không chia sẻ thông tin đăng nhập.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">4. Chia Sẻ Thông Tin</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>Chúng tôi <strong>KHÔNG</strong> bán thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin với:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Các đối tác xử lý thanh toán, email service, hosting (tất cả đều ký NDA)</li>
                <li><strong>AI Model Providers:</strong> Câu hỏi của bạn được gửi đến AI models (OpenAI, Google, etc.) để xử lý - họ không sử dụng dữ liệu để training models của họ</li>
                <li><strong>Legal Requirements:</strong> Khi được yêu cầu bởi luật pháp hoặc cơ quan chức năng</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">5. Quyền Của Bạn</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>Bạn có các quyền sau đối với dữ liệu cá nhân:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Truy cập:</strong> Yêu cầu xem dữ liệu chúng tôi lưu trữ về bạn</li>
                <li><strong>Chỉnh sửa:</strong> Cập nhật thông tin cá nhân trong phần Settings</li>
                <li><strong>Xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu (trừ dữ liệu cần thiết cho mục đích pháp lý)</li>
                <li><strong>Export:</strong> Download toàn bộ dữ liệu của bạn dưới định dạng JSON</li>
                <li><strong>Opt-out Marketing:</strong> Hủy đăng ký nhận email marketing bất kỳ lúc nào</li>
              </ul>
              <p className="mt-4">
                Để thực hiện các quyền này, vui lòng liên hệ: <strong>privacy@gameassets-ai.com</strong>
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">6. Lưu Trữ Dữ Liệu</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Thời gian lưu trữ:</strong> Dữ liệu được lưu trữ miễn là tài khoản của bạn còn active</li>
                <li><strong>Sau khi xóa tài khoản:</strong> Dữ liệu sẽ được xóa trong vòng 30 ngày, trừ dữ liệu cần giữ lại cho mục đích kế toán/pháp lý (tối đa 7 năm theo luật Việt Nam)</li>
                <li><strong>Backup:</strong> Dữ liệu trong backup có thể tồn tại thêm 90 ngày trước khi bị xóa hoàn toàn</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">7. Cookies & Tracking</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>Chúng tôi sử dụng cookies cho:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Duy trì phiên đăng nhập, preferences (không thể tắt)</li>
                <li><strong>Analytics Cookies:</strong> Google Analytics để hiểu cách người dùng sử dụng website (bạn có thể tắt)</li>
                <li><strong>Marketing Cookies:</strong> Retargeting ads (bạn có thể tắt)</li>
              </ul>
              <p className="mt-4">
                Bạn có thể quản lý cookies trong phần Settings của browser hoặc từ chối cookies khi truy cập website lần đầu.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">8. Trẻ Em</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>
                Dịch vụ của chúng tôi không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em. Nếu bạn là phụ huynh và phát hiện con bạn đã cung cấp thông tin cho chúng tôi, vui lòng liên hệ để chúng tôi xóa dữ liệu.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">9. Thay Đổi Chính Sách</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>
                Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Chúng tôi sẽ thông báo về các thay đổi quan trọng qua email hoặc thông báo trên website. Ngày cập nhật cuối cùng sẽ được hiển thị ở đầu trang.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">10. Liên Hệ</h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <p>
                Nếu bạn có bất kỳ câu hỏi nào về Chính sách bảo mật, vui lòng liên hệ:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li>📧 Email: privacy@gameassets-ai.com</li>
                <li>📱 Hotline: 1900-xxxx</li>
                <li>🏢 Địa chỉ: [Địa chỉ công ty của bạn]</li>
              </ul>
            </div>
          </section>

        </div>

        {/* Bottom Notice */}
        <div className="mt-8 p-6 bg-green-600/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-gray-400 text-center">
            Bằng việc sử dụng GameAssets AI, bạn đồng ý với việc thu thập và sử dụng thông tin theo Chính sách bảo mật này.
          </p>
        </div>
      </div>
    </div>
  );
}
