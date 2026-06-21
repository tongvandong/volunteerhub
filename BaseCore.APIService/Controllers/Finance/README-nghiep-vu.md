# Phần 3 - Donation / Sponsorship / Financial Report

Tài liệu này mô tả nghiệp vụ của phần Finance để thành viên phụ trách hiểu phạm vi, role, chức năng, luồng xử lý và các rule chính.

## 1. Mục tiêu

Phần Finance quản lý các hoạt động tài chính minh bạch quanh event:

- Volunteer ủng hộ cá nhân vào campaign.
- Organizer xác nhận khoản ủng hộ.
- Sponsor gửi đề nghị tài trợ doanh nghiệp.
- Organizer duyệt/từ chối đề nghị tài trợ.
- Ghi nhận tài trợ đã nhận.
- Báo cáo sử dụng tài trợ.
- Tổng hợp báo cáo tài chính theo event.

Phần này không thay thế hệ thống thanh toán thật. Trong phạm vi demo, hệ thống ghi nhận và xác nhận khoản đóng góp/tài trợ.

## 2. Role liên quan

### Volunteer

- Xem campaign đang mở của event.
- Gửi khoản ủng hộ cá nhân.
- Xem các khoản ủng hộ của chính mình.
- Có thể chọn công khai tên hoặc ẩn danh nếu hệ thống hỗ trợ.

### Organizer

- Tạo campaign kêu gọi ủng hộ cho event của mình.
- Mô tả mục đích kêu gọi.
- Cấu hình mục tiêu tiền, thời gian bắt đầu/kết thúc.
- Xem donation gửi vào campaign.
- Confirm/reject donation.
- Xem sponsor proposal gửi tới event của mình.
- Accept/reject sponsorship proposal.
- Xác nhận tài trợ đã nhận.
- Tạo báo cáo sử dụng tài trợ.

### Sponsor

- Xem event có nhu cầu tài trợ.
- Gửi đề nghị tài trợ doanh nghiệp.
- Nhập thông tin doanh nghiệp, số tiền đề nghị, nội dung tài trợ.
- Xem trạng thái proposal của mình.
- Cập nhật thông tin proposal nếu còn cho phép.
- Xem báo cáo/tình trạng tài trợ của proposal liên quan.

### Admin

- Xem/export báo cáo tổng hợp.
- Theo dõi dữ liệu donation/sponsorship.
- Kiểm tra minh bạch tài chính khi cần.

## 3. Chức năng chính

### Support Campaign

- Organizer tạo campaign gắn với event.
- Campaign chỉ nên tạo cho event thuộc organizer đó.
- Campaign có:
  - Tiêu đề.
  - Mô tả.
  - Số tiền mục tiêu.
  - Số tiền tối thiểu nếu cần.
  - Thời gian bắt đầu.
  - Thời gian kết thúc.
  - Trạng thái mở/đóng.
- Volunteer chỉ ủng hộ được campaign đang mở.

### Individual Donation

- Volunteer gửi khoản ủng hộ cá nhân.
- Hệ thống kiểm tra số tiền hợp lệ.
- Không cho nhập số tiền âm hoặc bằng 0.
- Donation ban đầu có thể ở trạng thái Pending.
- Organizer confirm sau khi xác nhận đã nhận tiền.
- Donation confirmed mới được tính vào báo cáo tài chính.

### Sponsorship Proposal

- Sponsor gửi đề nghị tài trợ cho event.
- Proposal gồm:
  - Tên doanh nghiệp/tổ chức.
  - Số tiền đề nghị.
  - Nội dung tài trợ.
  - Ghi chú hoặc cam kết.
  - Thông tin liên hệ nếu cần.
- Organizer accept/reject proposal.
- Sau khi accepted, proposal có thể chuyển sang received khi đã nhận tài trợ.
- Sau khi received, organizer/sponsor cập nhật report sử dụng tài trợ nếu có.

### Financial Report

- Tổng hợp donation confirmed.
- Tổng hợp sponsorship accepted/received/reported.
- Hiển thị tổng tiền theo event.
- Hiển thị campaign và tiến độ đạt mục tiêu.
- Render báo cáo tài chính cho admin/organizer/sponsor.
- Module phụ đề xuất: Ruby Financial Report Renderer.

## 4. Luồng nghiệp vụ chính

### Luồng organizer tạo campaign

```text
1. Organizer đăng nhập.
2. Organizer vào trang quản lý event của mình.
3. Organizer bấm tạo campaign kêu gọi ủng hộ.
4. Organizer nhập tiêu đề, mô tả, mục tiêu tiền, thời gian.
5. Backend kiểm tra event thuộc organizer.
6. Backend tạo campaign.
7. Campaign hiển thị ở event detail nếu đang mở.
```

### Luồng volunteer ủng hộ cá nhân

```text
1. Volunteer đăng nhập.
2. Volunteer vào chi tiết event.
3. Volunteer xem campaign đang mở.
4. Volunteer nhập số tiền ủng hộ.
5. Backend kiểm tra số tiền > 0 và campaign còn mở.
6. Hệ thống tạo donation Pending.
7. Organizer xác nhận đã nhận tiền.
8. Donation chuyển sang Confirmed.
9. Số tiền được cộng vào báo cáo tài chính của event.
```

### Luồng sponsor gửi đề nghị tài trợ

```text
1. Sponsor đăng nhập.
2. Sponsor xem event.
3. Sponsor gửi proposal tài trợ.
4. Backend kiểm tra event tồn tại và hợp lệ.
5. Proposal ở trạng thái Pending.
6. Organizer của event xem proposal.
7. Organizer accept hoặc reject.
8. Nếu accept, proposal chuyển sang Accepted.
```

### Luồng xác nhận đã nhận và báo cáo tài trợ

```text
1. Proposal đã được organizer accept.
2. Organizer hoặc sponsor cập nhật trạng thái đã nhận tài trợ.
3. Proposal chuyển sang Received.
4. Organizer tạo report sử dụng tài trợ.
5. Proposal chuyển sang Reported nếu report hợp lệ.
6. Dữ liệu được đưa vào báo cáo tài chính event.
```

### Luồng render báo cáo bằng Ruby

```text
1. Finance Service tổng hợp dữ liệu event, campaigns, donations, sponsorships.
2. Finance Service gọi Ruby Financial Report Renderer.
3. Ruby render HTML/PDF/CSV từ template.
4. Ruby trả về đường dẫn file report hoặc nội dung report.
5. Finance Service lưu metadata report.
6. Admin/organizer/sponsor xem hoặc tải báo cáo.
```

## 5. Rule nghiệp vụ quan trọng

- Volunteer không cần dùng tài khoản sponsor để ủng hộ cá nhân.
- Sponsor dùng tài khoản sponsor khi tài trợ với tư cách doanh nghiệp/tổ chức.
- Organizer chỉ tạo campaign cho event của mình.
- Volunteer chỉ ủng hộ campaign đang mở.
- Không cho donation số tiền âm, bằng 0 hoặc không hợp lệ.
- Donation chỉ được tính vào tổng khi đã confirmed.
- Sponsor chỉ xem proposal của mình.
- Organizer chỉ accept/reject proposal của event mình quản lý.
- Proposal rejected không được chuyển sang received/reported.
- Proposal accepted có thể bị hủy/chỉnh tùy rule, nhưng cần log/audit nếu đã accepted.
- Báo cáo tài chính nên phân biệt:
  - Ủng hộ cá nhân đã xác nhận.
  - Tài trợ doanh nghiệp đã accept.
  - Tài trợ doanh nghiệp đã received.
  - Tài trợ doanh nghiệp đã reported.

## 6. API/Controller liên quan

Folder chính:

- `BaseCore.APIService/Controllers/Finance/`

Controller/API tiêu biểu:

- Support campaign API.
- Donation API.
- Sponsorship proposal API.
- Sponsor API.
- Admin export/financial report nếu có.

Phụ thuộc dữ liệu:

- Identity: cần kiểm tra role volunteer, organizer, sponsor.
- Event: cần kiểm tra event tồn tại, event thuộc organizer nào, event đã approved chưa.

## 7. Tiêu chí hoàn thành

- Organizer tạo campaign cho event của mình được.
- Organizer không tạo được campaign cho event của người khác.
- Volunteer ủng hộ campaign đang mở được.
- Volunteer nhập số tiền âm/bằng 0 bị chặn.
- Organizer confirm donation được.
- Donation confirmed được tính vào tổng tài chính.
- Sponsor gửi proposal tài trợ được.
- Organizer accept/reject proposal được.
- Proposal accepted chuyển sang received được.
- Proposal received tạo report được.
- Báo cáo tài chính hiển thị đúng donation và sponsorship.
- Ruby report renderer có thể render báo cáo từ dữ liệu Finance Service.
