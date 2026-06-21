# Đặc tả chức năng ủng hộ cá nhân và tài trợ doanh nghiệp - Volunteer Hub

## 1. Mục tiêu

Tài liệu này đặc tả đầy đủ nghiệp vụ tài chính hỗ trợ sự kiện trong Volunteer Hub, gồm hai luồng riêng:

1. **Ủng hộ cá nhân**: dành cho Volunteer/User cá nhân muốn đóng góp tiền cho một đợt kêu gọi của sự kiện.
2. **Tài trợ doanh nghiệp/tổ chức**: dành cho tài khoản Sponsor muốn tài trợ chính thức cho sự kiện, hoặc Organizer muốn gửi lời mời tài trợ tới Sponsor.

Mục tiêu thiết kế:

- Event vẫn chạy độc lập, không bắt buộc phải có tài trợ.
- Ủng hộ cá nhân đơn giản, nhẹ, phù hợp với khoản nhỏ.
- Tài trợ doanh nghiệp có quy trình đề nghị/chấp nhận rõ ràng.
- Chỉ số tiền đã được Organizer xác nhận nhận thật mới được tính vào báo cáo.
- Không biến app thành ví điện tử hoặc hệ thống kế toán phức tạp.

## 2. Khái niệm chính

### 2.1. Event

Sự kiện tình nguyện do Organizer tạo và Admin duyệt.

Event tập trung vào:

- Tên sự kiện.
- Mô tả.
- Thời gian.
- Địa điểm.
- Số lượng volunteer.
- Kỹ năng cần.
- Đăng ký, điểm danh, chứng chỉ, báo cáo tác động.

Event không bắt buộc phải có ủng hộ hoặc tài trợ.

### 2.2. Support Campaign

Đợt kêu gọi ủng hộ tiền do Organizer tạo trong trang quản lý event.

Dùng cho **cá nhân/volunteer/user** đóng góp tiền nhỏ lẻ.

Ví dụ:

```text
Tên đợt kêu gọi: Kêu gọi hỗ trợ chi phí hậu cần
Mục đích: Mua nước uống, găng tay, túi rác và hỗ trợ vận chuyển.
Mục tiêu: 5.000.000đ
Thời gian: 01/09/2026 - 20/09/2026
```

### 2.3. Individual Donation

Khoản ủng hộ cá nhân gửi vào một Support Campaign.

Khoản này có thể do:

- Volunteer đang tham gia event.
- User cá nhân không tham gia event.
- Người dùng đã có tài khoản trong hệ thống.

Giai đoạn đầu nên yêu cầu đăng nhập để dễ quản lý lịch sử. Nếu muốn nhận khách vãng lai, có thể mở rộng sau.

### 2.4. Sponsor Account

Tài khoản dành cho tổ chức/doanh nghiệp muốn tài trợ chính thức.

Sponsor có hồ sơ riêng:

- Tên tổ chức/doanh nghiệp.
- Người đại diện.
- Email/số điện thoại.
- Website/Facebook.
- Logo.
- Mô tả đơn vị.

### 2.5. Sponsorship Proposal

Đề nghị/lời mời tài trợ chính thức giữa Organizer và Sponsor.

Có hai chiều:

1. `OrganizerRequest`: Organizer gửi lời mời tài trợ tới Sponsor.
2. `SponsorOffer`: Sponsor chủ động đề nghị tài trợ event.

Chỉ khi proposal được chấp nhận và xác nhận đã nhận, nó mới trở thành tài trợ chính thức.

## 3. Phạm vi chức năng

### 3.1. Trong phạm vi

- Organizer tạo/sửa/mở/đóng đợt kêu gọi ủng hộ cá nhân.
- Volunteer/User gửi khoản ủng hộ cá nhân.
- Organizer xác nhận/từ chối khoản ủng hộ cá nhân.
- Organizer gửi lời mời tài trợ tới Sponsor.
- Sponsor chủ động gửi đề nghị tài trợ cho event.
- Organizer/Sponsor chấp nhận hoặc từ chối proposal tùy chiều.
- Organizer xác nhận đã nhận tài trợ.
- Organizer nhập báo cáo sử dụng tiền sau event.
- Public event detail hiển thị dữ liệu đã xác nhận và được phép công khai.
- Admin xem/audit/export dữ liệu tài trợ/ủng hộ.

### 3.2. Ngoài phạm vi giai đoạn đầu

- Thanh toán online thật.
- Ví điện tử nội bộ.
- Hoàn tiền tự động.
- Đối soát ngân hàng tự động.
- Hợp đồng tài trợ pháp lý.
- Quản lý hiện vật.
- Hóa đơn/chứng từ tài chính chuẩn kế toán.

## 4. Phân biệt ủng hộ cá nhân và tài trợ doanh nghiệp

| Tiêu chí | Ủng hộ cá nhân | Tài trợ doanh nghiệp/tổ chức |
|---|---|---|
| Đối tượng | Volunteer/User cá nhân | Sponsor account |
| Nghiệp vụ | Gửi tiền vào đợt kêu gọi | Đề nghị hoặc được mời tài trợ chính thức |
| Quy trình | Đơn giản | Có proposal và phản hồi hai bên |
| Hiển thị công khai | Tên cá nhân hoặc ẩn danh | Tên/logo tổ chức nếu được duyệt |
| Trạng thái | PendingConfirmation, Confirmed, Rejected, Cancelled | Pending, Accepted, Rejected, Received, Reported, Cancelled |
| Quyền lợi truyền thông | Không hoặc rất nhẹ | Có thể có quyền lợi/ghi nhận |
| Báo cáo sau event | Tổng hợp cơ bản | Báo cáo tài trợ rõ hơn |

## 5. Luồng ủng hộ cá nhân

### 5.1. Organizer tạo đợt kêu gọi

Trong trang quản lý event, Organizer mở tab:

```text
Kêu gọi ủng hộ
```

Nút:

```text
Tạo đợt kêu gọi
```

Form gồm:

- `Title`: tiêu đề đợt kêu gọi.
- `Description`: mô tả mục đích kêu gọi.
- `TargetAmount`: số tiền mục tiêu.
- `MinimumAmount`: số tiền tối thiểu mong muốn, có thể nullable.
- `StartDate`: thời gian bắt đầu nhận ủng hộ.
- `EndDate`: thời gian kết thúc.
- `ReceiveInfo`: thông tin nhận tiền.
- `TransparencyNote`: ghi chú minh bạch/sử dụng tiền.
- `Status`: trạng thái.

Ví dụ:

```text
Tiêu đề: Kêu gọi hỗ trợ chi phí hậu cần
Mô tả: Số tiền dùng để mua nước uống, găng tay, túi rác và hỗ trợ vận chuyển cho sự kiện dọn biển.
Mục tiêu: 5.000.000đ
Tối thiểu mong muốn: 2.000.000đ
Thời gian: 01/09/2026 - 20/09/2026
Thông tin nhận tiền:
Ngân hàng ABC - 0123456789 - CLB Tình Nguyện X
Nội dung chuyển khoản: DONBIEN + SĐT
```

### 5.2. Trạng thái Support Campaign

```text
Draft
Open
Closed
Cancelled
Reported
```

Ý nghĩa:

- `Draft`: Organizer đang soạn, chưa public.
- `Open`: đang mở nhận ủng hộ.
- `Closed`: đã đóng nhận ủng hộ.
- `Cancelled`: hủy đợt kêu gọi.
- `Reported`: đã có báo cáo sử dụng tiền sau event.

### 5.3. Điều kiện mở campaign

Organizer chỉ được mở campaign nếu:

- Event thuộc quyền sở hữu của Organizer.
- Event không bị `Rejected` hoặc `Cancelled`.
- `Title`, `Description`, `TargetAmount`, `StartDate`, `EndDate`, `ReceiveInfo` hợp lệ.
- `EndDate` sau `StartDate`.
- `TargetAmount` > 0.
- `MinimumAmount` nếu có thì >= 0 và <= `TargetAmount`.

Khuyến nghị:

- Cho phép tạo campaign khi event còn `Pending`.
- Chỉ public campaign khi event đã `Approved`.

### 5.4. User gửi khoản ủng hộ

Trên event detail hoặc campaign detail, user thấy nút:

```text
Ủng hộ
```

Form gồm:

- `Amount`: số tiền ủng hộ.
- `DisplayName`: tên hiển thị.
- `Phone`: số điện thoại, optional nhưng nên có.
- `Email`: email, optional.
- `Note`: ghi chú.
- `IsAnonymous`: ẩn danh hay công khai.
- `ProofImageUrl`: ảnh minh chứng chuyển khoản, optional.

Trạng thái ban đầu:

```text
PendingConfirmation
```

Không tính vào tổng đã nhận cho tới khi Organizer xác nhận.

### 5.5. Organizer xác nhận khoản ủng hộ

Trong màn quản lý campaign, Organizer xem danh sách:

- Người gửi.
- Số tiền.
- Ghi chú.
- Minh chứng nếu có.
- Trạng thái.
- Thời gian gửi.

Organizer có thể:

- `Confirm`: xác nhận đã nhận tiền.
- `Reject`: từ chối nếu không tìm thấy giao dịch hoặc thông tin không hợp lệ.
- `Cancel`: hủy theo yêu cầu người gửi nếu chưa xác nhận.

Khi confirm:

- `Status` chuyển thành `Confirmed`.
- Ghi `ConfirmedAt`.
- Ghi `ConfirmedBy`.
- Số tiền được cộng vào `ConfirmedAmount`.

### 5.6. Trạng thái Individual Donation

```text
PendingConfirmation
Confirmed
Rejected
Cancelled
```

Ý nghĩa:

- `PendingConfirmation`: user đã gửi thông tin, chờ Organizer xác nhận.
- `Confirmed`: Organizer đã xác nhận nhận tiền.
- `Rejected`: Organizer từ chối.
- `Cancelled`: user hoặc Organizer hủy trước khi xác nhận.

### 5.7. Public hiển thị campaign

Event detail hiển thị campaign nếu:

- Event đã `Approved` hoặc `Completed`.
- Campaign đang `Open`, `Closed` hoặc `Reported`.
- Campaign không bị `Cancelled`.

Thông tin public:

- Tiêu đề.
- Mô tả.
- Mục tiêu.
- Đã xác nhận.
- Còn thiếu.
- Thời gian còn lại hoặc đã kết thúc.
- Danh sách người ủng hộ công khai.

Không hiển thị:

- Số điện thoại/email người ủng hộ.
- Minh chứng chuyển khoản.
- Khoản đang `PendingConfirmation`, trừ khi chỉ hiển thị cho chính người gửi.

## 6. Luồng tài trợ doanh nghiệp/tổ chức

## 6.1. Sponsor tạo tài khoản

Sponsor đăng ký hoặc được tạo tài khoản với role `Sponsor`.

Thông tin sponsor profile:

- `OrganizationName`
- `RepresentativeName`
- `Email`
- `Phone`
- `Website`
- `LogoUrl`
- `Description`
- `IsVerified`, optional cho admin xác minh sau.

## 6.2. Organizer gửi lời mời tài trợ

Trong trang quản lý event, Organizer mở tab:

```text
Tài trợ doanh nghiệp
```

Nút:

```text
Mời tài trợ
```

Form gồm:

- `SponsorId`: sponsor muốn mời.
- `Title`: tiêu đề lời mời.
- `Message`: nội dung kêu gọi.
- `RequestedAmount`: số tiền mong muốn.
- `Purpose`: mục đích sử dụng.
- `SponsorBenefits`: quyền lợi/ghi nhận sponsor.
- `ResponseDeadline`: hạn phản hồi.
- `AttachmentUrl`: file/ảnh đính kèm, optional.

Ví dụ:

```text
Sponsor: Công ty ABC
Tiêu đề: Mời tài trợ chi phí hậu cần cho sự kiện dọn biển
Nội dung:
CLB dự kiến tổ chức dọn sạch bãi biển Mỹ Khê với 50 tình nguyện viên.
Chúng tôi mong Công ty ABC hỗ trợ chi phí nước uống, bao rác và vận chuyển.

Số tiền mong muốn: 5.000.000đ
Mục đích sử dụng:
- Nước uống
- Bao rác
- Găng tay
- Xe vận chuyển rác

Quyền lợi:
- Hiển thị logo trên trang sự kiện
- Nhắc tên trong bài tổng kết
- Gửi báo cáo sau sự kiện
Hạn phản hồi: 7 ngày
```

Khi gửi:

- Tạo `SponsorshipProposal`.
- `Type = OrganizerRequest`.
- `Status = Pending`.
- Sponsor nhận được thông báo/lời mời.

## 6.3. Sponsor phản hồi lời mời

Sponsor vào trang:

```text
Lời mời tài trợ
```

Sponsor có thể:

- `Accept`: chấp nhận.
- `Reject`: từ chối.
- `RequestRevision`: yêu cầu chỉnh sửa, optional cho giai đoạn sau.

Giai đoạn đầu nên làm:

```text
Accept / Reject
```

Khi accept:

- `Status = Accepted`.
- Ghi `RespondedAt`.
- Ghi `ResponseMessage` nếu có.

Khi reject:

- `Status = Rejected`.
- Ghi lý do nếu có.

## 6.4. Sponsor chủ động đề nghị tài trợ

Sponsor xem event đã `Approved`.

Trên event detail hoặc sponsor dashboard có nút:

```text
Đề nghị tài trợ
```

Form gồm:

- `EventId`
- `Title`
- `Message`
- `OfferedAmount`
- `Purpose`
- `PublicSponsorName`
- `PublicMessage`
- `LogoUrl`
- `AttachmentUrl`, optional.

Ví dụ:

```text
Tiêu đề: Tài trợ chi phí nước uống cho sự kiện
Số tiền: 3.000.000đ
Mục đích: Hỗ trợ nước uống và vật tư hậu cần
Thông tin public:
Công ty ABC đồng hành cùng hoạt động bảo vệ môi trường.
Logo: abc-logo.png
```

Khi gửi:

- Tạo `SponsorshipProposal`.
- `Type = SponsorOffer`.
- `Status = Pending`.
- Organizer nhận được thông báo.

## 6.5. Organizer phản hồi đề nghị từ Sponsor

Organizer vào tab:

```text
Đề nghị từ Sponsor
```

Organizer có thể:

- `Accept`: chấp nhận tài trợ.
- `Reject`: từ chối.

Khi accept:

- `Status = Accepted`.
- Proposal trở thành tài trợ được chấp thuận nhưng chưa tính là đã nhận tiền.

Khi reject:

- `Status = Rejected`.
- Sponsor thấy trạng thái bị từ chối.

## 6.6. Organizer xác nhận đã nhận tài trợ

Sau khi sponsor chuyển tiền hoặc hoàn tất hỗ trợ, Organizer bấm:

```text
Xác nhận đã nhận
```

Khi đó:

- `Status = Received`.
- Ghi `ReceivedAt`.
- Ghi `ReceivedBy`.
- Số tiền được tính vào tài trợ đã nhận.
- Có thể hiển thị public nếu proposal cho phép công khai.

## 6.7. Báo cáo tài trợ

Sau event, Organizer nhập báo cáo:

- `UsedAmount`
- `Summary`
- `ExpenseDetails`
- `AttachmentUrl`, optional.

Khi báo cáo xong:

- `Status = Reported`.
- Sponsor có thể xem báo cáo.
- Public event detail có thể hiển thị summary nếu được phép.

## 6.8. Trạng thái Sponsorship Proposal

Giai đoạn đầu dùng:

```text
Pending
Accepted
Rejected
Received
Reported
Cancelled
```

Ý nghĩa:

- `Pending`: đang chờ bên kia phản hồi.
- `Accepted`: hai bên đã đồng ý tài trợ.
- `Rejected`: bị từ chối.
- `Received`: Organizer xác nhận đã nhận tiền/tài trợ.
- `Reported`: đã có báo cáo sử dụng sau event.
- `Cancelled`: bị hủy trước khi hoàn tất.

## 7. Báo cáo sau event

Khi event completed, impact report nên gồm:

### 7.1. Phần volunteer impact

- Số volunteer đăng ký.
- Số volunteer được xác nhận.
- Số volunteer đã điểm danh.
- Tổng giờ tình nguyện.
- Số certificate đã cấp.

### 7.2. Phần ủng hộ cá nhân

Hiển thị:

- Tổng số tiền cá nhân đã xác nhận.
- Số người ủng hộ.
- Danh sách người ủng hộ công khai.

Ví dụ:

```text
Ủng hộ cá nhân:
- Tổng đã nhận: 2.300.000đ
- Số lượt ủng hộ: 12
- Công khai: Nguyễn Văn A - 200.000đ, Ẩn danh - 500.000đ
```

### 7.3. Phần tài trợ doanh nghiệp

Hiển thị:

- Sponsor đã nhận tài trợ.
- Số tiền đã nhận.
- Public message/logo nếu có.
- Summary báo cáo sử dụng nếu đã reported.

Ví dụ:

```text
Đơn vị tài trợ:
- Công ty ABC: 5.000.000đ
- Công ty XYZ: 3.000.000đ
```

### 7.4. Nếu không có ủng hộ/tài trợ

Không coi event là thất bại.

Hiển thị nhẹ:

```text
Sự kiện chưa ghi nhận khoản ủng hộ hoặc tài trợ nào.
```

Hoặc ẩn section tài chính nếu muốn UI gọn.

## 8. Phân quyền

## 8.1. Volunteer/User

Được:

- Xem campaign đang mở.
- Gửi khoản ủng hộ cá nhân.
- Xem khoản ủng hộ của mình.
- Hủy khoản ủng hộ nếu còn `PendingConfirmation`.
- Chọn ẩn danh/công khai.

Không được:

- Tạo campaign.
- Xác nhận tiền đã nhận.
- Xem minh chứng chuyển khoản của người khác.
- Gửi sponsorship proposal doanh nghiệp nếu không có role Sponsor.

## 8.2. Sponsor

Được:

- Xem event đã approved.
- Xem lời mời tài trợ gửi tới mình.
- Chấp nhận/từ chối lời mời tài trợ.
- Chủ động gửi đề nghị tài trợ event.
- Xem danh sách proposal/tài trợ của mình.
- Xem báo cáo tài trợ sau event.

Không được:

- Quản lý event.
- Duyệt volunteer.
- Điểm danh.
- Xác nhận tiền đã nhận thay Organizer.
- Xem dữ liệu cá nhân nhạy cảm của volunteer.

## 8.3. Organizer

Được:

- Tạo/sửa/mở/đóng campaign của event mình.
- Xem donation gửi vào campaign của event mình.
- Xác nhận/từ chối donation.
- Gửi lời mời tài trợ tới sponsor.
- Xem proposal sponsor gửi cho event mình.
- Chấp nhận/từ chối proposal sponsor gửi.
- Xác nhận đã nhận tài trợ.
- Nhập báo cáo sử dụng tiền.

Không được:

- Quản lý campaign/proposal của event người khác.
- Tự sửa nội dung proposal do sponsor gửi, ngoài ghi chú/response của organizer.

## 8.4. Admin

Được:

- Xem toàn bộ campaign, donation, proposal.
- Ẩn/hủy campaign/proposal vi phạm.
- Export báo cáo.
- Xem audit log.
- Can thiệp tranh chấp nếu cần.

## 9. Entity đề xuất

## 9.1. SupportCampaign

```text
Id
EventId
Title
Description
TargetAmount
MinimumAmount nullable
StartDate
EndDate
ReceiveInfo
TransparencyNote
Status
CreatedBy
CreatedAt
UpdatedAt
```

Ràng buộc:

- `EventId` bắt buộc.
- `Title` bắt buộc, tối đa 200 ký tự.
- `Description` bắt buộc.
- `TargetAmount` > 0.
- `MinimumAmount` nullable, nếu có thì >= 0 và <= `TargetAmount`.
- `EndDate` > `StartDate`.

## 9.2. IndividualDonation

```text
Id
CampaignId
UserId
Amount
DisplayName
Phone nullable
Email nullable
Note nullable
IsAnonymous
ProofImageUrl nullable
Status
ConfirmedBy nullable
ConfirmedAt nullable
RejectedReason nullable
CreatedAt
UpdatedAt
```

Ràng buộc:

- `CampaignId` bắt buộc.
- `UserId` bắt buộc giai đoạn đầu.
- `Amount` > 0.
- `DisplayName` bắt buộc nếu `IsAnonymous = false`.
- Chỉ donation `Confirmed` mới tính vào tổng public.

## 9.3. SponsorProfile

Nếu chưa có profile riêng, bổ sung:

```text
Id
UserId
OrganizationName
RepresentativeName
Email
Phone
Website nullable
LogoUrl nullable
Description nullable
IsVerified
CreatedAt
UpdatedAt
```

## 9.4. SponsorshipProposal

```text
Id
EventId
SponsorId
OrganizerId
Type
Title
Message
RequestedAmount nullable
OfferedAmount nullable
Purpose
SponsorBenefits nullable
PublicSponsorName nullable
PublicMessage nullable
LogoUrl nullable
AttachmentUrl nullable
ResponseMessage nullable
Status
CreatedBy
CreatedAt
RespondedAt nullable
ReceivedAt nullable
ReceivedBy nullable
ReportedAt nullable
CancelledAt nullable
```

Ràng buộc:

- `Type` là `OrganizerRequest` hoặc `SponsorOffer`.
- Nếu `Type = OrganizerRequest`, `RequestedAmount` nên có.
- Nếu `Type = SponsorOffer`, `OfferedAmount` nên có.
- Amount phải > 0 nếu nhập.
- `SponsorId`, `OrganizerId`, `EventId` bắt buộc.
- Sponsor phải có role Sponsor.
- Organizer phải là owner của event.

## 9.5. SponsorshipReport

Giai đoạn đầu có thể gộp vào proposal. Nếu tách bảng:

```text
Id
ProposalId
UsedAmount
Summary
ExpenseDetails
AttachmentUrl nullable
CreatedBy
CreatedAt
UpdatedAt
```

Ràng buộc:

- Chỉ tạo report khi proposal đã `Received`.
- `UsedAmount` >= 0.
- `UsedAmount` không nên vượt số tiền đã received, trừ khi có giải trình.

## 10. API đề xuất

## 10.1. Support Campaign

```text
GET    /api/events/{eventId}/support-campaigns
GET    /api/support-campaigns/{campaignId}
POST   /api/events/{eventId}/support-campaigns
PUT    /api/support-campaigns/{campaignId}
PUT    /api/support-campaigns/{campaignId}/open
PUT    /api/support-campaigns/{campaignId}/close
PUT    /api/support-campaigns/{campaignId}/cancel
```

Quyền:

- GET public chỉ trả campaign public/open/closed/reported.
- POST/PUT/open/close/cancel chỉ Organizer owner hoặc Admin.

## 10.2. Individual Donation

```text
GET    /api/support-campaigns/{campaignId}/donations
POST   /api/support-campaigns/{campaignId}/donations
GET    /api/donations/my
PUT    /api/donations/{donationId}/confirm
PUT    /api/donations/{donationId}/reject
PUT    /api/donations/{donationId}/cancel
```

Quyền:

- POST: authenticated user.
- GET campaign donations: Organizer owner hoặc Admin.
- GET my: chính user.
- confirm/reject: Organizer owner hoặc Admin.
- cancel: user owner khi donation còn pending, hoặc Organizer/Admin.

## 10.3. Sponsorship Proposal

```text
GET    /api/events/{eventId}/sponsorship-proposals
POST   /api/events/{eventId}/sponsorship-proposals/organizer-request
POST   /api/events/{eventId}/sponsorship-proposals/sponsor-offer
GET    /api/sponsorship-proposals/my
GET    /api/sponsorship-proposals/{proposalId}
PUT    /api/sponsorship-proposals/{proposalId}/accept
PUT    /api/sponsorship-proposals/{proposalId}/reject
PUT    /api/sponsorship-proposals/{proposalId}/received
PUT    /api/sponsorship-proposals/{proposalId}/cancel
```

Quyền:

- Organizer request: Organizer owner của event.
- Sponsor offer: Sponsor role.
- Accept/reject:
  - Với `OrganizerRequest`: Sponsor được mời phản hồi.
  - Với `SponsorOffer`: Organizer owner phản hồi.
- Received: Organizer owner hoặc Admin.
- My: trả proposal liên quan tới sponsor hiện tại hoặc organizer hiện tại.

## 10.4. Sponsorship Report

```text
GET    /api/sponsorship-proposals/{proposalId}/report
POST   /api/sponsorship-proposals/{proposalId}/report
PUT    /api/sponsorship-reports/{reportId}
```

Quyền:

- GET: Sponsor liên quan, Organizer owner, Admin; public chỉ khi report được đánh dấu public nếu có.
- POST/PUT: Organizer owner hoặc Admin.

## 11. UI đề xuất

## 11.1. Organizer - quản lý event

Thêm hai tab riêng:

```text
Kêu gọi ủng hộ
Tài trợ doanh nghiệp
```

### Tab Kêu gọi ủng hộ

Hiển thị:

- Danh sách campaign.
- Trạng thái campaign.
- Mục tiêu.
- Đã xác nhận.
- Số lượt ủng hộ pending/confirmed.

Nút:

- Tạo đợt kêu gọi.
- Mở/đóng/hủy campaign.
- Xem donation.
- Xác nhận/từ chối donation.
- Nhập báo cáo sử dụng tiền.

### Tab Tài trợ doanh nghiệp

Hiển thị 3 khối:

1. Lời mời đã gửi.
2. Đề nghị từ Sponsor.
3. Tài trợ đã nhận.

Nút:

- Mời tài trợ.
- Accept/reject proposal từ sponsor.
- Xác nhận đã nhận.
- Nhập báo cáo.

## 11.2. Event detail public

Hiển thị:

- Campaign đang mở.
- Nút `Ủng hộ`.
- Tiến độ đã xác nhận/mục tiêu.
- Sponsor đã received nếu được public.

Không hiển thị:

- Pending donation.
- Proposal pending.
- Dữ liệu liên hệ cá nhân.

## 11.3. Volunteer/User

Thêm trang:

```text
Ủng hộ của tôi
```

Hoặc gộp vào dashboard/profile.

Hiển thị:

- Event.
- Campaign.
- Amount.
- Status.
- Ngày gửi.
- Ghi chú.

## 11.4. Sponsor

Sponsor dashboard có:

```text
Lời mời tài trợ
Đề nghị của tôi
Tài trợ đã nhận
Báo cáo tài trợ
```

Sponsor có thể:

- Xem lời mời từ organizer.
- Accept/reject.
- Tạo đề nghị tài trợ.
- Xem trạng thái.
- Xem báo cáo.

## 11.5. Admin

Admin có màn hoặc tab:

```text
Quản lý tài trợ/ủng hộ
```

Tối thiểu hiển thị:

- Campaign list.
- Donation list.
- Sponsorship proposal list.
- Status filter.
- Export.
- Audit log.

## 12. Validation

## 12.1. Campaign

- Title bắt buộc, 3-200 ký tự.
- Description bắt buộc, 10-2000 ký tự.
- TargetAmount > 0.
- MinimumAmount nếu nhập phải >= 0 và <= TargetAmount.
- StartDate < EndDate.
- ReceiveInfo bắt buộc khi campaign open.
- Không cho open nếu event `Rejected`, `Cancelled`, hoặc không tồn tại.

## 12.2. Donation

- Amount > 0.
- Campaign phải `Open`.
- User phải authenticated.
- DisplayName bắt buộc nếu không anonymous.
- ProofImageUrl nếu có phải là URL hợp lệ hoặc file upload hợp lệ.
- Không cho confirm donation không thuộc campaign của event mình.

## 12.3. Sponsorship Proposal

- Event phải tồn tại và không bị rejected/cancelled.
- Sponsor phải tồn tại và có role Sponsor.
- Organizer phải là owner event.
- Title bắt buộc.
- Message bắt buộc.
- Amount nếu có phải > 0.
- Không cho sponsor tự accept proposal do chính mình gửi.
- Không cho organizer tự accept proposal do chính mình gửi; bên còn lại phải phản hồi.

## 13. Audit log

Nên ghi audit cho các thao tác:

- Tạo/mở/đóng/hủy campaign.
- Tạo donation.
- Confirm/reject/cancel donation.
- Organizer gửi lời mời tài trợ.
- Sponsor gửi đề nghị tài trợ.
- Accept/reject/cancel proposal.
- Confirm received proposal.
- Tạo/sửa report.

Audit fields:

```text
ActorUserId
Action
EntityType
EntityId
OldStatus
NewStatus
Timestamp
MetadataJson
```

## 14. Thứ tự triển khai khuyến nghị

## 14.1. Giai đoạn 1 - Ủng hộ cá nhân

1. Thêm `SupportCampaign`.
2. Thêm `IndividualDonation`.
3. Organizer tạo/mở/đóng campaign.
4. User gửi donation.
5. Organizer confirm/reject.
6. Event detail hiển thị campaign và tổng confirmed.
7. User xem donation của mình.

## 14.2. Giai đoạn 2 - Tài trợ doanh nghiệp hai chiều

1. Thêm hoặc hoàn thiện `SponsorProfile`.
2. Thêm `SponsorshipProposal`.
3. Organizer gửi lời mời sponsor.
4. Sponsor accept/reject lời mời.
5. Sponsor gửi đề nghị tài trợ.
6. Organizer accept/reject đề nghị.
7. Organizer xác nhận received.
8. Sponsor dashboard hiển thị proposal của mình.

## 14.3. Giai đoạn 3 - Báo cáo và minh bạch

1. Thêm sponsorship/donation report.
2. Public impact hiển thị tài chính đã confirmed/received.
3. Admin export.
4. Audit log đầy đủ.

## 15. Tiêu chí nghiệm thu

## 15.1. Ủng hộ cá nhân

Pass khi:

1. Organizer tạo được campaign cho event của mình.
2. Campaign chỉ public khi open và event hợp lệ.
3. Volunteer/User gửi donation được.
4. Donation mới ở trạng thái `PendingConfirmation`.
5. Organizer confirm được donation thuộc event mình.
6. Donation confirmed được cộng vào tổng đã xác nhận.
7. Organizer reject được donation không hợp lệ.
8. User xem được donation của mình.
9. Public không thấy thông tin liên hệ/minh chứng riêng tư.

## 15.2. Tài trợ doanh nghiệp

Pass khi:

1. Organizer gửi được lời mời tài trợ tới Sponsor.
2. Sponsor thấy lời mời và accept/reject được.
3. Sponsor gửi được đề nghị tài trợ event.
4. Organizer thấy đề nghị và accept/reject được.
5. Proposal accepted chưa tính là đã nhận tiền.
6. Organizer xác nhận received thì proposal mới tính vào tài trợ đã nhận.
7. Sponsor xem được trạng thái proposal của mình.
8. Public chỉ thấy tài trợ received/public.

## 15.3. Báo cáo

Pass khi:

1. Event completed vẫn hoạt động khi không có donation/sponsor.
2. Event có donation/sponsor hiển thị tổng confirmed/received.
3. Organizer nhập được báo cáo sử dụng tiền.
4. Sponsor liên quan xem được báo cáo.
5. Admin export được dữ liệu.

## 16. Kết luận thiết kế

Thiết kế nên chốt như sau:

```text
Event là nghiệp vụ tình nguyện, không phụ thuộc tài trợ.
Volunteer/User ủng hộ qua SupportCampaign.
Sponsor doanh nghiệp/tổ chức tài trợ qua SponsorshipProposal.
Organizer là người xác nhận tiền đã nhận.
Chỉ confirmed/received mới tính vào báo cáo.
Admin giám sát bằng audit/export.
```

Mô hình này đủ thực tế, dễ triển khai theo từng giai đoạn, và không trộn lẫn ủng hộ cá nhân với tài trợ doanh nghiệp.
