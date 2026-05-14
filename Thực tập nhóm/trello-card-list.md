# Trello Board — VolunteerHub Group 10

## Cách tạo

1. Vào https://trello.com → tạo board mới tên "VolunteerHub - CNTT59 Group 10"
2. Tạo 7 list (cột) theo thứ tự từ trái sang phải:
   - Tuần 1
   - Tuần 2
   - Tuần 3
   - Tuần 4
   - Tuần 5
   - Tuần 6
   - Done ✓
3. Tạo card theo danh sách bên dưới, assign đúng người, đặt due date
4. Khi xong card nào → kéo sang "Done ✓"
5. Invite 2 thành viên còn lại vào board

---

## Tuần 1 — Phân tích yêu cầu

| Card | Assign | Checklist |
|---|---|---|
| Viết mô tả đề tài (bối cảnh, mục tiêu, actor) | A | ☐ File `docs/1-mo-ta-de-tai.md` hoàn thành |
| Viết yêu cầu chức năng FR-01 đến FR-19 | B | ☐ File `docs/2-yeu-cau-chuc-nang.md` phần event/registration |
| Viết yêu cầu chức năng FR-20 đến FR-28 | C | ☐ Bổ sung finance/admin/notification vào file FR |
| Setup GitHub repo + .gitignore + README | A | ☐ Repo tạo xong, collaborator đã add |
| Tạo Trello board | A | ☐ Board có đủ list + card |
| Họp nhóm tuần 1 + viết biên bản | Cả nhóm | ☐ File biên bản tuần 1 |

---

## Tuần 2 — Thiết kế hệ thống

| Card | Assign | Checklist |
|---|---|---|
| Tạo solution structure (.sln, Entities, Repository) | A | ☐ `dotnet build` pass |
| Viết thiết kế hệ thống (kiến trúc, entity, API) | A | ☐ File `docs/3-thiet-ke-he-thong.md` |
| Viết phân công nhóm | A | ☐ File `docs/5-phan-cong-nhom.md` |
| Viết flow spec đăng ký + điểm danh | B | ☐ File `docs/internal/event-registration-flow.md` |
| Viết flow spec tài trợ + ủng hộ | C | ☐ File `docs/internal/sponsorship-donation-flow.md` |
| Viết tình huống thực tế A-G | C | ☐ File `docs/internal/real-world-scenarios.md` |
| Họp nhóm tuần 2 + viết biên bản | Cả nhóm | ☐ File biên bản tuần 2 |

---

## Tuần 3 — Triển khai backend

| Card | Assign | Checklist |
|---|---|---|
| Implement Auth: login, register, JWT, refresh token | A | ☐ Swagger test pass |
| Implement Profile: CRUD hồ sơ, kỹ năng, KYC | A | ☐ Swagger test pass |
| Implement Organizer Verification | A | ☐ Admin duyệt/từ chối hoạt động |
| Implement Event CRUD + approve/reject/complete | B | ☐ Swagger test pass |
| Implement Registration: đăng ký, rút, confirm, cancel, check-in | B | ☐ Swagger test pass |
| Implement Work Shift + Certificate + Badge | B | ☐ Complete event → cert tự cấp |
| Implement Support Campaign + Donation | C | ☐ Tạo campaign, donate, confirm pass |
| Implement Sponsorship Proposal (offer, accept, received, report) | C | ☐ Full flow pass |
| Cấu hình API Gateway (Ocelot) | B | ☐ Route qua gateway đúng service |
| Họp nhóm tuần 3 + viết biên bản | Cả nhóm | ☐ Mỗi người demo phần mình |

---

## Tuần 4 — Frontend + Service split + Nâng cao

| Card | Assign | Checklist |
|---|---|---|
| Frontend: Landing page, Event list, Event detail | B | ☐ Render đúng, responsive |
| Frontend: Login, Register, Profile, Passport | A | ☐ Login/register hoạt động |
| Frontend: MyEvents, EventForm, ManageEvent | B | ☐ Organizer flow hoạt động |
| Frontend: MyRegistrations, MyCertificates, MyBadges | A | ☐ Volunteer flow hoạt động |
| Frontend: MySponsorships, MyDonations | C | ☐ Sponsor/donation flow hoạt động |
| Frontend: Admin pages (events, users, export, monitoring) | Chia 3 | ☐ Admin flow hoạt động |
| Tách EventService (port 5003) | B | ☐ Build pass, health check OK |
| Tách FinanceService (port 5004) | C | ☐ Build pass, health check OK |
| Thêm endpoint: cancel event, resubmit, walk-in, manual-attend | B | ☐ API test pass |
| Thêm endpoint: uncomplete, rating moderation | B | ☐ API test pass |
| Thêm endpoint: ActualReceivedAmount, overspend guard | C | ☐ API test pass |
| Merge tất cả vào main | Cả nhóm | ☐ Main build pass |
| Họp nhóm tuần 4 + viết biên bản | Cả nhóm | ☐ Demo 1 vòng qua browser |

---

## Tuần 5 — Test & Fix bug

| Card | Assign | Checklist |
|---|---|---|
| Test demo workflow đầy đủ (tạo → duyệt → đăng ký → check-in → complete → cert) | Cả nhóm | ☐ Pass |
| Test tình huống: cancel event + cascade | B | ☐ Volunteer nhận notification |
| Test tình huống: volunteer xin hủy sau confirm | A | ☐ Organizer thấy request |
| Test tình huống: walk-in + bổ sung điểm danh | B | ☐ Registration tạo đúng |
| Test tình huống: sponsor offer + received + report | C | ☐ ActualReceivedAmount đúng |
| Test mobile viewport (5 màn chính) | Cả nhóm | ☐ Không tràn ngang |
| Fix bug phát sinh | Ai phụ trách phần đó | ☐ Commit fix |
| Viết hướng dẫn cài đặt đầy đủ | A | ☐ File `docs/4-huong-dan-cai-dat.md` cập nhật |
| Họp nhóm tuần 5 + viết biên bản | Cả nhóm | ☐ Ghi nhận bug đã fix |

---

## Tuần 6 — Báo cáo & Nộp bài

| Card | Assign | Checklist |
|---|---|---|
| Viết báo cáo mục 1-4 (giới thiệu, tổ chức, kế hoạch, quá trình) | A | ☐ Draft xong |
| Viết báo cáo mục 5-6 (kết quả, khó khăn) | B | ☐ Có screenshot demo |
| Viết báo cáo mục 7-9 (đánh giá, kết luận, phụ lục) | C | ☐ Có link GitHub/Drive |
| Làm slide thuyết trình | Chia 3 | ☐ 15-20 slide |
| Tổng hợp biên bản 6 tuần | A | ☐ 6 file .docx |
| Đánh giá chéo | Cả nhóm | ☐ File .xlsx |
| Chạy demo cuối + chụp screenshot | Cả nhóm | ☐ Screenshot lưu Drive |
| Push commit cuối lên GitHub | A | ☐ Repo sạch, build pass |
| Họp nhóm tuần 6 + viết biên bản | Cả nhóm | ☐ Biên bản cuối |

---

## Label gợi ý (tạo trên Trello)

- 🟢 `docs` — tài liệu
- 🔵 `backend` — code .NET
- 🟡 `frontend` — code React
- 🔴 `bug` — sửa lỗi
- 🟣 `test` — kiểm thử
- ⚪ `meeting` — họp nhóm
