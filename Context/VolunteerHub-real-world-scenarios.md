# Tình huống thực tế trong vòng đời sự kiện - Volunteer Hub

Tài liệu này liệt kê các tình huống thực tế có thể xảy ra xuyên suốt vòng đời một sự kiện tình nguyện, từ lúc tạo đến khi hoàn thành và xử lý tài chính. Mỗi tình huống ghi rõ trạng thái hệ thống hiện tại và giải pháp đã triển khai.

## A. Sau khi tạo, chưa được admin duyệt

| # | Tình huống | Hệ thống xử lý |
|---|---|---|
| A1 | Admin để quá lâu, sắp tới ngày StartDate mà vẫn Pending | Event vẫn Pending, volunteer không thấy. Organizer có thể sửa hoặc xóa. Hệ thống chưa có SLA nhắc admin tự động. |
| A2 | Admin reject event | Status chuyển Rejected, organizer nhận notification. Organizer có thể sửa nội dung rồi gọi `POST /api/events/{id}/resubmit` để đưa về Pending chờ duyệt lại. |
| A3 | Organizer muốn hủy trước khi duyệt | Organizer dùng `DELETE /api/events/{id}` (hard delete) hoặc `PUT /api/events/{id}/cancel` (soft cancel với lý do, giữ audit). |
| A4 | Organizer sửa info rồi gửi lại sau reject | Organizer gọi `PUT /api/events/{id}` sửa nội dung, sau đó `POST /api/events/{id}/resubmit` để chuyển Rejected → Pending. Admin thấy event quay lại danh sách chờ duyệt. |
| A5 | Hồ sơ organizer bị admin đẩy về Pending sau khi verified | Event cũ vẫn còn, vẫn có thể Update. Chỉ chặn tạo event mới cho tới khi duyệt lại. |

## B. Đã duyệt, đang mở đăng ký

| # | Tình huống | Hệ thống xử lý |
|---|---|---|
| B1 | Không ai đăng ký, sắp tới ngày event | Không có action tự động. Organizer tự quyết định hủy hoặc tiếp tục. Impact report sẽ hiển thị `noShowVolunteers` và `cancelRequestedCount` để organizer đánh giá. |
| B2 | Đăng ký ít, chưa đạt MinParticipants | Hệ thống vẫn cho organizer complete. UI nên cảnh báo nhưng không chặn. Backend không block. |
| B3 | Đầy MaxParticipants | Registration mới bị chặn. Không có waitlist. Nếu có người rút, slot trống lại. |
| B4 | Thiên tai / dịch / pháp lý → organizer muốn hủy event | `PUT /api/events/{id}/cancel` với `reason`. Cascade tự động: campaign Open → Closed, proposal Pending/Accepted → Cancelled, notify volunteer đã Confirmed, notify sponsor có proposal active. Proposal đã Received/Reported giữ nguyên — tiền đã nhận xử lý ngoài hệ thống. |
| B5 | Organizer thay đổi giờ/địa điểm sau duyệt | `PUT /api/events/{id}` cập nhật. Nếu event đang Approved và StartDate/EndDate/Location/tọa độ thay đổi → hệ thống tự gửi notification cho tất cả volunteer đã Confirmed và sponsor có proposal Accepted/Received/Reported. |
| B6 | Organizer mất tích, không confirm ai | Mọi registration đứng Pending. Admin có thể dùng `PUT /api/events/{id}/transfer` để chuyển quyền sở hữu event sang organizer khác đã Verified. |
| B7 | Volunteer đăng ký rồi biến mất | Giữ trạng thái Pending. Organizer confirm thì thành Confirmed rồi không đến → ghi nhận no-show qua `IsAttended = false` sau event. Impact report hiển thị `noShowVolunteers`. |
| B8 | Volunteer đã Confirmed nhưng sát ngày bận việc, muốn rút | Volunteer gọi `POST /api/events/{eventId}/register/cancel-request` với lý do. Hệ thống đặt `CancelRequested=true`, notify organizer. Organizer dùng endpoint `PUT .../registrations/{regId}/cancel` để phê duyệt → volunteer nhận notification xác nhận đã hủy, slot trả lại. |
| B9 | Event RequiresKyc=true, volunteer đã có đăng ký cũ trước khi bật cờ KYC | Rule KYC chỉ kiểm lúc POST register. Đăng ký cũ vẫn hiệu lực, không retro-filter. |
| B10 | 2 volunteer cùng đăng ký 1 slot cuối cùng | Kiểm MaxParticipants tại thời điểm save. Race condition có thể xảy ra ở quy mô lớn — cần optimistic concurrency nếu mở rộng. |

## C. Ngay trước / trong khi chạy event

| # | Tình huống | Hệ thống xử lý |
|---|---|---|
| C1 | Mưa bão, hoãn 1 tuần | Organizer gọi `PUT /api/events/{id}` đổi StartDate/EndDate. Hệ thống tự notify volunteer Confirmed và sponsor active về thay đổi thời gian. |
| C2 | Volunteer Confirmed không đến (no-show) | `IsAttended` vẫn = false → không được cấp cert → không cộng giờ. Impact report hiển thị `noShowVolunteers` để organizer đánh giá. |
| C3 | Người lạ tới tham gia (walk-in) | Organizer gọi `POST /api/events/{eventId}/walk-in` với `volunteerUserId`. Hệ thống tạo registration Confirmed + IsAttended tức thời, bypass capacity check. Volunteer phải có tài khoản trong hệ thống. |
| C4 | QR event lộ ra ngoài | Ai có QR + đã đăng nhập + đã Confirmed đều check-in được. GPS threshold 0.5km là lớp bảo vệ phụ. Nếu cần chặt hơn, organizer dùng manual check-in thay vì self check-in. |
| C5 | Volunteer gian lận GPS (giả vị trí) | Backend chỉ nhận tọa độ từ client. Haversine check 0.5km là ngưỡng cơ bản. Không có giải pháp triệt để ở giai đoạn này. |
| C6 | Organizer quên điểm danh ai đó | `POST /api/events/{eventId}/registrations/{regId}/manual-attend` — cho phép bổ sung điểm danh trong cửa sổ 7 ngày sau EndDate. Có thể kèm `hours` override. |
| C7 | Sự kiện kéo dài hơn / ngắn hơn dự kiến | `PUT /api/events/{eventId}/registrations/{regId}/hours` — organizer chỉnh `VolunteerHours` cho từng volunteer đã attended. Giá trị hợp lệ: 0 đến 1440 giờ. |
| C8 | Có sự cố / tai nạn | Không có kênh incident/khiếu nại riêng trong hệ thống. Organizer liên hệ admin ngoài hệ thống. Backlog: complaint/ticket workflow. |

## D. Sau khi sự kiện chạy xong

| # | Tình huống | Hệ thống xử lý |
|---|---|---|
| D1 | Đã qua EndDate nhưng organizer quên bấm Complete | Admin gọi `POST /api/events/auto-complete-overdue` — tự complete mọi event Approved có EndDate quá 24 giờ. Cấp cert + notify organizer. Đây là trigger thủ công (admin bấm), không phải background job. |
| D2 | Organizer bấm Complete sớm (nhầm) | Admin gọi `POST /api/events/{id}/uncomplete` — rollback Completed → Approved, xóa certificates đã cấp cho event đó, notify organizer. |
| D3 | Complete nhưng không ai IsAttended | Vẫn complete OK. IssueCertificates chạy rỗng → 0 cert. Badge cũng không trigger. Impact report hiển thị 0 attended. |
| D4 | Badge đủ điều kiện nhưng không được trao | Logic tự động sau complete. Nếu lỗi, admin có thể uncomplete rồi complete lại để re-trigger. |
| D5 | Volunteer muốn rate organizer sau rất lâu | Không có thời hạn rating. Cho phép bất cứ lúc nào sau event Completed. |
| D6 | Rating xấu / lăng mạ / lạm dụng | Admin gọi `PUT /api/ratings/{id}/hide` với lý do. Rating bị ẩn khỏi danh sách public và không tính vào average score. Có thể unhide hoặc delete hẳn. |
| D7 | Organizer muốn rút lại rating volunteer đã đưa | Không có endpoint update rating. Hiện chỉ tạo một lần. Admin có thể delete nếu cần. |

## E. Finance — Ủng hộ cá nhân (Support Campaign)

| # | Tình huống | Hệ thống xử lý |
|---|---|---|
| E1 | Campaign chưa đạt TargetAmount đến hạn EndDate | Không có rule "fail". ConfirmedAmount là bao nhiêu thì giữ bấy nhiêu. Tiền đã nhận là tiền giữ, không hoàn tự động. Organizer tự xử lý ngoài hệ thống. |
| E2 | Volunteer đã chuyển tiền, organizer chưa confirm | Donation đứng PendingConfirmation. Không tính vào tổng public. Admin có thể xem `GET /api/admin/finance/stale-donations?days=7` để phát hiện donation pending quá lâu và nhắc organizer. |
| E3 | Organizer reject donation dù người ủng hộ đã chuyển tiền thật | Donation Rejected + RejectedReason. Không có flow refund trong hệ thống. Refund xử lý ngoài hệ thống. Audit log ghi nhận. |
| E4 | Volunteer gửi donation giả / spam hàng loạt | Rate limit `write-sensitive` (30 request/phút) áp dụng cho endpoint donation. Organizer reject các khoản không hợp lệ. |
| E5 | Người ủng hộ muốn rút lại sau khi organizer đã Confirmed | Chặn. Spec nói rõ: confirmed là coi như đã xác nhận nhận tiền. Refund phải ngoài hệ thống + admin update thủ công. |
| E6 | Campaign đang Open mà organizer muốn đóng sớm | Có endpoint `PUT /api/support-campaigns/{id}/close`. Donation PendingConfirmation sau close → organizer vẫn confirm được. |
| E7 | Event bị hủy / không chạy nhưng đã có donation confirmed | Khi event cancel, campaign Open → Closed tự động. Donation đã Confirmed giữ nguyên. Organizer phải tự hoàn tiền ngoài hệ thống rồi cập nhật Report để minh bạch. Admin xem `GET /api/admin/finance/unreported-campaigns` để phát hiện campaign có tiền nhưng chưa báo cáo. |
| E8 | Organizer không bao giờ làm Reported (báo cáo sử dụng tiền) | Admin xem `GET /api/admin/finance/unreported-campaigns` — liệt kê campaign có confirmedAmount > 0 nhưng chưa Reported, event đã Completed/Cancelled. Admin nhắc organizer. |
| E9 | UsedAmount > ConfirmedAmount (chi vượt thu) | Backend chặn: "Used amount exceeds confirmed donations". Nếu organizer tự bỏ tiền túi bù thêm, set `allowOverspend=true` trong request body kèm giải trình trong summary. |

## F. Finance — Tài trợ doanh nghiệp (Sponsorship Proposal)

| # | Tình huống | Hệ thống xử lý |
|---|---|---|
| F1 | Sponsor đã Accepted rồi lặn, không chuyển tiền | Proposal đứng Accepted. Admin xem `GET /api/admin/finance/open-proposals-past-event` để phát hiện proposal Pending/Accepted mà event đã Completed/Cancelled. Admin có thể dùng `PUT /api/sponsorship-proposals/{id}/admin-revert-to-pending` hoặc organizer cancel nếu cần. |
| F2 | Sponsor chuyển tiền nhiều hơn OfferedAmount | `PUT /api/sponsorship-proposals/{id}/received` nhận body `{ actualReceivedAmount: 600000 }`. Hệ thống lưu số thực nhận, sync sang EventSponsor.Amount. Impact report dùng ActualReceivedAmount. |
| F3 | Sponsor chuyển ít hơn | Tương tự F2. Organizer nhập `actualReceivedAmount` thấp hơn pledged. Report validate `UsedAmount ≤ ActualReceivedAmount`. |
| F4 | Sponsor muốn hủy sau khi Accepted | Chặn. Accepted là cam kết hai bên. Sponsor không có endpoint cancel sau Accepted. Nếu cần hủy, admin dùng `PUT /api/sponsorship-proposals/{id}/admin-revert-to-pending` để rollback về Pending, sau đó sponsor cancel. |
| F5 | Organizer muốn từ chối sau khi Accepted (xung đột đạo đức) | Admin dùng `PUT /api/sponsorship-proposals/{id}/admin-revert-to-pending` rollback về Pending. Sau đó organizer reject. Chặn nếu đã Received/Reported (tiền đã nhận, phải xử lý qua Report). |
| F6 | Sponsor gửi SponsorOffer nhưng event bị hủy | Khi event cancel, cascade tự động: proposal Pending/Accepted → Cancelled. Sponsor nhận notification. |
| F7 | Event complete nhưng proposal vẫn Pending/Accepted chưa Received | Admin xem `GET /api/admin/finance/open-proposals-past-event`. Quyết định nhắc organizer/sponsor hoặc cancel. |
| F8 | Organizer dùng tài trợ sai mục đích | Chỉ phát hiện qua Report (UsedAmount + ExpenseDetails). Admin xem export finance. Backlog: complaint/ticket workflow. |
| F9 | Một event nhận cả donation cá nhân + sponsor + có EventSponsor legacy | Impact report cộng cả 3 nguồn riêng biệt: `donationConfirmedAmount` (từ campaign), `sponsorshipReceivedAmount` (từ proposal dùng ActualReceivedAmount), `sponsorAmount` (từ EventSponsor legacy). Không double-count. |

## G. Cross-cutting — vận hành

| # | Tình huống | Hệ thống xử lý |
|---|---|---|
| G1 | Admin xoá category đang có event | EventCategoriesController.Delete bắt DbUpdateException → trả 400 "Cannot delete a category that is used by events". Legacy CategoriesController (Product) cũng bắt DbUpdateException → 400 "Cannot delete a category that is used by products". |
| G2 | Admin xoá skill đang có trong RequiredSkillIds JSON | `DELETE /api/skills/{id}` scan tất cả Event.RequiredSkillIds, remove id khỏi JSON array. Nếu còn VolunteerSkill đang dùng skill đó → DbUpdateException → 400 "Cannot delete a skill that volunteers are still using". |
| G3 | Organizer bị admin khóa giữa chừng | `PUT /api/admin/users/{id}/toggle-status` khi deactivate trả kèm `impact` summary: đếm active events, open campaigns, open proposals. Admin tự quyết định cancel event hoặc transfer. Không auto-cancel để tránh mất dữ liệu đột ngột. |
| G4 | Volunteer bị khóa giữa chừng | Toggle-status trả impact: đếm active registrations, pending donations. Admin tự quyết định. Đăng ký cũ vẫn tồn tại. |
| G5 | Tài khoản sponsor bị khóa | Toggle-status trả impact: đếm open proposals. Admin tự quyết định cancel proposal hoặc để organizer xử lý. |

## Nguyên tắc xuyên suốt

1. **Mọi giao dịch tiền đều ngoài hệ thống.** Hệ thống chỉ ghi nhận khi organizer xác nhận đã nhận. Khi event hủy, tiền đã Confirmed/Received giữ nguyên — organizer tự hoàn/chuyển mục đích rồi cập nhật Report.
2. **Cascade khi cancel event không xóa dữ liệu tài chính đã xác nhận.** Chỉ đóng campaign Open và cancel proposal chưa nhận tiền (Pending/Accepted). Received/Reported giữ nguyên.
3. **Admin không auto-action khi deactivate user.** Chỉ trả impact summary để admin quyết định thủ công, tránh mất dữ liệu đột ngột.
4. **Notification tự động khi thay đổi ảnh hưởng người tham gia.** Cancel event, thay đổi time/location, volunteer request-cancel đều trigger notification cho bên liên quan.
5. **Grace window cho bổ sung điểm danh.** 7 ngày sau EndDate, organizer vẫn có thể manual-attend và adjust-hours.
6. **Admin có quyền rollback.** Uncomplete event, revert proposal to pending, hide/delete rating — nhưng không bypass rule tài chính đã nhận.

## API tham chiếu cho các tình huống

### Event lifecycle

```
POST   /api/events/{id}/resubmit              Organizer: Rejected → Pending
PUT    /api/events/{id}/cancel                 Organizer/Admin: → Cancelled + cascade
PUT    /api/events/{id}/transfer               Admin: đổi OrganizerId
POST   /api/events/{id}/uncomplete             Admin: Completed → Approved + revoke certs
POST   /api/events/auto-complete-overdue       Admin: complete tất cả Approved quá hạn
```

### Registration lifecycle

```
POST   /api/events/{eventId}/register/cancel-request    Volunteer: xin hủy sau Confirmed
POST   /api/events/{eventId}/walk-in                    Organizer: đăng ký + check-in tại chỗ
POST   /api/events/{eventId}/registrations/{regId}/manual-attend   Organizer: bổ sung điểm danh
PUT    /api/events/{eventId}/registrations/{regId}/hours            Organizer: chỉnh giờ
```

### Rating moderation

```
PUT    /api/ratings/{id}/hide       Admin: ẩn rating khỏi public
PUT    /api/ratings/{id}/unhide     Admin: hiện lại rating
DELETE /api/ratings/{id}            Admin: xóa hẳn rating
```

### Finance monitoring

```
GET    /api/admin/finance/stale-donations?days=7        Admin: donation pending quá hạn
GET    /api/admin/finance/unreported-campaigns          Admin: campaign có tiền chưa báo cáo
GET    /api/admin/finance/open-proposals-past-event     Admin: proposal kẹt sau event kết thúc
PUT    /api/sponsorship-proposals/{id}/received         Organizer: nhận body { actualReceivedAmount }
PUT    /api/sponsorship-proposals/{id}/admin-revert-to-pending   Admin: rollback proposal
```

## Khi nào cập nhật file này

- Thêm tình huống thực tế mới phát sinh khi test/demo.
- Thay đổi rule xử lý tiền (ví dụ thêm auto-refund).
- Thêm background job thay thế manual trigger.
- Thêm complaint/ticket workflow.
- Thêm waitlist hoặc auto-confirm logic.
