import { FileText, Shield, AlertCircle, Scale } from "lucide-react";
import { BeamPanel } from "./BeamPanel";

export default function Terms() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-purple-600/20 rounded-xl mb-4">
            <FileText className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Điều Khoản Sử Dụng</h1>
          <p className="text-muted-foreground">
            Cập nhật lần cuối: 6 tháng 6, 2026
          </p>
        </div>

        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg rounded-2xl border border-border p-8 space-y-8" beam={5}>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">1. Chấp Nhận Điều Khoản</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>
                Bằng việc truy cập và sử dụng AssetBox (website và ứng dụng di động), bạn đồng ý tuân theo các điều khoản dưới đây. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">2. Dịch Vụ Cung Cấp</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>AssetBox là nền tảng marketplace tài nguyên game tích hợp AI, bao gồm:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>AssetBox AI:</strong> Chat tư vấn và gợi ý asset phù hợp dự án game; hỗ trợ tạo outline/dàn ý game (nội dung mang tính tham khảo)</li>
                <li><strong>Marketplace:</strong> Duyệt, mua và tải asset (sprite, âm thanh, UI, v.v.) bằng xu trong ví; có asset miễn phí và trả phí</li>
                <li><strong>Thư viện cá nhân:</strong> Quản lý asset đã mua/tải, đánh giá và bình luận</li>
                <li><strong>Đăng tải asset:</strong> Người dùng có thể đăng asset lên marketplace; nội dung được kiểm duyệt trước khi hiển thị</li>
                <li><strong>Gói subscription & gói nạp xu:</strong> Nâng cấp quyền lợi và bổ sung xu qua thanh toán chuyển khoản</li>
                <li><strong>Thông báo trong ứng dụng:</strong> Cập nhật đơn hàng, subscription và hoạt động liên quan</li>
                <li><strong>Liên hệ:</strong> Form gửi yêu cầu hỗ trợ; phản hồi tùy thuộc khả năng xử lý của đội ngũ, không phải dịch vụ tư vấn 1-1 theo giờ cam kết sẵn</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">3. Hệ Thống Xu & Gói Dịch Vụ</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <h3 className="text-xl font-semibold text-foreground">3.1. Xu (credits)</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Mỗi tin nhắn gửi tới AssetBox AI tiêu tốn <strong>1 xu</strong> (trừ gói có xu không giới hạn)</li>
                <li>Tài khoản mới được tặng <strong>100 xu</strong> một lần khi đăng ký</li>
                <li>Asset trả phí trên marketplace được mua bằng xu trong ví, không trừ trực tiếp bằng tiền mặt/chuyển khoản</li>
                <li>Xu không có giá trị quy đổi thành tiền mặt và không được chuyển nhượng giữa các tài khoản</li>
                <li>Xu đã sử dụng hoặc đã cấp theo gói không được hoàn lại, trừ khi có lỗi kỹ thuật từ phía AssetBox</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6">3.2. Gói subscription</h3>
              <p>Giá và quyền lợi chi tiết hiển thị tại trang Bảng giá. Các gói chính:</p>
              <div className="space-y-4">
                <div className="bg-muted/40 border border-border p-4 rounded-lg">
                  <h4 className="font-bold text-foreground">FREE</h4>
                  <p>100 xu tặng khi đăng ký; truy cập marketplace và AI theo số xu còn lại</p>
                </div>
                <div className="bg-muted/40 border border-border p-4 rounded-lg">
                  <h4 className="font-bold text-foreground">STUDENT</h4>
                  <p>Gói trả phí theo tháng; cấp xu định kỳ (ví dụ 1.000 xu/tháng theo cấu hình hiện tại)</p>
                </div>
                <div className="bg-muted/40 border border-border p-4 rounded-lg">
                  <h4 className="font-bold text-foreground">PRO</h4>
                  <p>Gói trả phí theo tháng; xu không giới hạn cho AssetBox AI và quyền lợi nâng cao theo mô tả gói</p>
                </div>
              </div>
              <p className="text-sm">
                AssetBox có thể bổ sung hoặc điều chỉnh gói; thông tin trên trang Bảng giá tại thời điểm thanh toán là căn cứ áp dụng.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6">3.3. Gói nạp xu (credit packs)</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Dành cho thành viên đang có gói trả phí (STUDENT hoặc PRO, tùy chính sách hiện hành)</li>
                <li>Mua một lần bằng chuyển khoản; xu được cộng vào ví sau khi đơn được xác nhận</li>
                <li>Giá và số xu của từng gói hiển thị tại trang Bảng giá</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6">3.4. Thanh toán & hoàn tiền</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Subscription và gói nạp xu thanh toán bằng <strong>chuyển khoản ngân hàng</strong> theo hướng dẫn trên trang thanh toán</li>
                <li>AssetBox <strong>không</strong> thu thập hoặc lưu thông tin thẻ tín dụng/ghi nợ; không có thanh toán tự động định kỳ qua thẻ</li>
                <li>Đơn hàng được xác nhận thủ công bởi quản trị viên sau khi đối soát chuyển khoản; thời gian kích hoạt phụ thuộc quy trình xử lý</li>
                <li>Bạn chịu trách nhiệm nhập đúng mã đơn/nội dung chuyển khoản theo hướng dẫn</li>
                <li><strong>Chính sách không hoàn tiền:</strong> Không hoàn tiền cho gói đã kích hoạt, trừ lỗi kỹ thuật hoặc trùng lặp thanh toán do hệ thống</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">4. Bản Quyền & Sở Hữu Trí Tuệ</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <h3 className="text-xl font-semibold text-foreground">4.1. Asset trên marketplace</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Quyền sở hữu asset thuộc người đăng tải hoặc bên được cấp phép</li>
                <li>Khi mua/tải asset, bạn nhận giấy phép sử dụng theo mô tả từng asset (thường là sử dụng trong dự án game, không phân phối lại dưới dạng tài nguyên đơn lẻ)</li>
                <li>Bạn không được bán lại, chia sẻ công khai hoặc phân phối lại asset nếu license không cho phép</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6">4.2. Nội dung từ AssetBox AI</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Gợi ý và outline do AI tạo mang tính tham khảo; bạn tự chịu trách nhiệm khi áp dụng vào dự án thương mại</li>
                <li>AssetBox không đảm bảo nội dung AI không trùng lặp hoặc không vi phạm quyền của bên thứ ba</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6">4.3. Nội dung bạn đăng tải</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Bạn cam kết có quyền hợp pháp đối với asset đăng tải</li>
                <li>Bạn cấp cho AssetBox quyền lưu trữ, hiển thị và phân phối asset trên nền tảng theo mô hình marketplace</li>
                <li>AssetBox có quyền gỡ hoặc từ chối asset vi phạm bản quyền, pháp luật hoặc điều khoản</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6">4.4. Nền tảng AssetBox</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Giao diện, thương hiệu, mã nguồn và hệ thống AssetBox thuộc quyền sở hữu của AssetBox</li>
                <li>Không sao chép, reverse-engineer hoặc tái tạo dịch vụ mà không có sự đồng ý bằng văn bản</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">5. Trách Nhiệm Người Dùng</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>Bạn đồng ý:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sử dụng dịch vụ hợp pháp và tuân thủ pháp luật Việt Nam</li>
                <li>Không đăng tải nội dung vi phạm bản quyền, bạo lực, phân biệt đối xử hoặc gian lận</li>
                <li>Không cố xâm nhập, phá hoại hoặc lạm dụng hệ thống (bot, spam AI, gian lận thanh toán)</li>
                <li>Bảo mật thông tin đăng nhập; mọi hoạt động dưới tài khoản của bạn do bạn chịu trách nhiệm</li>
                <li>Đánh giá/bình luận trung thực; không quấy rối người dùng khác</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">6. Giới Hạn Trách Nhiệm</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Dịch vụ được cung cấp &quot;nguyên trạng&quot; (as-is) trong phạm vi dự án học tập/demo</li>
                <li>AssetBox không chịu trách nhiệm thiệt hại gián tiếp từ việc sử dụng asset, gợi ý AI hoặc gián đoạn dịch vụ</li>
                <li>Chúng tôi có thể tạm ngưng, bảo trì hoặc thay đổi tính năng mà không cần thông báo trước trong trường hợp khẩn cấp</li>
                <li>Chúng tôi có quyền đình chỉ tài khoản vi phạm điều khoản</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">7. Thay Đổi Điều Khoản</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>
                Chúng tôi có thể cập nhật điều khoản bất kỳ lúc nào. Phiên bản mới có hiệu lực khi đăng trên website/ứng dụng. Việc tiếp tục sử dụng dịch vụ đồng nghĩa bạn chấp nhận điều khoản mới.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">8. Liên Hệ</h2>
            </div>
            <div className="text-muted-foreground space-y-3">
              <p>Câu hỏi về điều khoản sử dụng, vui lòng liên hệ:</p>
              <ul className="list-none space-y-2 ml-4">
                <li>Email: support@assetbox.vn</li>
                <li>Form liên hệ: trang Liên hệ trên website/ứng dụng</li>
              </ul>
            </div>
          </section>

        </BeamPanel>

        <div className="mt-8 p-6 bg-purple-600/10 border border-purple-500/20 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            Bằng việc sử dụng AssetBox, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản trên.
          </p>
        </div>
      </div>
    </div>
  );
}
