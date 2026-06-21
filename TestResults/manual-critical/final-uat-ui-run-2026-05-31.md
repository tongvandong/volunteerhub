# Báo cáo UAT giao diện cuối - 31/05/2026

## Phạm vi và môi trường

- Thực hiện theo `docs/5-ke-hoach-test-cuoi.md`.
- Chỉ thao tác qua UI tại `http://localhost:3000`; không gọi API trực tiếp để giả lập nghiệp vụ.
- LocalDB và 5 host đã chạy: Gateway `5000`, API `5001`, Auth `5002`, Event `5003`, Finance `5004`.
- Frontend và toàn bộ backend đã build thành công trước vòng UAT.
- Dữ liệu seed được giữ nguyên; các thao tác có thể phá dữ liệu demo được kiểm tra bằng màn hiện có hoặc đánh dấu cần chạy trong phiên reset DB riêng.
- Browser in-app không chụp được ảnh do `Page.captureScreenshot` timeout. Kiểm tra responsive dùng viewport thật `390x844`, DOM snapshot và đo `scrollWidth`.

Quy ước: `PASS` đã chạy UI; `PARTIAL` đã kiểm tra giao diện hoặc dữ liệu seed nhưng chưa ghi dữ liệu phá demo; `SKIP` cần thiết bị, hai session hoặc dữ liệu chuyên biệt.

## A1. Khách

| ID | Kết quả | Ghi chú |
|---|---|---|
| G-01 | PASS | Landing đầy đủ hero, stats, CTA; không vỡ layout hoặc mojibake. |
| G-02 | PASS | Danh sách public không lộ Pending/Rejected/Cancelled. |
| G-03 | PARTIAL | UI tìm kiếm, filter, đổi chế độ có hiển thị; định vị thật cần quyền GPS thiết bị. |
| G-04 | PASS | Chi tiết event tải đủ sau loading, có CTA đăng nhập. |
| G-05 | PASS | Route bảo vệ và CTA guest dẫn về đăng nhập. |
| G-06 | PASS | Nhập `CERT-KHONG-TON-TAI` báo không tìm thấy bằng tiếng Việt. |
| G-07 | PASS | Guest vào `/dashboard`, `/admin/users` bị đưa về `/login`. |
| G-08 | PASS | Register có đủ 3 role; mật khẩu ngắn và email sai bị HTML validation chặn. |
| G-09 | PASS | `/register?role=sponsor` chọn sẵn Sponsor. |

## A2. Volunteer

| ID | Kết quả | Ghi chú |
|---|---|---|
| V-01 | PASS | `volunteer/volunteer123` vào dashboard đúng role. |
| V-02 | PASS | Dashboard có stats, việc cần làm, đề xuất và passport. |
| V-03 | PARTIAL | UI chọn event/ca và trạng thái đăng ký seed đúng; không tạo registration mới để tránh đổi dữ liệu demo. |
| V-04 | PARTIAL | UI hiển thị điều kiện KYC; cần account chưa KYC trong phiên reset DB. |
| V-05 | PASS | `/activity` hiển thị badge và hành động theo trạng thái. |
| V-06 | SKIP | Quét QR/GPS thật cần camera và vị trí thiết bị. UI check-in quá sớm đã được sửa và regression pass. |
| V-07 | PASS | Sửa rating event `12` từ UI, reload detail vẫn thấy `ok updated`; audit log có `Rating.Update`. |
| V-08 | PARTIAL | Lịch phỏng vấn và entry phòng có hiển thị; cuộc gọi hai phía cần hai session. |
| V-09 | PARTIAL | Form profile và đồng bộ avatar/name đã có; không đổi dữ liệu seed. |
| V-10 | SKIP | Crop avatar cần file ảnh thật. |
| V-11 | PASS | Profile completion hiển thị đúng; không còn ô ngôn ngữ. |
| V-12 | PARTIAL | Account seed đã verified, không lộ note nội bộ; upload KYC cần file thật. |
| V-13 | PARTIAL | Skills và badge xác minh hiển thị; không gửi minh chứng mới. |
| V-14 | PARTIAL | Huy hiệu/chứng chỉ hiển thị; chưa mở PDF binary để soát font. |
| V-15 | PASS | Passport có stats và timeline. |
| V-16 | PARTIAL | Nút rút/xin hủy đúng trạng thái; không hủy seed. |

## A3. Organizer

| ID | Kết quả | Ghi chú |
|---|---|---|
| O-01 | PASS | Login đúng role, `/dashboard` và menu organizer tải được. |
| O-02 | PASS | Hồ sơ xác minh hiển thị Verified và mini-stats. |
| O-03 | SKIP | Đổi logo cần file ảnh thật. |
| O-04 | PARTIAL | Form và cảnh báo sửa pháp lý có sẵn; không hạ verified seed. |
| O-05 | PASS | Wizard tạo event đủ 6 bước và các control địa chỉ/map. |
| O-06 | PARTIAL | Validation lead-time có trên wizard; không submit event rác. |
| O-07 | PARTIAL | Validation duration có trên wizard; không submit event rác. |
| O-08 | PARTIAL | Pending seed hiện ở organizer/admin; không tạo event mới. |
| O-09 | PARTIAL | Luồng sửa nội dung đã có cảnh báo; không hạ Approved seed. |
| O-10 | PARTIAL | Luồng sửa logistics đã có; không đổi lịch seed. |
| O-11 | PASS | `/events/6/manage` có registrations, skill status, interview, đổi ca. |
| O-12 | PARTIAL | Tab điểm danh có QR/manual; GPS thật cần thiết bị. |
| O-13 | PASS | Tab ca hiển thị đúng hai ca của event `6`; không thêm ca rác. |
| O-14 | PARTIAL | Tab campaign có luồng tạo/đối soát/báo cáo; không ghi tiền seed. |
| O-15 | PARTIAL | Tab corporate có luồng accept/received/report; không ghi tiền seed. |
| O-16 | PASS | Event tương lai: nút hoàn thành disabled. |
| O-17 | PARTIAL | Completed seed hiển thị đúng; không rollback/complete lại. |
| O-18 | PASS | Insights có stats, chart và funnel. |
| O-19 | PARTIAL | Notification page sạch; seed organizer hiện không có notification để click. |

## A4. Sponsor

| ID | Kết quả | Ghi chú |
|---|---|---|
| S-01 | PASS | Dashboard có 3 stat sponsor đúng ngữ nghĩa. |
| S-02 | PASS | Từ `/events/2` mở modal đề nghị tài trợ và preselect event. |
| S-03 | PASS | Event detail truyền `eventId` đúng vào modal. |
| S-04 | PASS | Tabs filter proposal hiển thị. |
| S-05 | SKIP | Seed chưa có OrganizerRequest để accept. |
| S-06 | SKIP | Seed chưa có pending proposal để cancel. |
| S-07 | SKIP | Seed chưa có Received/Reported proposal. |
| S-08 | PASS | `/sponsor/profile` tải được hero, stats, form. |

## A5. Admin

| ID | Kết quả | Ghi chú |
|---|---|---|
| AD-01 | PASS | Dashboard có 5 stats và hàng chờ tổng hợp; mục count `0` được ẩn. |
| AD-02 | PASS | Tabs Pending/Approved/Completed/Rejected/Cancelled/All tải đúng; Completed quá hạn vẫn thấy. |
| AD-03 | PARTIAL | Các action đúng theo trạng thái; không mutate seed hàng loạt. |
| AD-04 | PARTIAL | Có nút auto-complete; không chạy vì thay đổi nhiều seed. |
| AD-05 | PARTIAL | Users có tab/filter/search; seed chỉ 4 user nên chưa phát sinh pagination nhiều trang. |
| AD-06 | PASS | Modal tạo account có validation; dữ liệu sai không submit. |
| AD-07 | PASS | Modal sửa thông tin tách khỏi khóa/mở. |
| AD-08 | PARTIAL | Action khóa/mở có guard; không khóa seed. |
| AD-09 | PASS | Admin hiện tại chỉ có `Xem`, không có action tự khóa/xóa. |
| AD-10 | PASS | Organizer verification tải đúng trạng thái và action theo Pending. |
| AD-11 | PASS | Tab volunteer KYC/skills tải được. |
| AD-12 | PASS | Ratings thấy rating vừa sửa và action moderation. |
| AD-13 | PASS | Catalog danh mục/kỹ năng/huy hiệu có màn CRUD đầy đủ. |
| AD-14 | PASS | Finance watch tải được, không trắng trang. |
| AD-15 | PASS | Monitoring tải health và audit log; thấy `Rating.Update`. |
| AD-16 | PARTIAL | Export hiển thị CSV/JSON cho event/user/finance; chưa lưu file download. |

## B. End-to-end

| ID | Kết quả | Ghi chú |
|---|---|---|
| B-01 | PARTIAL | Đã đi xuyên UI 4 role bằng seed: public event, sponsor modal, organizer manage, admin approve list, volunteer activity/rating. Tạo event mới đến cấp PDF cần phiên reset DB riêng. |
| B-02 | PARTIAL | Campaign/VietQR/donation/đối soát/report có UI; không ghi giao dịch tài chính demo. |
| B-03 | PARTIAL | Verification organizer và admin review có UI; cần account organizer mới. |
| B-04 | PARTIAL | KYC/skill verification có UI; cần account volunteer mới và file ảnh thật. |

## C. Negative và biên

| ID | Kết quả | Ghi chú |
|---|---|---|
| N-01 | PASS | Volunteer vào `/admin/users`, `/events/create`, `/events/6/manage` đều bị đưa về dashboard. |
| N-02 | PARTIAL | Backend guard đã có; seed chỉ có một organizer. |
| N-03 | SKIP | Cần chủ động dừng host hoặc token hết hạn giữa phiên. |
| N-04 | PARTIAL | Không thao tác API trực tiếp theo quy tắc UI-only. |
| N-05 | SKIP | Cần event full capacity riêng. |
| N-06 | PASS | Regression UI: event tương lai không còn mở check-in; backend đã guard time window. |
| N-07 | SKIP | Cần GPS thiết bị. |
| N-08 | PARTIAL | UI cảnh báo complete có sẵn; không complete seed. |
| N-09 | PARTIAL | UI/service validation ca ngoài khung có sẵn; không đổi seed. |
| N-10 | PASS | Dashboard và events không gợi ý event hết hạn. |
| N-11 | PASS | Sponsor modal chặn amount `-1`, title `aa`. |
| N-12 | PARTIAL | UI đối soát yêu cầu tick; không mutate donation seed. |
| N-13 | PARTIAL | UI/service guard report; không mutate tài chính seed. |
| N-14 | PARTIAL | Profile validation có sẵn; không xóa tên seed. |
| N-15 | PARTIAL | Admin review modal có min reason; không reject seed. |
| N-16 | PASS | Verified volunteer không lộ note nội bộ. |
| N-17 | PASS | Các màn smoke chính không có mojibake khi render. |
| N-18 | SKIP | Seed không đủ trang để tạo tình huống trang cuối rồi xóa. |
| N-19 | PASS | Mini-stats organizer hiển thị hợp lý theo seed. |

## D. Cross-cutting

| ID | Kết quả | Ghi chú |
|---|---|---|
| X-01 | PASS | Màu nền, typography, card và badge nhất quán ở các màn chính. |
| X-02 | PASS | Sidebar/topbar đúng role và trạng thái active. |
| X-03 | PASS | Viewport `390x844`: `/`, `/events`, `/register`, `/events/2` không overflow ngang (`scrollWidth <= innerWidth`). |
| X-04 | PARTIAL | Mapping notification đã có; seed thiếu notification đa loại để click toàn bộ. |
| X-05 | PASS | Loading/empty/error state xuất hiện đúng ở các màn đã chạy. |
| X-06 | SKIP | In-app browser chỉ cung cấp một Chromium session; chưa chạy Edge/Firefox. |

## Lỗi phát hiện và xử lý ngay

### UAT-01 - Sự kiện tương lai vẫn hiện điểm danh

- Mức: P1.
- Trước sửa: `/activity` gọi event tương lai là `Sự kiện đang diễn ra`; `/events/6` vẫn hiện nút `Điểm danh`.
- Đã sửa: dùng chung helper frontend bám cửa sổ backend:
  - event thường: `StartDate - 30 phút` đến `EndDate + 2 giờ`;
  - event có ca: `Shift.StartTime - 15 phút` đến `Shift.EndTime + 30 phút`.
- Regression UI: PASS. `/activity` không còn nhãn sai; `/events/6` có `0` nút điểm danh.

## Việc cần chạy thêm trong phiên dữ liệu reset

Các case `SKIP` hoặc `PARTIAL` có mutation lớn cần một database demo reset riêng: tạo account mới, tạo event mới, approval, KYC upload thật, campaign/donation/proposal, complete/certificate PDF, GPS/QR thật, hai session TRTC, pagination data volume và browser thứ hai.

## Kết luận

- Smoke UI, phân quyền route, dashboard 4 role, catalog/admin monitoring, rating create-update-display và regression điểm danh tương lai đã pass.
- Build frontend sau sửa: PASS.
- Chưa thể tuyên bố đạt tiêu chí nghiệm thu `100% P0` vì còn các case thiết bị, file upload, hai session và mutation dữ liệu được đánh dấu rõ ở trên.
