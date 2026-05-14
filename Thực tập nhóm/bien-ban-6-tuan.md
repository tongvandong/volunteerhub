# Biên bản họp nhóm 6 tuần — VolunteerHub

Dùng file này làm nội dung, sau đó copy vào file .docx theo đúng mẫu `23042026_BBH_Group10.docx`.

---

## Biên bản tuần 1

**Ngày**: (điền ngày thật)
**Thành phần**: A (trưởng nhóm), B, C
**Nội dung họp**:

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Thống nhất đề tài | Website quản lý hoạt động tình nguyện — VolunteerHub |
| 2 | Xác định bài toán | Tình nguyện hiện tổ chức rời rạc qua MXH, khó kiểm uy tín, khó match kỹ năng, đóng góp không được ghi nhận |
| 3 | Xác định đối tượng người dùng | 4 vai trò: Volunteer, Organizer, Sponsor, Admin + Guest |
| 4 | Phân chia viết yêu cầu | A: mô tả đề tài + FR identity. B: FR event/registration. C: FR finance/admin |
| 5 | Setup công cụ | GitHub repo đã tạo, Trello board đã tạo, Google Drive folder đã tạo |
| 6 | Deadline tuần 1 | Hoàn thành file mô tả đề tài + yêu cầu chức năng trước họp tuần 2 |

**Kết luận**: Đề tài được thống nhất. Mỗi người viết phần yêu cầu của mình, tổng hợp cuối tuần.

**Trưởng nhóm**: (ký)
**Thư ký**: (ký)

---

## Biên bản tuần 2

**Ngày**: (điền ngày thật)
**Thành phần**: A, B, C
**Nội dung họp**:

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Review yêu cầu chức năng | 28 FR đã viết, đủ cover 4 vai trò. Thống nhất trạng thái event/registration/campaign/proposal |
| 2 | Thống nhất kiến trúc | Microservice: Gateway (5000) + Identity (5002) + Event (5003) + Finance (5004). Shared DB |
| 3 | Thiết kế database | 20+ entity, dùng EF Core + SQL Server, migration tự động khi startup |
| 4 | Thiết kế API | Mỗi người liệt kê endpoint phần mình. Thống nhất format response + error |
| 5 | Phân công code | A: AuthService + Identity. B: EventService + Gateway. C: FinanceService |
| 6 | Quy ước branch | Mỗi người 1 branch riêng, merge theo thứ tự A → B → C |

**Kết luận**: Thiết kế hoàn thành. Bắt đầu code từ tuần 3. Mỗi người tạo branch riêng.

**Trưởng nhóm**: (ký)
**Thư ký**: (ký)

---

## Biên bản tuần 3

**Ngày**: (điền ngày thật)
**Thành phần**: A, B, C
**Nội dung họp**:

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | A demo | Login/register qua Swagger pass. Profile update, KYC submit hoạt động. Organizer verification flow OK |
| 2 | B demo | Tạo event, admin approve (sinh QR + channel), volunteer đăng ký, organizer confirm, check-in QR pass. Certificate tự cấp khi complete |
| 3 | C demo | Tạo campaign, volunteer donate, organizer confirm donation. Sponsor offer → organizer accept → received pass |
| 4 | Vấn đề gặp | (ghi nếu có: ví dụ conflict migration, field thiếu, route sai...) |
| 5 | Kế hoạch tuần 4 | Merge code, làm frontend, tách service riêng, thêm tình huống nâng cao |

**Kết luận**: Backend cơ bản hoạt động. Tuần 4 làm frontend + service split.

**Trưởng nhóm**: (ký)
**Thư ký**: (ký)

---

## Biên bản tuần 4

**Ngày**: (điền ngày thật)
**Thành phần**: A, B, C
**Nội dung họp**:

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Demo frontend | Landing page, event list/detail, login/register, organizer create/manage, volunteer registrations, sponsor sponsorships, admin events/users — tất cả render được |
| 2 | Service split | EventService (5003) và FinanceService (5004) chạy độc lập. Gateway route đúng |
| 3 | Tình huống nâng cao | Đã thêm: cancel event + cascade, volunteer xin hủy sau confirm, walk-in, bổ sung điểm danh, chỉnh giờ, admin uncomplete, rating moderation, overspend guard, ActualReceivedAmount |
| 4 | Merge code | Đã merge tất cả vào main. Build pass. Conflict ở api.js đã giải quyết |
| 5 | Test nhanh | Chạy 1 vòng demo qua browser: tạo event → duyệt → đăng ký → confirm → check-in → complete → cert. Pass |
| 6 | Kế hoạch tuần 5 | Test kỹ hơn, fix bug, viết báo cáo |

**Kết luận**: Hệ thống chạy end-to-end. Cần test kỹ + viết báo cáo.

**Trưởng nhóm**: (ký)
**Thư ký**: (ký)

---

## Biên bản tuần 5

**Ngày**: (điền ngày thật)
**Thành phần**: A, B, C
**Nội dung họp**:

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Kết quả test | Demo workflow pass. Tình huống cancel/walk-in/uncomplete pass. Mobile viewport OK |
| 2 | Bug phát hiện | (liệt kê nếu có, ví dụ: "notification text bị mojibake" → đã fix) |
| 3 | Tiến độ báo cáo | A: xong mục 1-4. B: đang mục 5-6. C: đang mục 7 |
| 4 | Hướng dẫn cài đặt | File `docs/4-huong-dan-cai-dat.md` đã cập nhật đầy đủ |
| 5 | Kế hoạch tuần 6 | Hoàn thiện báo cáo + slide + tập demo |

**Kết luận**: Hệ thống ổn định. Tuần 6 tập trung báo cáo và chuẩn bị thuyết trình.

**Trưởng nhóm**: (ký)
**Thư ký**: (ký)

---

## Biên bản tuần 6

**Ngày**: (điền ngày thật)
**Thành phần**: A, B, C
**Nội dung họp**:

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Review báo cáo | Đã hoàn thiện 9 mục. Có screenshot demo, link GitHub, link Drive |
| 2 | Review slide | 18 slide: bài toán → kiến trúc → demo từng role → khó khăn → kết luận |
| 3 | Phân công thuyết trình | A: slide 1-6 (bài toán + kiến trúc + identity). B: slide 7-12 (event flow + demo). C: slide 13-18 (finance + kết luận) |
| 4 | Demo cuối | Chạy full flow, chụp screenshot, không có lỗi |
| 5 | Đánh giá chéo | Mỗi người tự đánh giá + đánh giá 2 người còn lại |
| 6 | Nộp bài | Push GitHub, upload Drive, nộp link cho giảng viên |

**Kết luận**: Hoàn thành đồ án. Sẵn sàng thuyết trình.

**Trưởng nhóm**: (ký)
**Thư ký**: (ký)

---

## Lưu ý khi viết biên bản .docx

- Dùng đúng format mẫu `23042026_BBH_Group10.docx` (có header "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", số biên bản, ngày tháng).
- Thay "Quản lý văn bản" bằng "VolunteerHub — Cổng sự kiện tình nguyện".
- Thay tên/vai trò theo nhóm thật.
- Mỗi biên bản 1 trang A4 là đủ.
- Lưu file tên: `Bien_ban_tuan_1.docx`, `Bien_ban_tuan_2.docx`, ...
