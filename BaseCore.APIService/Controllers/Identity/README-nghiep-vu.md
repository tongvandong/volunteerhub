# Phần 1 - Identity / Profile / KYC

Tài liệu này mô tả nghiệp vụ của phần Identity để thành viên phụ trách có thể hiểu phạm vi, role, chức năng và luồng xử lý chính.

## 1. Mục tiêu

Phần Identity chịu trách nhiệm quản lý danh tính, hồ sơ, vai trò và trạng thái xác minh của người dùng trong Volunteer Hub.

Đây là phần nền tảng cho toàn hệ thống vì các phần Event và Finance đều cần kiểm tra:

- Người dùng là ai.
- Người dùng có role gì.
- Organizer đã được xác minh pháp lý chưa.
- Volunteer đã KYC verified chưa.

## 2. Role liên quan

### Guest

- Xem trang chủ, danh sách sự kiện công khai.
- Đăng ký tài khoản mới.
- Đăng nhập.

### Volunteer

- Cập nhật hồ sơ cá nhân.
- Thêm kỹ năng, ngôn ngữ, thông tin tình nguyện.
- Gửi hồ sơ KYC nếu muốn.
- Xem trạng thái KYC.
- Được đăng ký event không yêu cầu KYC.
- Chỉ được đăng ký event yêu cầu KYC khi đã verified.

### Organizer

- Cập nhật thông tin tổ chức.
- Gửi hồ sơ xác minh pháp lý.
- Xem trạng thái xác minh.
- Chỉ được tạo event khi trạng thái organizer verification là verified.
- Nếu sửa thông tin xác minh sau khi đã verified, trạng thái quay lại pending và tạm thời không được tạo event.

### Sponsor

- Đăng nhập và quản lý thông tin tài khoản sponsor.
- Dùng thông tin định danh để gửi proposal tài trợ ở phần Finance.

### Admin

- Xem danh sách hồ sơ xác minh organizer.
- Duyệt/từ chối organizer verification.
- Xem danh sách hồ sơ KYC volunteer.
- Duyệt/từ chối volunteer KYC.
- Quản lý user khi cần.

## 3. Chức năng chính

### Auth

- Đăng ký tài khoản.
- Đăng nhập.
- Cấp JWT.
- Refresh token nếu có.
- Xác định role người dùng.
- Bảo vệ API theo role.

### User Profile

- Xem hồ sơ người dùng hiện tại.
- Cập nhật thông tin cơ bản.
- Lưu thông tin liên hệ.
- Đồng bộ hiển thị tên, email, role trên UI.

### Volunteer Profile

- Lưu kỹ năng.
- Lưu ngôn ngữ.
- Lưu sở thích/kinh nghiệm nếu có.
- Hiển thị volunteer passport hoặc thông tin liên quan đến quá trình tham gia.
- Kỹ năng do volunteer tự khai báo, chưa phải chứng chỉ được xác thực chuyên môn.

### Volunteer KYC

- Volunteer có thể không KYC nếu chỉ muốn dùng các chức năng cơ bản.
- Volunteer gửi ảnh giấy tờ và ảnh chân dung để xác minh.
- Admin duyệt/từ chối.
- Trạng thái cơ bản:
  - `NotSubmitted`: chưa gửi.
  - `Pending`: đang chờ duyệt.
  - `Verified`: đã xác minh.
  - `Rejected`: bị từ chối.

### Organizer Verification

- Organizer gửi thông tin pháp lý của tổ chức.
- Admin duyệt/từ chối.
- Organizer chỉ được tạo event khi verified.
- Nếu organizer sửa thông tin xác minh đã duyệt, cần cảnh báo trước và chuyển trạng thái về pending.

## 4. Luồng nghiệp vụ chính

### Luồng đăng ký và đăng nhập

```text
1. User chọn role khi đăng ký.
2. Hệ thống tạo tài khoản.
3. User đăng nhập.
4. Hệ thống trả JWT.
5. Frontend lưu token và dùng token gọi API.
6. Backend kiểm tra token và role ở các endpoint cần bảo vệ.
```

### Luồng xác minh organizer

```text
1. Organizer đăng nhập.
2. Organizer vào trang xác minh tổ chức.
3. Organizer nhập thông tin pháp lý và gửi hồ sơ.
4. Hệ thống lưu trạng thái Pending.
5. Admin vào màn duyệt organizer.
6. Admin xem hồ sơ và duyệt/từ chối.
7. Nếu duyệt, organizer được tạo event.
8. Nếu từ chối, organizer phải sửa/gửi lại hồ sơ.
```

### Luồng sửa thông tin organizer đã verified

```text
1. Organizer đã verified muốn sửa thông tin xác minh.
2. UI hiển thị cảnh báo: sửa thông tin sẽ cần xác minh lại.
3. Organizer xác nhận sửa.
4. Hệ thống cập nhật thông tin và chuyển trạng thái về Pending.
5. Trong thời gian Pending, organizer không được tạo event mới.
6. Admin duyệt lại.
```

### Luồng KYC volunteer

```text
1. Volunteer đăng nhập.
2. Volunteer vào hồ sơ cá nhân.
3. Volunteer gửi thông tin KYC.
4. Hệ thống lưu trạng thái Pending.
5. Admin kiểm tra và duyệt/từ chối.
6. Nếu Verified, volunteer có thể đăng ký các event yêu cầu KYC.
7. Nếu Rejected, volunteer cần gửi lại hồ sơ hợp lệ.
```

## 5. Rule nghiệp vụ quan trọng

- Không cho organizer chưa verified tạo event.
- Không cho volunteer chưa KYC đăng ký event yêu cầu KYC.
- Volunteer không bắt buộc KYC toàn hệ thống.
- Organizer sửa thông tin xác minh đã duyệt thì phải chờ duyệt lại.
- Admin là role duy nhất được duyệt/từ chối KYC và organizer verification.
- API không được chỉ tin frontend, backend phải tự kiểm tra role/trạng thái.

## 6. API/Controller liên quan

Folder chính:

- `BaseCore.AuthService/`
- `BaseCore.Services/Authen/`
- `BaseCore.APIService/Controllers/Identity/`

Controller/API tiêu biểu:

- Auth/login/register ở `BaseCore.AuthService`.
- Profile API.
- Organizer verification API.
- Admin organizer verification API.
- Admin volunteer verification API.

Các phần khác cần dùng dữ liệu Identity:

- Event cần kiểm tra organizer verified và volunteer KYC.
- Finance cần kiểm tra role sponsor, organizer, volunteer.

## 7. Tiêu chí hoàn thành

- Đăng ký/đăng nhập hoạt động đúng role.
- Organizer chưa verified bị chặn tạo event.
- Organizer verified tạo event được.
- Organizer sửa hồ sơ xác minh thì quay về pending.
- Volunteer chưa KYC bị chặn khi event yêu cầu KYC.
- Volunteer KYC verified đăng ký event yêu cầu KYC được.
- Admin duyệt/từ chối organizer và volunteer KYC được.
