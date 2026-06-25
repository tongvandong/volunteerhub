# Kế hoạch giải thích Frontend Volunteer và Organizer

## Mục tiêu

Giải thích code frontend theo thứ tự từ trên xuống dưới của từng file, để có thể trình bày và debug được. Mỗi phần cần trả lời được ba câu hỏi:

- Dòng code hoặc hàm này làm gì?
- Dữ liệu đi từ đâu đến và đi tiếp đến đâu?
- Nếu xóa hoặc sửa phần này thì giao diện, API hoặc logic sẽ ảnh hưởng thế nào?

## Cách giải thích cho mỗi file

- [ ] Đọc `import`: thư viện, API, component hoặc helper được lấy vào.
- [ ] Đọc `const`: dữ liệu cố định, trạng thái mặc định, map trạng thái.
- [ ] Đọc từng helper function: input, xử lý, output.
- [ ] Đọc từng component nhỏ: props nhận vào, callback trả về.
- [ ] Đọc component trang chính: state, `useEffect`, hàm xử lý thao tác.
- [ ] Đọc JSX `return` từ trên xuống dưới.
- [ ] Mô tả luồng thực tế khi người dùng bấm nút.
- [ ] Nêu lỗi có thể gặp khi một phần bị xóa hoặc viết sai.

## Phần 1: Volunteer

### 1. Logic lọc đăng ký

File: `BaseCore.WebClient/src/pages/volunteer/helpers/registrations.js`

- [ ] Giải thích `getRegistrationFilters`.
- [ ] Giải thích cách đếm từng trạng thái: `Pending`, `Confirmed`, `attended`, `Cancelled`.
- [ ] Giải thích `getVisibleRegistrations`.
- [ ] Giải thích vì sao `Confirmed` phải kiểm tra thêm `!isAttended`.
- [ ] Ví dụ dữ liệu đầu vào và kết quả filter.

### 2. Component nút lọc

File: `BaseCore.WebClient/src/pages/volunteer/components/RegistrationFilters.jsx`

- [ ] Giải thích props `filters`, `selectedFilter`, `onSelect`.
- [ ] Giải thích `.map()` tạo nhiều nút từ mảng dữ liệu.
- [ ] Giải thích điều kiện đổi class của nút đang được chọn.
- [ ] Giải thích click nút gọi `onSelect` về component cha.

### 3. Danh sách đăng ký của tôi

File: `BaseCore.WebClient/src/pages/volunteer/MyRegistrations.jsx`

- [ ] Giải thích import React, router, API, modal, helper.
- [ ] Giải thích component `CancelRequestModal`.
- [ ] Giải thích từng state: `regs`, `loading`, `filter`, `ratingForms`, `checkinTarget`, `cancelTarget`, `cancelSaving`.
- [ ] Giải thích `loadRegistrations` và `useEffect` tải trang.
- [ ] Giải thích `withdraw`.
- [ ] Giải thích `requestCancel`.
- [ ] Giải thích `submitRating`.
- [ ] Giải thích `handleCheckinDone`.
- [ ] Giải thích phần filter, loading, empty state và list registration trong JSX.
- [ ] Giải thích điều kiện hiển thị điểm danh QR/GPS.
- [ ] Giải thích modal điểm danh và modal xin hủy.
- [ ] Chạy ví dụ: đăng ký chờ duyệt, được xác nhận, điểm danh, đánh giá, xin hủy.

### 4. Ủng hộ của tôi

File: `BaseCore.WebClient/src/pages/volunteer/MyDonations.jsx`

- [ ] Giải thích `statusMeta` và `filters`.
- [ ] Giải thích `DonationStatusBadge`.
- [ ] Giải thích `getVisibleDonations`.
- [ ] Giải thích `getDonationSummary`.
- [ ] Giải thích state, `loadDonations` và `useEffect`.
- [ ] Giải thích `cancelDonation`.
- [ ] Giải thích ba thẻ thống kê, filter và bảng dữ liệu.

### 5. Hoạt động

File: `BaseCore.WebClient/src/pages/volunteer/Activity.jsx`

- [ ] Giải thích map trạng thái đăng ký và ủng hộ.
- [ ] Giải thích `buildGoogleCalendarUrl`.
- [ ] Giải thích `groupByMonth`.
- [ ] Giải thích `getVisibleDonations` và `getDonationTotal`.
- [ ] Giải thích `RegStatusPill`, `DonStatusPill`, `FilterChips`, `CancelRequestModal`.
- [ ] Giải thích component `Activity` và các state chung.
- [ ] Giải thích `RegistrationsView`.
- [ ] Giải thích `RegistrationCard`.
- [ ] Giải thích `DonationsView`.
- [ ] Giải thích `DonationCard`.
- [ ] Vẽ luồng: tải dữ liệu -> chọn tab -> lọc -> gọi API -> cập nhật state.

### 6. Các trang Volunteer còn lại

- [ ] `Profile.jsx`: tab thông tin và hành trình, chia sẻ hồ sơ.
- [ ] `Achievements.jsx`: tab huy hiệu và chứng chỉ.
- [ ] `MyCertificates.jsx`: tải chứng chỉ, copy mã, mở PDF, chia sẻ.
- [ ] `MyBadges.jsx`: danh sách huy hiệu, tính tiến độ, modal chi tiết.
- [ ] `Passport.jsx`: hồ sơ hành trình và thống kê.
- [ ] `Home.jsx`: dữ liệu dashboard, gợi ý sự kiện, hành động nhanh.
- [ ] `MyProfile.jsx`: hồ sơ cá nhân, KYC, kỹ năng và xác minh kỹ năng.

## Phần 2: Organizer

### 1. Danh sách sự kiện

File: `BaseCore.WebClient/src/pages/organizer/components/MyEventList.jsx`

- [ ] Giải thích `EventFilters`.
- [ ] Giải thích `isEventInProgress` và `hasEventEnded`.
- [ ] Giải thích props và JSX của `EventCard`.
- [ ] Giải thích `EventList`.

File: `BaseCore.WebClient/src/pages/organizer/MyEvents.jsx`

- [ ] Giải thích `getEventCounts`.
- [ ] Giải thích `getEventFilters`.
- [ ] Giải thích `getVisibleEvents`.
- [ ] Giải thích state và tải sự kiện.
- [ ] Giải thích `handleDelete`.
- [ ] Giải thích `handleResubmit`.
- [ ] Giải thích `handleEditPending`.
- [ ] Giải thích cách truyền props xuống `EventFilters` và `EventList`.

### 2. Xác minh tổ chức

File: `BaseCore.WebClient/src/pages/organizer/OrganizerVerification.jsx`

- [ ] Giải thích `EMPTY_FORM`, `STATUS`, `LABEL_STYLE`.
- [ ] Giải thích `asForm`.
- [ ] Giải thích `hasIdentityChanged`.
- [ ] Giải thích `getOrganizerStats`.
- [ ] Giải thích state hồ sơ, form, trạng thái lưu và thống kê.
- [ ] Giải thích hai API tải hồ sơ xác minh và danh sách sự kiện.
- [ ] Giải thích `handleSubmit`.
- [ ] Giải thích điều kiện yêu cầu duyệt lại.
- [ ] Giải thích upload logo, tài liệu và checkbox cam kết.

### 3. Báo cáo tác động

File: `BaseCore.WebClient/src/pages/organizer/OrganizerInsights.jsx`

- [ ] Giải thích `initialFilters`, các hàm format và map trạng thái.
- [ ] Giải thích `StatusPill`, `StatCard`, `ProgressRow`.
- [ ] Giải thích state filter, dữ liệu report, loading và lỗi.
- [ ] Giải thích `useEffect` tải báo cáo theo filter đã áp dụng.
- [ ] Giải thích `handleChange`, `resetFilters`, `exportCsv`.
- [ ] Giải thích từng thẻ số liệu, biểu đồ thanh và bảng.

### 4. Form tạo/sửa sự kiện

File: `BaseCore.WebClient/src/pages/organizer/EventForm.jsx`

- [ ] Giải thích import, dữ liệu `INIT`, `STEPS`, style thông báo.
- [ ] Giải thích `Notice`, `SectionHeading`, `FieldHint`, `CharacterCount`.
- [ ] Giải thích toàn bộ state của form.
- [ ] Giải thích cách đọc `requiredSkillIds` và tìm category/kỹ năng đã chọn.
- [ ] Giải thích `set`, `setEventStartDate`, `setQuickDuration`.
- [ ] Giải thích `validateAll`, `validateCurrentStep`, `canReachStep`.
- [ ] Giải thích tìm địa chỉ, reverse geocode và chọn vị trí GPS.
- [ ] Giải thích lưu nháp, chuyển bước và submit.
- [ ] Giải thích từng bước: cơ bản, địa điểm, thời gian, điều kiện, ảnh, xem trước.

## Phần 3: ManageEvent

### 1. Hằng số và dữ liệu tải ban đầu

File: `BaseCore.WebClient/src/pages/organizer/ManageEvent/constants.js`

- [ ] Giải thích `MANAGE_EVENT_TABS`.
- [ ] Giải thích từng form rỗng: ca, chiến dịch, đề xuất, báo cáo, đăng ký tại chỗ, phỏng vấn.
- [ ] Nêu nơi từng hằng số được dùng trong `index.jsx`.

File: `BaseCore.WebClient/src/pages/organizer/ManageEvent/data.js`

- [ ] Giải thích các API trong `loadManageEventData`.
- [ ] Giải thích `Promise.all` và lý do gọi song song.
- [ ] Giải thích dữ liệu trả về sẽ đi vào state nào.
- [ ] Giải thích vì sao campaign, proposal và history có `catch` riêng.

### 2. Trang quản lý sự kiện chính

File: `BaseCore.WebClient/src/pages/organizer/ManageEvent/index.jsx`

- [ ] Giải thích import và route `id`.
- [ ] Giải thích state chung: event, registrations, shifts, tab, loading.
- [ ] Giải thích state điểm danh QR/GPS.
- [ ] Giải thích state hoàn thành/hủy sự kiện.
- [ ] Giải thích state ca làm, chiến dịch, tài trợ, báo cáo, đăng ký tại chỗ, giờ thủ công, đổi ca, phỏng vấn.
- [ ] Giải thích gọi `loadManageEventData`.
- [ ] Giải thích các hàm reload dữ liệu.
- [ ] Giải thích từng nhóm handler theo thứ tự trong file.
- [ ] Giải thích tab nào nhận props nào.
- [ ] Giải thích các modal còn đặt trong file chính.

### 3. Các tab quản lý

- [ ] `RegistrationsTab.jsx`: lọc, duyệt, hủy, giờ thủ công, đánh giá, đăng ký tại chỗ.
- [ ] `CheckInTab.jsx`: QR, GPS, điểm danh thủ công, check-out.
- [ ] `ShiftsTab.jsx`: danh sách và tạo ca.
- [ ] `CampaignsTab.jsx`: tạo/mở/đóng chiến dịch, xác nhận/từ chối ủng hộ.
- [ ] `CorporateTab.jsx`: mời tài trợ, xác nhận tiền và báo cáo.
- [ ] `ReportTab.jsx`: số liệu sự kiện và lịch sử thay đổi.

### 4. Modal hủy sự kiện

File: `BaseCore.WebClient/src/pages/organizer/ManageEvent/modals/CancelEventModal.jsx`

- [ ] Giải thích props `isOpen`, `onClose`, `onSubmit`, `reason`, `onReasonChange`, `saving`.
- [ ] Giải thích `isReasonTooShort`.
- [ ] Giải thích textarea cập nhật state ở component cha.
- [ ] Giải thích điều kiện disable nút xác nhận.
- [ ] Vẽ luồng: mở modal -> nhập lý do -> submit -> `index.jsx` gọi API -> event chuyển `Cancelled`.

## Checklist trình bày cuối cùng

- [ ] Nêu được route của trang.
- [ ] Nêu được role sử dụng trang.
- [ ] Nêu được API trang gọi.
- [ ] Nêu được các state quan trọng.
- [ ] Nêu được điều kiện hiển thị nút/chức năng.
- [ ] Nêu được dữ liệu API trả về được lưu ở state nào.
- [ ] Nêu được thao tác người dùng dẫn tới API nào.
- [ ] Nêu được cách debug bằng Chrome Network và Console.
- [ ] Có một ví dụ lỗi: xóa helper, sai props, sai state hoặc sai điều kiện.
