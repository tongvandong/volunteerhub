# Kế hoạch refactor UI Volunteer và Organizer

## Mục tiêu

Refactor mã React của các trang Volunteer và Organizer để dễ đọc, dễ giải thích, dễ sửa theo phong cách bài tập lớn sinh viên. Giao diện, logic nghiệp vụ, dữ liệu vào/ra và API phải giữ nguyên.

## Tình trạng triển khai

Đã thực hiện theo kế hoạch với các thay đổi an toàn, không đổi giao diện hoặc hợp đồng API:

- `MyEvents`: tách bộ lọc và thẻ sự kiện thành component hiển thị riêng; file trang chỉ giữ state, API và callback.
- `OrganizerVerification`, `OrganizerInsights`, `EventForm`: thay các phần tính toán đơn giản bằng hàm/biến rõ ràng, giảm `useMemo` không cần thiết.
- `MyRegistrations`, `Activity`, `MyDonations`: gom logic lọc và tổng hợp thành hàm thuần có tên rõ ràng; tái sử dụng bộ lọc đăng ký ở hai trang.
- `ManageEvent`: tách dữ liệu tải ban đầu, hằng số form, danh sách tab và modal hủy sự kiện ra file riêng. Các tab hiện có vẫn giữ ownership nghiệp vụ riêng để tránh truyền props rối.
- Các trang nhỏ còn lại đã có cấu trúc gọn hoặc component con rõ ràng, nên được giữ nguyên để tránh refactor hình thức.

## Những điều không được thay đổi

- Không đổi URL hoặc quyền truy cập của trang.
- Không đổi endpoint API, method, request body hoặc cách đọc response.
- Không đổi tên trạng thái nghiệp vụ như `Approved`, `Confirmed`, `Completed`, `Cancelled`.
- Không đổi điều kiện hiển thị nút, modal, thông báo lỗi hoặc thông báo thành công.
- Không đổi CSS class, bố cục, màu sắc, kích thước và nội dung hiển thị nếu không cần thiết.
- Không gộp nhiều đợt refactor vào một commit lớn.

## Cách viết sau khi refactor

- Một file chỉ nên làm một nhiệm vụ rõ ràng.
- Dùng tên đầy đủ, dễ hiểu: `loadRegistrations`, `handleCancelRegistration`, `selectedRegistration`.
- Tránh tên ngắn và mơ hồ như `x`, `d`, `fn`, `res` khi biến còn được dùng ở nhiều dòng.
- Mỗi hàm xử lý sự kiện chỉ làm một việc chính: tải dữ liệu, lưu, hủy, mở modal hoặc đóng modal.
- Viết điều kiện theo từng bước với `if` và biến trung gian có tên rõ ràng. Tránh biểu thức điều kiện dài trong JSX.
- Chỉ dùng `useMemo` hoặc `useCallback` khi có lý do rõ ràng. Không dùng chỉ để làm mã trông hiện đại hơn.
- Component cha giữ state và các lệnh gọi API chính; component con nhận dữ liệu và callback qua props.
- Không tạo store toàn cục, custom hook phức tạp hoặc lớp trừu tượng mới nếu chưa thật sự cần.

Ví dụ nên viết:

```jsx
function isEventFinished(event) {
  if (!event || !event.endDate) {
    return false;
  }

  return new Date(event.endDate) <= new Date();
}
```

Thay vì đặt điều kiện ngày giờ dài trực tiếp trong JSX.

## Cấu trúc thư mục đề xuất

```text
src/pages/
  volunteer/
    components/
    helpers/
  organizer/
    components/
    helpers/
    ManageEvent/
      components/
      modals/
```

Chỉ tách component giao diện nhỏ, modal và hàm thuần vào các thư mục này. Không chuyển API của cả trang sang nơi khó lần theo.

## Thứ tự triển khai

### Giai đoạn 0: Chốt hành vi hiện tại

Trước khi động vào từng trang, ghi ngắn các nội dung sau:

- Route của trang và role được phép truy cập.
- API được gọi khi tải trang và khi bấm từng nút.
- Dữ liệu form gửi đi.
- Các trạng thái loading, empty, error, success.
- Modal và điều kiện mở modal.

Đây là danh sách đối chiếu sau refactor.

### Giai đoạn 1: Các trang Volunteer nhỏ

Làm lần lượt:

1. `Profile.jsx`
2. `Achievements.jsx`
3. `MyCertificates.jsx`
4. `MyDonations.jsx`
5. `MyBadges.jsx`

Tách các phần hiển thị lặp lại thành component nhỏ như `CertificateCard`, `DonationCard`, `BadgeCard`. Mỗi trang giữ việc tải dữ liệu và xử lý nút bấm tại file chính.

### Giai đoạn 2: Các trang Volunteer lớn

Làm lần lượt:

1. `Home.jsx`
2. `Passport.jsx`
3. `MyRegistrations.jsx`
4. `Activity.jsx`
5. `MyProfile.jsx`

Mục tiêu tách các khối lớn nhưng không đổi nghiệp vụ:

- `RegistrationFilters`, `RegistrationCard`, `RatingForm` cho đăng ký và hoạt động.
- `ProfileSection`, `SkillList`, `SkillVerificationModal` cho hồ sơ.
- `RecommendedEvents`, `UpcomingEvents`, `VolunteerProgress` cho trang chủ.

### Giai đoạn 3: Các trang Organizer độc lập

Làm lần lượt:

1. `MyEvents.jsx`
2. `OrganizerVerification.jsx`
3. `OrganizerInsights.jsx`
4. `EventForm.jsx`

Với `EventForm.jsx`, tách theo bước form:

- `BasicInformationStep`
- `LocationStep`
- `VolunteerRequirementsStep`
- `ReviewStep`

File `EventForm.jsx` vẫn giữ form state, validate, tải danh mục và submit để luồng dữ liệu không bị phân tán.

### Giai đoạn 4: Trang quản lý sự kiện Organizer

`ManageEvent/index.jsx` đang lớn nhất, vì vậy refactor từng phần nhỏ và kiểm tra ngay sau mỗi phần.

1. Giữ file `index.jsx` cho dữ liệu chung: event, registrations, shifts, tab đang mở và hàm tải lại dữ liệu.
2. Từng tab tự giữ state giao diện riêng của nó:
   - `RegistrationsTab.jsx`
   - `CheckInTab.jsx`
   - `ShiftsTab.jsx`
   - `CampaignsTab.jsx`
   - `CorporateTab.jsx`
   - `ReportTab.jsx`
3. Tách modal thành các file riêng khi modal có form hoặc nhiều điều kiện:
   - `WalkInRegistrationModal`
   - `InterviewModal`
   - `ShiftModal`
   - `CompleteEventModal`
   - `FinancialReportModal`
4. Không chuyển toàn bộ business logic vào một helper chung. Hàm nào chỉ dùng cho một tab thì để tại tab đó.

## Mẫu xử lý API dễ đọc

```jsx
async function loadRegistrations() {
  setLoading(true);
  setError('');

  try {
    const response = await registrationApi.getByEvent(eventId);
    setRegistrations(response.data || []);
  } catch (error) {
    setError(error.response?.data?.message || 'Không tải được danh sách đăng ký.');
  } finally {
    setLoading(false);
  }
}
```

Giữ cùng một mẫu cho các thao tác tải, lưu, hủy và cập nhật. Mẫu này dễ đọc, dễ debug bằng Chrome Network và dễ trình bày.

## Checklist sau mỗi file

- Chạy `npm run build` thành công.
- Mở đúng route bằng Chrome với tài khoản đúng role.
- Kiểm tra giao diện desktop và mobile không bị thay đổi bất thường.
- So sánh request trong Network: URL, method, payload và response phải giữ nguyên.
- Kiểm tra trạng thái loading, danh sách rỗng và lỗi API.
- Kiểm tra các nút, modal, form validation và thông báo.
- Chỉ commit các file liên quan tới phần vừa refactor.

## Thứ tự ưu tiên

1. `ManageEvent/index.jsx`
2. `Activity.jsx`
3. `MyProfile.jsx`
4. `EventForm.jsx`
5. Các trang nhỏ còn lại

## Tiêu chí hoàn thành

- File lớn được tách thành các component có tên mô tả đúng chức năng.
- Người mới có thể tìm được state, API call và hàm xử lý nút bấm trong vài phút.
- Không có thay đổi về giao diện, luồng nghiệp vụ, request hoặc response.
- Mỗi thay đổi đều build thành công và đã kiểm tra các thao tác chính trên trình duyệt.
