import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from "lucide-react";
import { BeamPanel } from "./BeamPanel";

export default function Privacy() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-green-600/20 rounded-xl mb-4">
            <Shield className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Chính Sách Bảo Mật</h1>
          <p className="text-muted-foreground">
            Cập nhật lần cuối: 6 tháng 6, 2026
          </p>
        </div>

        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg rounded-2xl border border-border p-8 space-y-8" beam={5}>

          <section>
            <div className="text-muted-foreground space-y-3">
              <p>
                AssetBox cam kết bảo vệ quyền riêng tư của bạn. Chính sách này mô tả dữ liệu chúng tôi thu thập, cách sử dụng và bảo vệ khi bạn dùng website hoặc ứng dụng di động AssetBox.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">1. Thông Tin Chúng Tôi Thu Thập</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <h3 className="text-xl font-semibold text-foreground">1.1. Thông tin bạn cung cấp</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Tài khoản:</strong> Email, tên hiển thị, ảnh đại diện (đăng ký email/mật khẩu hoặc đăng nhập Google qua Supabase Auth)</li>
                <li><strong>Hồ sơ & subscription:</strong> Gói đang dùng, số dư xu, lịch sử giao dịch ví</li>
                <li><strong>Đơn hàng:</strong> Loại đơn (subscription, gói nạp xu), số tiền, mã tham chiếu chuyển khoản — <strong>không</strong> lưu số thẻ hay thông tin tài khoản ngân hàng của bạn</li>
                <li><strong>AssetBox AI:</strong> Nội dung phiên chat và tin nhắn bạn gửi/nhận</li>
                <li><strong>Marketplace:</strong> Asset đã mua, giỏ hàng, đánh giá, bookmark, asset bạn đăng tải</li>
                <li><strong>Liên hệ:</strong> Nội dung form liên hệ (chủ đề, email, tin nhắn)</li>
                <li><strong>Thông báo:</strong> Lịch sử thông báo trong ứng dụng</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6">1.2. Thông tin tự động thu thập</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Nhật ký hệ thống:</strong> Địa chỉ IP, loại trình duyệt/thiết bị, thời gian truy cập API (phục vụ bảo mật và xử lý sự cố)</li>
                <li><strong>Token phiên:</strong> JWT lưu tạm trên trình duyệt (localStorage/sessionStorage) hoặc bộ nhớ an toàn trên ứng dụng di động để duy trì đăng nhập</li>
                <li><strong>Tùy chọn giao diện:</strong> Ví dụ chế độ sáng/tối (nếu bạn bật)</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">2. Cách Chúng Tôi Sử Dụng Thông Tin</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Vận hành dịch vụ:</strong> Xác thực, marketplace, ví xu, AI advisor, thư viện, thông báo</li>
                <li><strong>Xử lý đơn hàng:</strong> Tạo đơn, đối soát chuyển khoản, kích hoạt subscription hoặc cộng xu</li>
                <li><strong>AssetBox AI:</strong> Gửi nội dung tin nhắn tới API OpenAI để tạo phản hồi; lưu lịch sử phiên trong cơ sở dữ liệu của chúng tôi</li>
                <li><strong>Kiểm duyệt & an toàn:</strong> Phát hiện lạm dụng, spam hoặc vi phạm điều khoản</li>
                <li><strong>Hỗ trợ:</strong> Trả lời yêu cầu qua email hoặc form liên hệ</li>
                <li><strong>Thống kê nội bộ:</strong> Bảng điều khiển quản trị (doanh thu, đăng ký, v.v.) — không dùng cho quảng cáo bên thứ ba</li>
              </ul>
              <p>
                Chúng tôi <strong>không</strong> dùng nội dung chat của bạn để huấn luyện mô hình AI riêng, trừ khi có thông báo và sự đồng ý riêng trong tương lai.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">3. Bảo Mật Thông Tin</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Truyền tải:</strong> Kết nối HTTPS giữa client, API và các dịch vụ liên quan</li>
                <li><strong>Xác thực:</strong> Mật khẩu do Supabase Auth quản lý (không lưu plain text trên server AssetBox)</li>
                <li><strong>Phân quyền:</strong> Dữ liệu người dùng chỉ truy cập qua API có xác thực; khu vực quản trị yêu cầu quyền admin</li>
                <li><strong>Lưu trữ:</strong> Dữ liệu và file (asset, avatar) trên Supabase Storage/PostgreSQL</li>
              </ul>
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>
                    Không hệ thống nào an toàn tuyệt đối. Hãy dùng mật khẩu mạnh, bật bảo mật tài khoản Google (nếu dùng OAuth) và không chia sẻ token đăng nhập.
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">4. Chia Sẻ Với Bên Thứ Ba</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>Chúng tôi <strong>không</strong> bán dữ liệu cá nhân. Dữ liệu có thể được xử lý bởi:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Supabase:</strong> Cơ sở dữ liệu, xác thực, lưu trữ file</li>
                <li><strong>Google:</strong> Đăng nhập OAuth (nếu bạn chọn)</li>
                <li><strong>OpenAI:</strong> Xử lý tin nhắn AssetBox AI — tuân theo chính sách riêng của OpenAI</li>
                <li><strong>Nhà cung cấp hosting:</strong> Máy chủ API và triển khai frontend (ví dụ Render, Vercel)</li>
                <li><strong>Yêu cầu pháp lý:</strong> Khi luật pháp hoặc cơ quan có thẩm quyền yêu cầu</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">5. Quyền Của Bạn</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Truy cập & chỉnh sửa:</strong> Cập nhật tên, avatar trong phần Cài đặt tài khoản</li>
                <li><strong>Xóa tài khoản:</strong> Gửi yêu cầu qua support@assetbox.vn; chúng tôi xử lý trong thời gian hợp lý</li>
                <li><strong>Yêu cầu dữ liệu:</strong> Liên hệ email để biết dữ liệu chúng tôi lưu về bạn</li>
                <li><strong>Rút lại đồng ý:</strong> Ngừng sử dụng dịch vụ và yêu cầu xóa tài khoản</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">6. Lưu Trữ Dữ Liệu</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Dữ liệu được giữ trong thời gian tài khoản còn hoạt động và cần thiết cho vận hành dịch vụ</li>
                <li>Sau khi xóa tài khoản, dữ liệu cá nhân sẽ được xóa hoặc ẩ danh hóa trong thời gian hợp lý, trừ bản ghi đơn hàng cần lưu cho mục đích kế toán theo quy định</li>
                <li>File asset công khai do bạn đăng có thể được gỡ theo yêu cầu kiểm duyệt</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">7. Cookie & Lưu Trữ Cục Bộ</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>AssetBox hiện sử dụng:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Token đăng nhập:</strong> Lưu trên trình duyệt hoặc thiết bị để duy trì phiên</li>
                <li><strong>Tùy chọn UI:</strong> Ví dụ theme (nếu có)</li>
              </ul>
              <p>
                Chúng tôi <strong>không</strong> triển khai Google Analytics, cookie quảng cáo hoặc retargeting tại thời điểm cập nhật này. Nếu bổ sung công cụ phân tích, chúng tôi sẽ cập nhật chính sách trước khi áp dụng.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">8. Trẻ Em</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>
                Dịch vụ không hướng tới trẻ em dưới 13 tuổi. Nếu phát hiện thu thập dữ liệu trẻ em mà không có sự đồng ý phụ huynh, chúng tôi sẽ xóa khi được thông báo.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">9. Thay Đổi Chính Sách</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>
                Chúng tôi có thể cập nhật chính sách này. Ngày cập nhật hiển thị ở đầu trang. Thay đổi quan trọng có thể được thông báo qua email hoặc thông báo trong ứng dụng.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-foreground">10. Liên Hệ</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>Câu hỏi về quyền riêng tư:</p>
              <ul className="list-none space-y-2 ml-4">
                <li>Email: privacy@assetbox.vn hoặc support@assetbox.vn</li>
                <li>Form liên hệ: trang Liên hệ trên website/ứng dụng</li>
              </ul>
            </div>
          </section>

        </BeamPanel>

        <div className="mt-8 p-6 bg-green-600/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            Bằng việc sử dụng AssetBox, bạn đồng ý với việc thu thập và sử dụng thông tin theo chính sách này.
          </p>
        </div>
      </div>
    </div>
  );
}
