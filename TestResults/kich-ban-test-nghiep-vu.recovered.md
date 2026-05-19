# Kịch bản test nghiệp vụ � VolunteerHub

T�i liệu n�y liệt k� c�c kịch bản test thủ c�ng (manual) bao gồm cả **happy path** v� **t�nh huống bất thường/edge case** m� người test cần kiểm tra tr�n giao diện.

> **T�i khoản demo:** admin/admin123, organizer/organizer123, volunteer/volunteer123, sponsor/sponsor123
> **URL:** http://localhost:3000

---

## 1. Đăng k� & Đăng nhập (FR-01)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1.1 | Đăng k� t�i khoản mới (Volunteer) | Th�nh c�ng, redirect về login |
| 1.2 | Đăng nhập đ�ng username/password | V�o dashboard đ�ng role |
| 1.3 | Đăng nhập bằng email thay username | Cũng th�nh c�ng |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1.4 | Đăng k� tr�ng username | B�o lỗi "username đ� tồn tại" |
| 1.5 | Đăng k� tr�ng email | B�o lỗi |
| 1.6 | Đăng nhập sai mật khẩu 8 lần li�n tiếp | Bị rate-limit 429 "Too many requests" |
| 1.7 | Đăng nhập user bị kh�a (IsActive=false) | B�o lỗi 401, kh�ng v�o được |
| 1.8 | Truy cập /admin/users bằng t�i khoản volunteer | Bị redirect về dashboard (403) |
| 1.9 | Token hết hạn → gọi API | Tự refresh token hoặc redirect login |
| 1.10 | Sửa localStorage token th�nh gi� trị bậy → reload | Bị đẩy về login |

---

## 2. X�c minh tổ chức (FR-06)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 2.1 | Organizer v�o /organizer/verification, điền đầy đủ th�ng tin, gửi | Status chuyển Pending |
| 2.2 | Admin v�o /admin/organizer-verifications, duyệt | Status → Verified, organizer nhận th�ng b�o |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 2.3 | Admin từ chối nhưng l� do < 10 k� tự | B�o lỗi validation |
| 2.4 | Organizer chưa verified → tạo event | Bị chặn, hiện th�ng b�o "Cần x�c minh tổ chức" |
| 2.5 | Organizer đ� verified → sửa th�ng tin x�c minh | Status quay về Pending, kh�ng tạo event mới được |
| 2.6 | Admin duyệt organizer đ� Verified (double approve) | Kh�ng lỗi, giữ nguy�n |

---

## 3. Tạo & Duyệt sự kiện (FR-07, FR-08)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 3.1 | Organizer (verified) tạo event đầy đủ th�ng tin | Event status = Pending |
| 3.2 | Admin duyệt event | Status → Approved, QR code sinh, channel tạo |
| 3.3 | Organizer sửa event Approved (đổi thời gian) | Lưu th�nh c�ng, volunteer đ� confirm nhận th�ng b�o |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 3.4 | Tạo event EndDate < StartDate | B�o lỗi validation |
| 3.5 | Tạo event MinParticipants > MaxParticipants | B�o lỗi |
| 3.6 | Tạo event StartDate trong qu� khứ | B�o lỗi hoặc cảnh b�o |
| 3.7 | Admin từ chối event, l� do < 10 k� tự | B�o lỗi |
| 3.8 | Organizer gửi duyệt lại event bị Rejected | Status → Pending |
| 3.9 | Volunteer cố approve event (sửa API call) | 403 Forbidden |
| 3.10 | Sửa event đ� Cancelled | Bị chặn |
| 3.11 | Tạo event khi organizer chưa verified | Bị chặn |

---

## 4. Đăng k� sự kiện (FR-10, FR-11, FR-12)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 4.1 | Volunteer đăng k� event Approved | Registration status = Pending |
| 4.2 | Organizer x�c nhận đăng k� | Status → Confirmed, volunteer nhận th�ng b�o |
| 4.3 | Volunteer r�t đăng k� khi c�n Pending | Th�nh c�ng |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 4.4 | Đăng k� event đ� hết chỗ (MaxParticipants) | B�o lỗi "Hết chỗ" |
| 4.5 | Đăng k� event y�u cầu KYC nhưng volunteer chưa KYC | B�o lỗi "Cần x�c minh danh t�nh" |
| 4.6 | Đăng k� lại event đ� r�t trước đ� | Th�nh c�ng (tạo registration mới) |
| 4.7 | Đăng k� 2 lần c�ng event | B�o lỗi "Đ� đăng k�" |
| 4.8 | R�t đăng k� khi đ� Confirmed | Kh�ng được r�t trực tiếp, phải gửi y�u cầu hủy |
| 4.9 | Volunteer gửi y�u cầu hủy (đ� Confirmed) | Organizer nhận request, ph� duyệt → Cancelled |
| 4.10 | Organizer hủy registration | Status → Cancelled, volunteer nhận th�ng b�o |
| 4.11 | Đăng k� event Pending (chưa duyệt) | Bị chặn |
| 4.12 | Đăng k� event đang diễn ra (StartDate đ� qua) | Bị chặn |

---

## 5. Ca l�m việc (FR-13)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 5.1 | Organizer tạo ca cho event | Th�nh c�ng, sub-channel tạo |
| 5.2 | Volunteer đăng k� chọn ca | Registration gắn shiftId |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 5.3 | Tạo ca EndTime < StartTime | B�o lỗi |
| 5.4 | Tạo ca ngo�i khoảng thời gian event | B�o lỗi |
| 5.5 | Đăng k� ca đ� hết chỗ | B�o lỗi |
| 5.6 | Tạo ca cho event Pending (chưa approve) | Th�nh c�ng (parent channel tự tạo) |
| 5.7 | X�a ca đ� c� người đăng k� | Cần xử l�: chặn hoặc cảnh b�o |

---

## 6. Điểm danh & Check-out (FR-14, FR-14b)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 6.1 | Organizer qu�t QR volunteer đ� Confirmed | Check-in th�nh c�ng, volunteer nhận th�ng b�o |
| 6.2 | Volunteer tự check-in bằng QR (self check-in) | Th�nh c�ng |
| 6.3 | Organizer check-out volunteer | VolunteerHours tự t�nh, volunteer nhận th�ng b�o |
| 6.4 | Walk-in: organizer đăng k� + check-in tại chỗ | Registration tạo + check-in lu�n |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 6.5 | Check-in volunteer chưa Confirmed (c�n Pending) | Bị chặn |
| 6.6 | Check-in ngo�i cửa sổ thời gian (event chưa bắt đầu) | Bị chặn |
| 6.7 | Check-in ngo�i b�n k�nh GPS (>CheckInRadiusKm) | Bị chặn (nếu d�ng GPS) |
| 6.8 | Check-in 2 lần c�ng volunteer | Bị chặn "Đ� điểm danh" |
| 6.9 | Check-out volunteer chưa check-in | Bị chặn |
| 6.10 | Check-out 2 lần | Bị chặn |
| 6.11 | Organizer xoay QR code → volunteer d�ng QR cũ | Bị chặn "QR kh�ng hợp lệ" |
| 6.12 | Bổ sung điểm danh sau 7 ng�y | Bị chặn |
| 6.13 | Organizer chỉnh VolunteerHours th�nh số �m | Bị chặn |

---

## 7. Ho�n th�nh sự kiện & Chứng chỉ (FR-15, FR-16)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 7.1 | Organizer đ�nh dấu Complete | Event → Completed, chứng chỉ tự cấp cho volunteer đ� check-in |
| 7.2 | Volunteer xem chứng chỉ ở /my-certificates | Hiển thị đ�ng, tải PDF được |
| 7.3 | Guest x�c thực chứng chỉ qua m� verify | Hiển thị th�ng tin hợp lệ |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 7.4 | Complete event chưa c� ai check-in | Th�nh c�ng nhưng kh�ng cấp chứng chỉ n�o |
| 7.5 | Complete event chưa đủ MinParticipants | B�o lỗi hoặc cảnh b�o |
| 7.6 | Admin mở lại event (Uncomplete) | Status → Approved, chứng chỉ bị thu hồi |
| 7.7 | X�c thực chứng chỉ với m� sai | Hiển thị "Kh�ng t�m thấy" |
| 7.8 | Volunteer chưa check-in nhưng đ� Confirmed → Complete | Kh�ng được cấp chứng chỉ |

---

## 8. Hủy sự kiện & Cascade (FR-09)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 8.1 | Organizer hủy event Approved (c� l� do) | Status → Cancelled |
| 8.2 | Volunteer đ� Confirmed nhận th�ng b�o hủy | C� notification |
| 8.3 | Campaign Open tự chuyển Closed | Kiểm tra campaign status |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 8.4 | Hủy event đ� Completed | Bị chặn |
| 8.5 | Hủy event kh�ng c� l� do | Th�nh c�ng (l� do optional) hoặc bắt buộc t�y rule |
| 8.6 | Volunteer cố hủy event (kh�ng phải organizer) | 403 |
| 8.7 | Sau khi hủy, event biến mất khỏi trang public | Đ�ng, kh�ng hiện nữa |
| 8.8 | Sponsor c� proposal Accepted → event hủy | Proposal → Cancelled, sponsor nhận th�ng b�o |

---

## 9. K�u gọi ủng hộ & Donation (FR-20)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 9.1 | Organizer tạo campaign (Draft) → mở (Open) | Status chuyển đ�ng |
| 9.2 | Volunteer donate 50.000đ | Donation status = PendingConfirmation |
| 9.3 | Organizer x�c nhận donation | Status → Confirmed, tổng public cập nhật |
| 9.4 | Organizer đ�ng campaign → b�o c�o | Status → Closed → Reported |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 9.5 | Donate v�o campaign Draft (chưa Open) | Bị chặn "Campaign is not open" |
| 9.6 | Donate v�o campaign Closed | Bị chặn |
| 9.7 | Donate số tiền = 0 hoặc �m | Bị chặn |
| 9.8 | Donate ẩn danh → organizer xem list | Kh�ng thấy phone/email donor |
| 9.9 | Volunteer hủy donation khi c�n PendingConfirmation | Th�nh c�ng |
| 9.10 | Volunteer hủy donation đ� Confirmed | Bị chặn |
| 9.11 | Organizer từ chối donation | Status → Rejected, donor nhận th�ng b�o |
| 9.12 | Mở campaign từ Closed (đ� đ�ng) | Bị chặn (chỉ Draft→Open→Closed) |
| 9.13 | B�o c�o UsedAmount > ConfirmedAmount | Bị chặn hoặc y�u cầu giải tr�nh |

---

## 10. T�i trợ doanh nghiệp (FR-21)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 10.1 | Organizer mời sponsor (OrganizerRequest) | Proposal status = Pending |
| 10.2 | Sponsor chấp nhận | Status → Accepted |
| 10.3 | Organizer x�c nhận đ� nhận tiền (Received) | Nhập ActualReceivedAmount |
| 10.4 | Organizer b�o c�o sử dụng (Report) | Status → Reported |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 10.5 | Sponsor đề nghị t�i trợ event đ� c� proposal active | Bị chặn "Đ� c� đề nghị" |
| 10.6 | Sponsor hủy proposal sau khi Accepted | Bị chặn |
| 10.7 | Organizer reject proposal, l� do < 10 k� tự | Bị chặn |
| 10.8 | Event hủy → proposal Pending/Accepted tự Cancelled | Kiểm tra status |
| 10.9 | Admin rollback proposal về Pending | Th�nh c�ng |
| 10.10 | Sponsor offer v�o event Pending (chưa Approved) | Bị chặn |

---

## 11. Đ�nh gi� hai chiều (FR-18)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 11.1 | Volunteer đ�nh gi� organizer sau event Completed | Th�nh c�ng (1-5 sao + nhận x�t) |
| 11.2 | Organizer đ�nh gi� volunteer đ� tham gia | Th�nh c�ng |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 11.3 | Đ�nh gi� event chưa Completed | Bị chặn |
| 11.4 | Đ�nh gi� 2 lần c�ng cặp/event | Bị chặn "Đ� đ�nh gi�" |
| 11.5 | Volunteer đ�nh gi� organizer event m�nh kh�ng tham gia | Bị chặn |
| 11.6 | Volunteer tự x�a đ�nh gi� | Bị chặn (chỉ Admin x�a) |
| 11.7 | Admin ẩn đ�nh gi� kh�ng ph� hợp | Th�nh c�ng, kh�ng hiện public |
| 11.8 | Điểm ngo�i 1-5 (0 hoặc 6) | Bị chặn |

---

## 12. Th�ng b�o & Realtime (FR-19, FR-24)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 12.1 | Event được duyệt → organizer nhận th�ng b�o | C� notification mới |
| 12.2 | Volunteer được check-in → nhận th�ng b�o | C� notification |
| 12.3 | Chat trong channel event → tin nhắn hiện realtime | SignalR push |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 12.4 | Thời gian hiển thị "X ph�t trước" đ�ng timezone | Kh�ng hiện "7 giờ trước" khi vừa gửi |
| 12.5 | Volunteer kh�ng thuộc event → truy cập channel | Bị chặn |
| 12.6 | Gửi tin nhắn rỗng | Bị chặn |
| 12.7 | Mất kết nối SignalR → reconnect | Tự reconnect, kh�ng mất tin |

---

## 13. Admin quản trị (FR-23)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 13.1 | Admin kh�a user | User bị 401 mọi API |
| 13.2 | Admin mở kh�a user | User hoạt động b�nh thường |
| 13.3 | Admin tạo user mới | Th�nh c�ng |
| 13.4 | Admin export events CSV | Tải file CSV đ�ng |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 13.5 | Kh�a organizer c� event Approved | Event tự hủy, campaign/proposal cascade |
| 13.6 | Admin transfer event cho organizer chưa Verified | Bị chặn |
| 13.7 | Admin transfer event cho organizer bị kh�a | Bị chặn |
| 13.8 | Admin x�a skill đang được event sử dụng | Skill bị x�a khỏi JSON event |
| 13.9 | Export > 10.000 rows | Bị giới hạn maxRows |
| 13.10 | Admin auto-complete event chưa qu� hạn 24h | Kh�ng complete |

---

## 14. Hồ sơ & KYC (FR-03, FR-05)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 14.1 | Volunteer cập nhật profile (kỹ năng, bio, avatar) | Lưu th�nh c�ng |
| 14.2 | Volunteer gửi KYC (ảnh CCCD + ch�n dung) | Status → PendingVerification |
| 14.3 | Admin duyệt KYC | Status → Verified, volunteer nhận th�ng b�o |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 14.4 | Admin từ chối KYC, l� do < 10 k� tự | Bị chặn |
| 14.5 | Volunteer gửi KYC lần 2 khi đang Pending | Bị chặn hoặc ghi đ� |
| 14.6 | Xem profile người kh�c → kh�ng thấy ảnh CCCD | Đ�ng, KYC kh�ng leak |
| 14.7 | Volunteer gửi minh chứng kỹ năng → admin duyệt | Skill → Verified |

---

## 15. Bản đồ & Filter (FR-02)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 15.1 | Chọn b�n k�nh 5km → hiện event trong 5km | Số event tr�n bản đồ = số trong list |
| 15.2 | Chọn kỹ năng "Kh�ng y�u cầu kỹ năng" | Hiện event kh�ng y�u cầu skill |
| 15.3 | T�m kiếm keyword | Kết quả đ�ng |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 15.4 | Chọn 10km rồi đổi 5km | Số marker tr�n bản đồ = số event trong list (kh�ng lệch) |
| 15.5 | T�m keyword kh�ng tồn tại | Hiện "Kh�ng t�m thấy sự kiện" |
| 15.6 | Kh�ng cho ph�p GPS → bản đồ vẫn hiện | Hiện vị tr� mặc định, kh�ng crash |

---

## 16. Sponsor Profile (FR-27)

### Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 16.1 | Sponsor v�o /sponsor/profile lần đầu | Profile tự tạo, form trống |
| 16.2 | Sponsor cập nhật th�ng tin | Lưu th�nh c�ng |

### T�nh huống bất thường
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 16.3 | Volunteer truy cập /sponsor/profile | Bị redirect (kh�ng phải Sponsor) |
| 16.4 | Sponsor để trống t�n tổ chức → lưu | Bị chặn validation |

---

## 17. T�nh huống đặc biệt / Edge case tổng hợp

| # | Kịch bản | Kết quả mong đợi |
|---|----------|------------------|
| 17.1 | Event đến giờ bắt đầu nhưng chưa c� ai đăng k� | Hệ thống gửi th�ng b�o cho organizer |
| 17.2 | Event kết th�c nhưng organizer kh�ng Complete | Admin thấy trong overdue preview, auto-complete sau 24h |
| 17.3 | Organizer tạo event → bị kh�a → event tự hủy | Cascade đ�ng |
| 17.4 | 2 tab c�ng login → 1 tab logout | Tab c�n lại bị đẩy về login khi gọi API |
| 17.5 | Upload ảnh > 5MB | Bị chặn hoặc resize |
| 17.6 | Nhập XSS `<script>alert(1)</script>` v�o t�n event | Hiển thị text thuần, kh�ng execute |
| 17.7 | Nhập SQL injection v�o search | Kh�ng lỗi, trả kết quả rỗng |
| 17.8 | Mở 2 browser, c�ng đăng k� event → 1 người cuối hết chỗ | Người sau nhận lỗi "Hết chỗ" |
| 17.9 | Refresh token hết hạn (sau 7 ng�y) | Bị đẩy về login |
| 17.10 | Event c� 100 volunteer check-in → Complete | Chứng chỉ cấp đủ 100 |
| 17.11 | Trang hiển thị tiếng Việt đ�ng (kh�ng mojibake) | Tất cả trang kh�ng c� k� tự lạ |
| 17.12 | Mobile responsive (viewport 375px) | Layout kh�ng vỡ |
| 17.13 | Slow network (3G) → submit form | Kh�ng submit 2 lần (double-click protection) |
| 17.14 | Back button sau khi submit form | Kh�ng re-submit |

---

## C�ch sử dụng t�i liệu n�y

1. **Mỗi kịch bản** = 1 test case. Đ�nh dấu ✅/❌ khi test.
2. **T�nh huống bất thường** quan trọng hơn happy path � đ�y l� nơi bug thường ẩn.
3. Ưu ti�n test theo thứ tự: **Security (RBAC, leak)** → **Data integrity (cascade, status)** → **UX (th�ng b�o, redirect)**.
4. Nếu ph�t hiện lỗi, ghi lại: số kịch bản + m� tả lỗi + screenshot.

---

*Tổng: 17 nh�m, ~120 kịch bản.*
