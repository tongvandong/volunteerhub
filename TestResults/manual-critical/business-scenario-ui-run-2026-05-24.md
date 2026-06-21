# Kết quả chạy UI - kich-ban-nghiep-vu-thuc-te.md

Ngày chạy: 2026-05-24

Rule áp dụng:

- Chỉ thao tác qua UI trình duyệt.
- Không gọi API/Postman/curl/SQL để thay thao tác UI.
- API/database không được dùng để tạo dữ liệu thay UI.

## Dữ liệu tạo trong phiên

- Event không chia ca: `UI Thuc Te Khong Ca 132147`
- Event điểm danh gần giờ: `UI Diem Danh Khong Ca 405809`
- Event có ca: `UI Su Kien Co Ca 580852`
- Campaign: `Quy goi UI`
- Sponsor proposal: `Tai tro UI`

## Kết quả theo nhóm kịch bản

| Mã | Kịch bản | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| 2.1 | Organizer tạo event không chia ca, admin duyệt | Đạt | Tạo qua UI, admin duyệt qua UI, event public. Ban đầu phát hiện UI thiếu field thời gian, đã sửa rồi chạy lại đạt. |
| 2.2 | Organizer tạo event rồi chia ca trước khi có đăng ký | Không đạt | UI hiện nút `Chia ca` đúng khi chưa có đăng ký, nhưng modal tạo ca không tạo được ca và không hiển thị lỗi rõ. Không bypass API. |
| 2.3 | Event đã có đăng ký thì không cho chia ca | Đạt | Sau khi volunteer đăng ký event không chia ca, màn quản lý không còn nút `Chia ca`. |
| 3.1 | Volunteer đăng ký event không chia ca | Đạt | Volunteer đăng ký qua UI, registration chuyển `Pending`. |
| 3.2 | Volunteer đăng ký event có ca | Không đạt | Bị chặn bởi lỗi 2.2 vì chưa tạo được ca qua UI. |
| 3.3 | Volunteer chưa KYC đăng ký event yêu cầu KYC | Chưa áp dụng được | Chưa chạy được trong phiên này vì ưu tiên các luồng lõi; cần tạo event KYC riêng qua UI. |
| 4.1 | Organizer xác nhận volunteer | Đạt | Organizer xác nhận registration pending qua UI, số đã xác nhận tăng. |
| 4.2 | Organizer từ chối/hủy đăng ký | Chưa áp dụng được | Chưa tạo thêm registration phụ để hủy, tránh phá luồng chính. |
| 4.3 | Volunteer xin hủy đăng ký | Chưa áp dụng được | Registration đã được confirmed nên UI không cho rút trực tiếp. |
| 5.1 | Volunteer tự check-in QR | Không đạt | Event gần giờ bị UI coi là đã bắt đầu/đã kết thúc lệch thời gian, không cho đăng ký để đi tiếp. |
| 5.2 | Organizer điểm danh thủ công | Chưa áp dụng được | Chưa có registration confirmed nằm trong cửa sổ check-in hợp lệ. |
| 5.3 | Organizer walk-in event không chia ca | Chưa áp dụng được | Chưa hoàn tất trong phiên vì cần event đúng cửa sổ thời gian. |
| 6.1 | Volunteer check-in đúng ca | Không đạt | Phụ thuộc tạo ca, đang fail ở 2.2. |
| 6.2 | Volunteer check-in sai giờ ca | Chưa áp dụng được | Phụ thuộc tạo ca, đang fail ở 2.2. |
| 6.3 | Organizer walk-in event có ca | Chưa áp dụng được | Phụ thuộc tạo ca, đang fail ở 2.2. |
| 7.1 | Check-out tính giờ | Chưa áp dụng được | Chưa check-in được qua UI trong cửa sổ hợp lệ. |
| 7.2 | Organizer chỉnh giờ thủ công | Chưa áp dụng được | Cần attended registration trước. |
| 8.1 | Organizer hoàn thành event có người tham gia | Chưa áp dụng được | Cần attended registration trước. |
| 8.2 | Hoàn thành event chưa có ai điểm danh | Chưa áp dụng được | Có nút hoàn thành, nhưng chưa chạy để tránh đóng event chính đang dùng test tài chính. |
| 8.3 | Admin mở lại event hoàn thành | Chưa áp dụng được | Cần event completed được tạo trong phiên. |
| 9.1 | Organizer tạo campaign ủng hộ | Đạt một phần | Tạo campaign qua UI và mở campaign thành công. |
| 9.2 | Volunteer ủng hộ tiền | Không đạt | UI gửi donation được mở, nhưng submit báo `Campaign is outside its donation window` vì campaign mặc định theo thời gian event tương lai. Không bypass API. |
| 9.3 | Organizer xác nhận donation | Chưa áp dụng được | Không có donation pending do 9.2 không đạt. |
| 9.4 | Organizer báo cáo sử dụng tiền ủng hộ | Chưa áp dụng được | Không có donation confirmed/campaign phù hợp để báo cáo. |
| 10.1 | Sponsor gửi đề nghị tài trợ | Đạt | Sponsor gửi proposal `Tai tro UI` qua UI, proposal xuất hiện pending. |
| 10.2 | Organizer mời sponsor tài trợ | Chưa áp dụng được | Chưa chạy chiều organizer request trong phiên này. |
| 10.3 | Organizer accept và ghi nhận đã nhận tiền | Đạt một phần | Organizer accept proposal qua UI thành công. Modal ghi nhận tiền mở được, nhập số tiền được, nhưng submit không chuyển trạng thái và không hiển thị lỗi rõ. |
| 10.4 | Báo cáo sử dụng tài trợ | Chưa áp dụng được | Proposal chưa chuyển được sang `Received` qua UI. |
| 11.1 | Event không có tài trợ vẫn chạy | Đạt một phần | Event/registration/confirm chạy không phụ thuộc tài trợ; chưa hoàn thành event vì chưa điểm danh được. |
| 11.2 | Campaign không ai ủng hộ | Đạt một phần | Campaign có 0 đồng, event vẫn tồn tại và không bị chặn. |
| 12.1 | Volunteer đăng ký khi event đã bắt đầu | Đạt một phần | Event gần giờ không cho đăng ký, nhưng UI có dấu hiệu lệch hiển thị thời gian/cửa sổ. |
| 12.2 | Event có ca nhưng request thiếu shiftId | Chưa áp dụng được | UI chưa tạo được ca nên chưa chạy được trạng thái này. Backend đã có guard nhưng không test trực tiếp API theo rule. |
| 12.3 | Tạo ca sau khi có đăng ký | Đạt | UI ẩn nút `Chia ca` sau khi có registration active. Backend guard không test trực tiếp theo rule. |
| 12.4 | Donation âm/quá lớn | Chưa áp dụng được | Donation window đang chặn trước khi test validation số tiền. |
| 12.5 | Sponsor hủy sau accepted | Chưa áp dụng được | Proposal đã accepted nhưng chưa ghi nhận received; chưa chạy cancel path. |
| 12.6 | Organizer bị khóa | Chưa áp dụng được | Không chạy vì ảnh hưởng rộng đến dữ liệu demo và cần quyền admin/user-management riêng. |
| 13 | Luồng demo gợi ý end-to-end | Không đạt đủ | Đạt tạo/duyệt/register/confirm/campaign/sponsor offer/accept. Không đạt phần chia ca, donation thực nhận, check-in/check-out/certificate. |
| 14 | Tiêu chí đạt nghiệp vụ tổng thể | Không đạt đủ | Core event registration/finance proposal chạy một phần, nhưng ca/điểm danh/donation window còn blocker. |

## Lỗi/blocker cần sửa

1. `EventForm` bị mất field thời gian ở bước 3 sau khi ẩn phần ca. Đã sửa trong phiên này và build sau cần kiểm lại.
2. Modal tạo ca trong `ManageEvent` không tạo được ca qua UI, không hiển thị lỗi rõ. Cần kiểm tra state form, timezone và lỗi API trả về.
3. Event gần giờ có dấu hiệu lệch timezone: UI hiển thị thời gian đã/đang diễn ra khác với khả năng đăng ký/check-in. Cần rà lại cách convert `datetime-local`, UTC và `toDateTimeLocal`.
4. Campaign mặc định start theo thời gian event tương lai nên volunteer không donate được trước ngày event. Cần quyết định nghiệp vụ: có cho nhận ủng hộ trước ngày event không. Nếu có, default start nên là `now`.
5. Modal ghi nhận tiền tài trợ nhập được số tiền nhưng submit không chuyển `Accepted -> Received` và không hiển thị lỗi rõ.
6. Một số nút trong UI còn text tiếng Anh (`Accept`, `Reject`) ở tab tài trợ doanh nghiệp.

## Trạng thái sửa sau phiên 2026-05-24

- Đã build lại frontend/backend thành công.
- Đã đồng bộ parse thời gian frontend cho các giá trị DateTime backend không có suffix timezone, tránh lệch giữa text hiển thị và `datetime-local`.
- Đã thêm hiển thị lỗi inline cho modal tạo ca, thay vì chỉ alert/không có phản hồi rõ.
- Đã đổi default thời gian bắt đầu campaign sang thời điểm hiện tại, cho phép nhận ủng hộ trước ngày diễn ra event.
- Đã sửa modal ghi nhận tài trợ sang handler click trực tiếp; smoke UI xác nhận `Accepted -> Received` chạy được.
- Đã đổi nút `Accept`/`Reject` trong tab tài trợ doanh nghiệp sang `Chấp nhận`/`Từ chối`.

## Kết luận

Luồng đã chạy đúng một phần qua UI thật:

- Organizer tạo event không chia ca.
- Admin duyệt event.
- Volunteer đăng ký event không chia ca.
- Organizer xác nhận volunteer.
- Organizer tạo và mở campaign.
- Sponsor gửi đề nghị tài trợ.
- Organizer accept đề nghị tài trợ.

Luồng chưa đạt đủ để coi là hoàn tất end-to-end:

- Chia ca.
- Volunteer đăng ký theo ca.
- Điểm danh/check-out/certificate.
- Donation cá nhân thành công.
- Ghi nhận tiền tài trợ received và báo cáo tài trợ.
