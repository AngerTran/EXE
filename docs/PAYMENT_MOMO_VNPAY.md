# Tích hợp MoMo & VNPay — Hướng dẫn

## Luồng tổng quát

```text
FE Checkout                    BE                           MoMo / VNPay
    |                            |                                |
    |-- POST /orders/subscription (paymentMethod: momo) ---------->|
    |<-- order (pending) + paymentId ------------------------------|
    |                            |                                |
    |-- POST /payments { orderId, paymentMethod: momo } ----------->|
    |                            |-- create payment (DB pending) |
    |                            |-- gọi API cổng ---------------->| tạo giao dịch
    |<-- { payUrl: "https://..." } -------------------------------|
    |-- window.location = payUrl --------------------------------->| user thanh toán
    |                            |<-- IPN/webhook (server) -------|
    |                            |-- fulfill order                 |
    |<-- redirect về FE returnUrl -----------------------------------|
    |-- GET /payments/by-order/{orderId} (poll) ------------------->|
```

**Quan trọng:** Tắt mock auto-pay khi dùng cổng thật:

```json
"Payment": {
  "AutoCompleteOnCreate": false,
  "ApiPublicBaseUrl": "https://your-api.example.com"
}
```

---

## 1. Đăng ký & lấy credentials

### MoMo (Payment Gateway)

1. Đăng ký [business.momo.vn](https://business.momo.vn) / developer sandbox.
2. Lấy: **Partner Code**, **Access Key**, **Secret Key**.
3. Sandbox API: `https://test-payment.momo.vn/v2/gateway/api/create`
4. Production: `https://payment.momo.vn/v2/gateway/api/create`
5. Cấu hình **IPN URL** trên portal (hoặc gửi `ipnUrl` mỗi request):
   - `https://your-api.example.com/api/v1/payments/webhook/momo`

### VNPay

1. Đăng ký merchant [vnpay.vn](https://vnpay.vn) → sandbox [sandbox.vnpayment.vn](https://sandbox.vnpayment.vn).
2. Lấy: **TMN Code**, **Hash Secret**.
3. Sandbox pay URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
4. **IPN URL** (bắt buộc HTTPS public, không localhost):
   - `https://your-api.example.com/api/v1/payments/webhook/vnpay`

---

## 2. Cấu hình BE (`appsettings.Development.json`)

```json
{
  "Payment": {
    "AutoCompleteOnCreate": false,
    "ApiPublicBaseUrl": "https://xxxx.ngrok-free.app",
    "FeReturnUrl": "http://localhost:5173/checkout/return",
    "WebhookSecret": "optional-internal-secret"
  },
  "Momo": {
    "Enabled": true,
    "PartnerCode": "MOMO_PARTNER",
    "AccessKey": "YOUR_ACCESS_KEY",
    "SecretKey": "YOUR_SECRET_KEY",
    "ApiEndpoint": "https://test-payment.momo.vn/v2/gateway/api/create"
  },
  "Vnpay": {
    "Enabled": true,
    "TmnCode": "YOUR_TMN",
    "HashSecret": "YOUR_HASH_SECRET",
    "PaymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "Version": "2.1.0"
  }
}
```

| Key | Ý nghĩa |
|-----|---------|
| `ApiPublicBaseUrl` | URL BE mà MoMo/VNPay gọi được (dùng **ngrok** khi dev local) |
| `FeReturnUrl` | Trang FE sau khi user thanh toán xong (có thể `?orderId=`) |
| `AutoCompleteOnCreate` | **false** khi dùng cổng thật |

**Không** commit SecretKey / HashSecret lên git.

---

## 3. API BE cho FE

### Tạo link thanh toán

```http
POST /api/v1/payments
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "orderId": "uuid-order",
  "paymentMethod": "momo"
}
```

Response:

```json
{
  "paymentId": "uuid",
  "orderId": "uuid",
  "amountVnd": 29000,
  "method": "momo",
  "status": "pending",
  "redirectUrl": "http://localhost:5173/checkout/return?orderId=...",
  "payUrl": "https://test-payment.momo.vn/..."
}
```

→ FE: `window.location.href = response.payUrl`

### Kiểm tra sau khi quay lại

```http
GET /api/v1/payments/by-order/{orderId}
```

Khi `status === "completed"` → hiển thị thành công.

---

## 4. Webhook / IPN

| Cổng | Endpoint BE | Kiểu |
|------|-------------|------|
| MoMo | `POST /api/v1/payments/webhook/momo` | JSON + chữ ký HMAC |
| VNPay | `GET /api/v1/payments/webhook/vnpay` | Query string + chữ ký |

`transactionId` / `vnp_TxnRef` map tới **Payment.Id** (GUID) lưu trong DB.

---

## 5. Dev local với ngrok

MoMo/VNPay **không** gọi được `localhost`. Cần tunnel:

```bash
ngrok http 5180
```

Đặt `Payment:ApiPublicBaseUrl` = URL ngrok (https).

---

## 6. FE (`Checkout.tsx`)

1. `POST /orders/subscription` với `paymentMethod: "momo"` hoặc `"vnpay"`.
2. Nếu `AutoCompleteOnCreate=false` và có `paymentId` → `POST /payments`.
3. Redirect `payUrl`.
4. Trang `/checkout/return` poll `GET /payments/by-order/{orderId}`.

`bank` / `card`: chưa có cổng — dùng chuyển khoản thủ công hoặc mở rộng sau.

---

## 7. Checklist go-live

- [ ] `AutoCompleteOnCreate: false` trên production
- [ ] Credentials production MoMo/VNPay
- [ ] `ApiPublicBaseUrl` HTTPS cố định
- [ ] IPN URL đăng ký đúng trên portal MoMo/VNPay
- [ ] Test webhook bằng sandbox
- [ ] FE redirect + poll trạng thái
