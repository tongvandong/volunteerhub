# VolunteerHub - Danh sách chức năng nghiệp vụ Backend

> Tài liệu này liệt kê toàn bộ chức năng nghiệp vụ của backend, phân nhóm theo module, để Stitch tạo giao diện phù hợp.

---

## 1. Authentication & Authorization (AuthService)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 1.1 | Đăng nhập | POST /auth/login | Xác thực bằng email/username + password, trả về JWT token |
| 1.2 | Đăng ký | POST /auth/register | Tạo tài khoản mới (Volunteer/Organizer/Sponsor) |
| 1.3 | Xem thông tin tài khoản | GET /auth/me | Lấy thông tin user đang đăng nhập |
| 1.4 | Refresh token | POST /auth/refresh | Làm mới access token bằng refresh token |
| 1.5 | Đổi mật khẩu | POST /auth/change-password | Đổi mật khẩu tài khoản |
| 1.6 | Đăng xuất | POST /auth/logout | Hủy refresh token, đăng xuất |

---

## 2. Quản lý người dùng (User Management)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 2.1 | Danh sách users | GET /users | Tìm kiếm, phân trang danh sách user |
| 2.2 | Chi tiết user | GET /users/{id} | Xem thông tin chi tiết 1 user |
| 2.3 | Tạo user (Admin) | POST /users | Admin tạo tài khoản mới |
| 2.4 | Cập nhật user | PUT /users/{id} | Cập nhật thông tin user |
| 2.5 | Xóa user | DELETE /users/{id} | Xóa tài khoản user |
| 2.6 | Khóa/Mở khóa user | PUT /admin/users/{id}/toggle-status | Admin khóa hoặc mở khóa tài khoản |

---

## 3. Hồ sơ & Kỹ năng (Profile & Skills)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 3.1 | Xem hồ sơ cá nhân | GET /profile/me | Lấy hồ sơ của user đang đăng nhập |
| 3.2 | Xem hồ sơ user khác | GET /profile/{userId} | Xem hồ sơ công khai của user |
| 3.3 | Cập nhật hồ sơ | PUT /profile | Cập nhật thông tin cá nhân |
| 3.4 | Gửi KYC xác minh | POST /profile/kyc | Gửi yêu cầu xác minh danh tính (CCCD, ảnh) |
| 3.5 | Xem Passport (tổng hợp hoạt động) | GET /profile/passport | Xem "hộ chiếu tình nguyện" - tổng hợp thành tích |
| 3.6 | Danh sách kỹ năng | GET /profile/skills | Lấy tất cả kỹ năng trong hệ thống |
| 3.7 | Tạo kỹ năng mới | POST /profile/skills | Tạo kỹ năng mới (Admin) |
| 3.8 | Cập nhật kỹ năng | PUT /profile/skills/{id} | Sửa thông tin kỹ năng |
| 3.9 | Xóa kỹ năng | DELETE /profile/skills/{id} | Xóa kỹ năng khỏi hệ thống |
| 3.10 | Thêm kỹ năng vào hồ sơ | POST /profile/my-skills | Volunteer thêm kỹ năng vào hồ sơ cá nhân |
| 3.11 | Xóa kỹ năng khỏi hồ sơ | DELETE /profile/my-skills/{skillId} | Xóa kỹ năng khỏi hồ sơ cá nhân |
| 3.12 | Gửi xác minh kỹ năng | POST /profile/my-skills/{skillId}/verify | Gửi chứng chỉ để xác minh kỹ năng |

---

## 4. Xác minh Organizer (Organizer Verification)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 4.1 | Xem yêu cầu xác minh của tôi | GET /organizer-verification/mine | Organizer xem trạng thái xác minh |
| 4.2 | Gửi yêu cầu xác minh | POST /organizer-verification | Organizer gửi hồ sơ xác minh tổ chức |
| 4.3 | Danh sách yêu cầu (Admin) | GET /organizer-verification | Admin xem tất cả yêu cầu xác minh |
| 4.4 | Duyệt xác minh | PUT /organizer-verification/{id}/approve | Admin duyệt yêu cầu |
| 4.5 | Từ chối xác minh | PUT /organizer-verification/{id}/reject | Admin từ chối yêu cầu |
| 4.6 | Yêu cầu bổ sung | PUT /organizer-verification/{id}/request-changes | Admin yêu cầu bổ sung thông tin |

---

## 5. Quản lý sự kiện (Events)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 5.1 | Danh sách sự kiện | GET /events | Lấy danh sách sự kiện (có filter, phân trang) |
| 5.2 | Sự kiện của tôi | GET /events/mine | Organizer xem sự kiện mình tạo |
| 5.3 | Sự kiện đề xuất | GET /events/recommended | Gợi ý sự kiện phù hợp cho volunteer |
| 5.4 | Chi tiết sự kiện | GET /events/{id} | Xem chi tiết 1 sự kiện |
| 5.5 | Xem tác động sự kiện | GET /events/{id}/impact | Thống kê tác động (giờ tình nguyện, số người...) |
| 5.6 | Tạo sự kiện | POST /events | Organizer tạo sự kiện mới |
| 5.7 | Cập nhật sự kiện | PUT /events/{id} | Sửa thông tin sự kiện |
| 5.8 | Xóa sự kiện | DELETE /events/{id} | Xóa sự kiện (draft) |
| 5.9 | Duyệt sự kiện | PUT /events/{id}/approve | Admin duyệt sự kiện |
| 5.10 | Từ chối sự kiện | PUT /events/{id}/reject | Admin từ chối sự kiện |
| 5.11 | Hoàn thành sự kiện | PUT /events/{id}/complete | Đánh dấu sự kiện đã hoàn thành |
| 5.12 | Gửi lại duyệt | PUT /events/{id}/resubmit | Organizer gửi lại sự kiện bị từ chối |
| 5.13 | Hủy sự kiện | PUT /events/{id}/cancel | Hủy sự kiện |
| 5.14 | Bỏ hoàn thành | PUT /events/{id}/uncomplete | Admin bỏ trạng thái hoàn thành |
| 5.15 | Tự động hoàn thành quá hạn | POST /events/auto-complete-overdue | Hệ thống tự hoàn thành sự kiện quá hạn |
| 5.16 | Xem preview sự kiện quá hạn | GET /events/overdue-preview | Xem danh sách sự kiện sắp bị auto-complete |
| 5.17 | Chuyển quyền sở hữu | PUT /events/{id}/transfer | Chuyển sự kiện cho organizer khác |
| 5.18 | Xem đăng ký của sự kiện | GET /events/{id}/registrations | Xem danh sách người đăng ký |
| 5.19 | Xem lịch sử sự kiện | GET /events/{id}/history | Xem audit log của sự kiện |
| 5.20 | Xoay mã QR | PUT /events/{id}/rotate-qr | Tạo mã QR mới cho check-in |

---

## 6. Đăng ký & Điểm danh (Registrations)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 6.1 | Đăng ký tham gia | POST /events/{eventId}/registrations | Volunteer đăng ký sự kiện |
| 6.2 | Rút đăng ký | DELETE /events/{eventId}/registrations | Volunteer rút khỏi sự kiện |
| 6.3 | Yêu cầu hủy | POST /events/{eventId}/registrations/cancel-request | Yêu cầu hủy đăng ký (cần duyệt) |
| 6.4 | Walk-in (đăng ký tại chỗ) | POST /events/{eventId}/registrations/walk-in | Organizer thêm người tham gia tại chỗ |
| 6.5 | Điểm danh thủ công | PUT /events/{eventId}/registrations/{regId}/manual-attend | Organizer điểm danh thủ công |
| 6.6 | Check-out | PUT /events/{eventId}/registrations/{regId}/check-out | Đánh dấu ra về |
| 6.7 | Điều chỉnh giờ | PUT /events/{eventId}/registrations/{regId}/adjust-hours | Điều chỉnh số giờ tình nguyện |
| 6.8 | Xác nhận đăng ký | PUT /events/{eventId}/registrations/{regId}/confirm | Organizer xác nhận đăng ký |
| 6.9 | Hủy đăng ký (Organizer) | PUT /events/{eventId}/registrations/{regId}/cancel | Organizer hủy đăng ký của volunteer |
| 6.10 | Check-in (Organizer) | PUT /events/{eventId}/registrations/{regId}/check-in | Organizer check-in cho volunteer |
| 6.11 | Tự check-in (QR/GPS) | POST /events/{eventId}/registrations/self-check-in | Volunteer tự check-in bằng QR hoặc GPS |
| 6.12 | Danh sách đăng ký của tôi | GET /registrations/mine | Xem tất cả sự kiện đã đăng ký |
| 6.13 | Chi tiết đăng ký của tôi | GET /events/{eventId}/registrations/mine | Xem trạng thái đăng ký 1 sự kiện |

---

## 7. Ca làm việc (Work Shifts)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 7.1 | Danh sách ca theo sự kiện | GET /events/{eventId}/shifts | Xem các ca làm việc của sự kiện |
| 7.2 | Chi tiết ca | GET /events/{eventId}/shifts/{id} | Xem chi tiết 1 ca |
| 7.3 | Tạo ca | POST /events/{eventId}/shifts | Organizer tạo ca làm việc |
| 7.4 | Cập nhật ca | PUT /events/{eventId}/shifts/{id} | Sửa thông tin ca |
| 7.5 | Xóa ca | DELETE /events/{eventId}/shifts/{id} | Xóa ca làm việc |

---

## 8. Chứng nhận (Certificates)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 8.1 | Xem chứng nhận của tôi | GET /certificates/mine | Volunteer xem danh sách chứng nhận |
| 8.2 | Xác minh chứng nhận | GET /certificates/verify/{code} | Xác minh tính hợp lệ bằng mã code |
| 8.3 | Tải PDF chứng nhận | GET /certificates/download/{code} | Tải file PDF chứng nhận |

---

## 9. Tài trợ - Sponsor Profile

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 9.1 | Xem hồ sơ nhà tài trợ | GET /sponsor-profile | Sponsor xem hồ sơ của mình |
| 9.2 | Cập nhật hồ sơ nhà tài trợ | PUT /sponsor-profile | Cập nhật thông tin nhà tài trợ |

---

## 10. Tài trợ sự kiện (Event Sponsors)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 10.1 | Xem nhà tài trợ của sự kiện | GET /events/{eventId}/sponsors | Danh sách nhà tài trợ cho sự kiện |
| 10.2 | Thêm nhà tài trợ | POST /events/{eventId}/sponsors | Thêm nhà tài trợ vào sự kiện |
| 10.3 | Xem tài trợ của tôi | GET /sponsors/mine | Sponsor xem các sự kiện đã tài trợ |
| 10.4 | Theo dõi tài trợ | GET /sponsors/{sponsorshipId}/tracking | Xem tiến độ sử dụng tài trợ |

---

## 11. Đề xuất tài trợ (Sponsorship Proposals)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 11.1 | Danh sách sponsor users | GET /sponsorship-proposals/sponsors | Lấy danh sách user là sponsor |
| 11.2 | Đề xuất theo sự kiện | GET /events/{eventId}/sponsorship-proposals | Xem đề xuất tài trợ của sự kiện |
| 11.3 | Đề xuất của tôi | GET /sponsorship-proposals/mine | Xem đề xuất tài trợ của mình |
| 11.4 | Organizer gửi yêu cầu tài trợ | POST /events/{eventId}/sponsorship-proposals/request | Organizer mời sponsor tài trợ |
| 11.5 | Sponsor đề nghị tài trợ | POST /events/{eventId}/sponsorship-proposals/offer | Sponsor chủ động đề nghị tài trợ |
| 11.6 | Chấp nhận đề xuất | PUT /sponsorship-proposals/{id}/accept | Chấp nhận đề xuất tài trợ |
| 11.7 | Từ chối đề xuất | PUT /sponsorship-proposals/{id}/reject | Từ chối đề xuất tài trợ |
| 11.8 | Hủy đề xuất | PUT /sponsorship-proposals/{id}/cancel | Hủy đề xuất tài trợ |
| 11.9 | Xác nhận đã nhận tài trợ | PUT /sponsorship-proposals/{id}/received | Organizer xác nhận đã nhận tài trợ |
| 11.10 | Admin hoàn về Pending | PUT /sponsorship-proposals/{id}/revert | Admin đưa đề xuất về trạng thái chờ |
| 11.11 | Báo cáo sử dụng tài trợ | POST /sponsorship-proposals/{id}/report | Organizer báo cáo sử dụng tài trợ |

---

## 12. Chiến dịch quyên góp (Support Campaigns & Donations)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 12.1 | Xem chiến dịch theo sự kiện | GET /events/{eventId}/campaigns | Danh sách chiến dịch quyên góp |
| 12.2 | Chi tiết chiến dịch | GET /campaigns/{id} | Xem chi tiết 1 chiến dịch |
| 12.3 | Tạo chiến dịch | POST /events/{eventId}/campaigns | Organizer tạo chiến dịch quyên góp |
| 12.4 | Cập nhật chiến dịch | PUT /campaigns/{id} | Sửa thông tin chiến dịch |
| 12.5 | Mở chiến dịch | PUT /campaigns/{id}/open | Mở nhận quyên góp |
| 12.6 | Đóng chiến dịch | PUT /campaigns/{id}/close | Đóng chiến dịch |
| 12.7 | Hủy chiến dịch | PUT /campaigns/{id}/cancel | Hủy chiến dịch |
| 12.8 | Báo cáo tài chính | POST /campaigns/{id}/report | Organizer báo cáo tài chính chiến dịch |
| 12.9 | Xem danh sách quyên góp | GET /campaigns/{id}/donations | Danh sách người quyên góp |
| 12.10 | Quyên góp | POST /campaigns/{id}/donate | Cá nhân quyên góp cho chiến dịch |
| 12.11 | Xem quyên góp của tôi | GET /donations/mine | Xem lịch sử quyên góp cá nhân |
| 12.12 | Xác nhận quyên góp | PUT /donations/{id}/confirm | Organizer xác nhận đã nhận tiền |
| 12.13 | Từ chối quyên góp | PUT /donations/{id}/reject | Organizer từ chối quyên góp |
| 12.14 | Hủy quyên góp | PUT /donations/{id}/cancel | Người quyên góp hủy |

---

## 13. Kênh giao tiếp & Bài viết (Channels & Posts)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 13.1 | Danh sách kênh | GET /channels | Xem tất cả kênh (mỗi sự kiện 1 kênh) |
| 13.2 | Chi tiết kênh | GET /channels/{id} | Xem thông tin kênh |
| 13.3 | Danh sách bài viết | GET /channels/{id}/posts | Xem bài viết trong kênh (phân trang, filter) |
| 13.4 | Tạo bài viết | POST /channels/{id}/posts | Đăng bài trong kênh |
| 13.5 | Sửa bài viết | PUT /channels/{id}/posts/{postId} | Sửa bài viết |
| 13.6 | Xóa bài viết | DELETE /channels/{id}/posts/{postId} | Xóa bài viết |
| 13.7 | Like/Unlike bài viết | POST /channels/{id}/posts/{postId}/like | Toggle like bài viết |
| 13.8 | Ghim/Bỏ ghim bài viết | POST /channels/{id}/posts/{postId}/pin | Toggle ghim bài viết |
| 13.9 | Xem thành viên kênh | GET /channels/{id}/members | Danh sách thành viên kênh |
| 13.10 | Xem bình luận | GET /channels/{id}/posts/{postId}/comments | Danh sách bình luận |
| 13.11 | Thêm bình luận | POST /channels/{id}/posts/{postId}/comments | Bình luận bài viết |
| 13.12 | Xóa bình luận | DELETE /channels/{id}/posts/{postId}/comments/{commentId} | Xóa bình luận |
| 13.13 | Tạo bình chọn (Poll) | POST /channels/{id}/posts/{postId}/polls | Tạo poll trong bài viết |
| 13.14 | Bỏ phiếu | POST /channels/{id}/polls/{pollId}/vote | Bỏ phiếu cho poll |
| 13.15 | Xem kết quả poll | GET /channels/{id}/polls/{pollId}/results | Xem kết quả bình chọn |

---

## 14. Thông báo (Notifications)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 14.1 | Danh sách thông báo | GET /notifications | Lấy thông báo (phân trang) |
| 14.2 | Đánh dấu đã đọc | PUT /notifications/{id}/read | Đánh dấu 1 thông báo đã đọc |
| 14.3 | Đánh dấu tất cả đã đọc | PUT /notifications/read-all | Đánh dấu tất cả đã đọc |

---

## 15. Đánh giá (Ratings)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 15.1 | Đánh giá sự kiện | POST /events/{eventId}/ratings | Volunteer đánh giá sự kiện đã tham gia |
| 15.2 | Xem đánh giá của user | GET /users/{userId}/ratings | Xem đánh giá của 1 user |
| 15.3 | Sửa đánh giá | PUT /ratings/{id} | Sửa đánh giá của mình |
| 15.4 | Danh sách đánh giá (Admin) | GET /admin/ratings | Admin xem tất cả đánh giá |
| 15.5 | Ẩn đánh giá | PUT /ratings/{id}/hide | Admin ẩn đánh giá vi phạm |
| 15.6 | Hiện đánh giá | PUT /ratings/{id}/unhide | Admin bỏ ẩn đánh giá |
| 15.7 | Xóa đánh giá | DELETE /ratings/{id} | Admin xóa đánh giá |

---

## 16. Huy hiệu (Badges)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 16.1 | Danh sách huy hiệu | GET /badges | Xem tất cả huy hiệu trong hệ thống |
| 16.2 | Huy hiệu của tôi | GET /badges/mine | Xem huy hiệu đã đạt được |

---

## 17. Danh mục (Categories)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 17.1 | Danh sách danh mục | GET /categories | Xem tất cả danh mục |
| 17.2 | Chi tiết danh mục | GET /categories/{id} | Xem chi tiết 1 danh mục |
| 17.3 | Tạo danh mục | POST /categories | Admin tạo danh mục mới |
| 17.4 | Cập nhật danh mục | PUT /categories/{id} | Admin sửa danh mục |
| 17.5 | Xóa danh mục | DELETE /categories/{id} | Admin xóa danh mục |

---

## 18. Danh mục sự kiện (Event Categories)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 18.1 | Danh sách | GET /event-categories | Xem tất cả danh mục sự kiện |
| 18.2 | Chi tiết | GET /event-categories/{id} | Xem chi tiết |
| 18.3 | Tạo | POST /event-categories | Tạo danh mục sự kiện |
| 18.4 | Cập nhật | PUT /event-categories/{id} | Sửa danh mục sự kiện |
| 18.5 | Xóa | DELETE /event-categories/{id} | Xóa danh mục sự kiện |

---

## 19. Upload file

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 19.1 | Upload ảnh | POST /uploads/image | Upload ảnh (avatar, banner, chứng chỉ...) |
| 19.2 | Xem ảnh | GET /uploads/image/{fileName} | Truy cập ảnh đã upload |
| 19.3 | Upload file | POST /uploads/file | Upload file tài liệu |
| 19.4 | Xem file | GET /uploads/file/{fileName} | Truy cập file đã upload |

---

## 20. Dashboard & Thống kê

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 20.1 | Dashboard tổng quan | GET /dashboard | Thống kê tổng quan hệ thống |
| 20.2 | Insights cho Organizer | GET /dashboard/organizer-insights | Thống kê chi tiết cho organizer |

---

## 21. Admin - Quản trị hệ thống

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 21.1 | Danh sách yêu cầu KYC | GET /admin/volunteer-kyc | Xem yêu cầu xác minh danh tính |
| 21.2 | Duyệt KYC | PUT /admin/volunteer-kyc/{id}/approve | Duyệt xác minh danh tính |
| 21.3 | Từ chối KYC | PUT /admin/volunteer-kyc/{id}/reject | Từ chối xác minh danh tính |
| 21.4 | Danh sách xác minh kỹ năng | GET /admin/volunteer-skills | Xem yêu cầu xác minh kỹ năng |
| 21.5 | Duyệt kỹ năng | PUT /admin/volunteer-skills/{id}/approve | Duyệt xác minh kỹ năng |
| 21.6 | Từ chối kỹ năng | PUT /admin/volunteer-skills/{id}/reject | Từ chối xác minh kỹ năng |
| 21.7 | Export sự kiện | GET /admin/export/events | Xuất dữ liệu sự kiện (JSON/CSV) |
| 21.8 | Export users | GET /admin/export/users | Xuất dữ liệu người dùng |
| 21.9 | Tổng quan tài chính | GET /admin/finance/overview | Thống kê tài chính tổng quan |
| 21.10 | Đề xuất quá hạn | GET /admin/finance/open-proposals-past-event | Đề xuất tài trợ chưa xử lý |
| 21.11 | Quyên góp treo | GET /admin/finance/stale-donations | Quyên góp chưa xác nhận quá lâu |
| 21.12 | Chiến dịch chưa báo cáo | GET /admin/finance/unreported-campaigns | Chiến dịch đã đóng chưa có báo cáo |
| 21.13 | Export tài chính | GET /admin/export/finance | Xuất dữ liệu tài chính |

---

## 22. Monitoring & Audit

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 22.1 | Health check | GET /monitoring/health | Kiểm tra trạng thái hệ thống |
| 22.2 | Tổng quan hệ thống | GET /monitoring/summary | Thống kê tổng quan (số user, event...) |
| 22.3 | Audit logs | GET /monitoring/audit-logs | Xem nhật ký hoạt động |
| 22.4 | Dọn dẹp audit logs | DELETE /monitoring/audit-logs/cleanup | Xóa log cũ |

---

## 23. Roles & Permissions

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 23.1 | Danh sách roles | GET /roles | Xem tất cả vai trò |
| 23.2 | Chi tiết role | GET /roles/{id} | Xem chi tiết vai trò |
| 23.3 | Roles theo loại user | GET /roles/by-user-type/{userType} | Lấy roles theo loại tài khoản |
| 23.4 | Xem permissions của role | GET /roles/{id}/permissions | Xem quyền hạn của vai trò |

---

## 24. Tìm kiếm Volunteer (Volunteer Lookup)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 24.1 | Tìm kiếm volunteer | GET /volunteers?keyword=... | Tìm volunteer theo tên/email (cho organizer mời) |

---

## 25. Realtime (SignalR Hub)

| # | Chức năng | Hub | Mô tả |
|---|-----------|-----|--------|
| 25.1 | Channel realtime | /hubs/channel | Nhận bài viết, bình luận, like mới theo thời gian thực |

---

## 26. Legacy - Sản phẩm & Đơn hàng (LegacySales)

| # | Chức năng | Endpoint | Mô tả |
|---|-----------|----------|--------|
| 26.1 | Danh sách sản phẩm | GET /products | Xem sản phẩm (phân trang, filter) |
| 26.2 | Chi tiết sản phẩm | GET /products/{id} | Xem chi tiết sản phẩm |
| 26.3 | Tạo sản phẩm | POST /products | Tạo sản phẩm mới |
| 26.4 | Cập nhật sản phẩm | PUT /products/{id} | Sửa sản phẩm |
| 26.5 | Xóa sản phẩm | DELETE /products/{id} | Xóa sản phẩm |
| 26.6 | Sản phẩm theo danh mục | GET /products/by-category/{categoryId} | Lọc sản phẩm theo danh mục |
| 26.7 | Đơn hàng của tôi | GET /orders/mine | Xem đơn hàng cá nhân |
| 26.8 | Tất cả đơn hàng (Admin) | GET /orders | Xem tất cả đơn hàng |
| 26.9 | Chi tiết đơn hàng | GET /orders/{id} | Xem chi tiết đơn hàng |
| 26.10 | Tạo đơn hàng | POST /orders | Đặt hàng mới |
| 26.11 | Cập nhật trạng thái | PUT /orders/{id}/status | Cập nhật trạng thái đơn hàng |
| 26.12 | Hủy đơn hàng | PUT /orders/{id}/cancel | Hủy đơn hàng |

---

## Tổng kết theo vai trò (Role-based UI Pages)

### Volunteer (Tình nguyện viên)
- Trang chủ: Sự kiện đề xuất, sự kiện sắp tới
- Tìm kiếm & đăng ký sự kiện
- Quản lý đăng ký của tôi (xem, rút, check-in)
- Hồ sơ cá nhân & kỹ năng
- KYC xác minh danh tính
- Chứng nhận & Huy hiệu
- Passport tình nguyện
- Kênh giao tiếp sự kiện
- Thông báo
- Đánh giá sự kiện
- Quyên góp cho chiến dịch

### Organizer (Nhà tổ chức)
- Dashboard & Insights
- Quản lý sự kiện (CRUD, workflow duyệt)
- Quản lý ca làm việc
- Quản lý đăng ký & điểm danh
- Kênh giao tiếp sự kiện (bài viết, poll)
- Xác minh tổ chức (Organizer Verification)
- Quản lý tài trợ (đề xuất, nhận, báo cáo)
- Chiến dịch quyên góp (tạo, quản lý, báo cáo)
- Chuyển quyền sở hữu sự kiện
- QR code check-in

### Sponsor (Nhà tài trợ)
- Hồ sơ nhà tài trợ
- Tìm sự kiện để tài trợ
- Đề nghị tài trợ / Phản hồi yêu cầu
- Theo dõi tiến độ tài trợ
- Quyên góp cho chiến dịch

### Admin (Quản trị viên)
- Dashboard tổng quan
- Quản lý người dùng (CRUD, khóa/mở)
- Duyệt sự kiện
- Duyệt KYC & Kỹ năng
- Duyệt Organizer Verification
- Quản lý danh mục
- Quản lý đánh giá (ẩn/xóa)
- Giám sát tài chính
- Export dữ liệu
- Monitoring & Audit logs
- Quản lý roles & permissions
