# Volunteer Hub - Kế hoạch cải tiến UI tạo/sửa sự kiện

Tài liệu này ghi lại kế hoạch cải tiến UI dựa trên các ảnh tham khảo trong folder `UI mẫu`. Trọng tâm là màn tạo/sửa sự kiện vì đây là nghiệp vụ trung tâm của hệ thống và cũng là nơi UI hiện có nhiều thông tin nhất.

## Mục tiêu

- Làm flow tạo/sửa sự kiện dễ hiểu hơn cho organizer.
- Giảm cảm giác form dài, rối.
- Có bước xem trước trước khi gửi duyệt.
- Hỗ trợ tốt desktop và mobile.
- Giữ nguyên nghiệp vụ/backend hiện có, ưu tiên cải tiến frontend.
- Mỗi bước cải tiến đều có screenshot kiểm tra.

## Pha 1 - Rà hiện trạng và chụp baseline

### Màn cần mở

- Màn tạo event.
- Màn sửa event.
- Màn event detail/preview.
- Màn manage event.

### Screenshot baseline cần chụp

Desktop:

- Tạo event desktop.
- Sửa event desktop.
- Manage event desktop.
- Event detail desktop.

Mobile:

- Tạo event mobile.
- Sửa event mobile.
- Manage event mobile.
- Event detail mobile.

Viewport đề xuất:

```text
Desktop: 1366x768
Desktop rộng: 1440x900
Mobile: 390x844
Mobile lớn: 430x932
```

### Checklist khi rà hiện trạng

- Form có quá dài không.
- Nút hành động có dễ thấy không.
- Field nghiệp vụ có đang bị lẫn vào nhau không.
- Text có bị tràn không.
- Map có hiển thị đúng không.
- Upload ảnh có dễ dùng không.
- KYC/min/max có đủ cảnh báo không.
- Mobile có thao tác thuận tiện không.

## Pha 2 - Chuyển form tạo/sửa event thành wizard

### Step đề xuất

```text
1. Thông tin cơ bản
2. Địa điểm
3. Thời gian & số lượng
4. Điều kiện tham gia
5. Ảnh
6. Xem trước & gửi duyệt
```

### Step 1 - Thông tin cơ bản

Nội dung:

- Tên sự kiện.
- Mô tả.
- Danh mục.
- Kỹ năng cần có.

Yêu cầu UI:

- Field rõ ràng.
- Có counter nếu giới hạn ký tự.
- Không nhồi map, ảnh, KYC vào bước này.

### Step 2 - Địa điểm

Nội dung:

- Nhập địa chỉ có autocomplete.
- Chọn gợi ý địa chỉ.
- Tick trực tiếp trên bản đồ.
- Dùng GPS nếu có.
- Ghi chú địa chỉ chi tiết nếu cần.

Yêu cầu UI:

- Khi chọn gợi ý, map cập nhật tọa độ.
- Khi tick map, địa chỉ cập nhật lại nếu reverse geocode khả dụng.
- Map có chiều cao ổn định trên desktop/mobile.

### Step 3 - Thời gian & số lượng

Nội dung:

- Ngày bắt đầu.
- Ngày kết thúc.
- Số người tối thiểu.
- Số người tối đa.

Yêu cầu UI:

- Cảnh báo nếu ngày kết thúc trước ngày bắt đầu.
- Cảnh báo nếu min > max.
- Giải thích ngắn: chưa đủ số người tối thiểu vẫn có thể bắt đầu nhưng organizer sẽ thấy cảnh báo.

### Step 4 - Điều kiện tham gia

Nội dung:

- Option yêu cầu KYC.
- Kỹ năng/yêu cầu thêm nếu cần.
- Ghi chú cho volunteer trước khi đăng ký.

Yêu cầu UI:

- Nếu bật KYC, hiển thị cảnh báo: volunteer chưa KYC sẽ không đăng ký được.
- Dùng toggle/checkbox rõ ràng.
- Không dùng text giải thích quá dài.

### Step 5 - Ảnh

Nội dung:

- Upload ảnh từ máy.
- Preview ảnh.
- Xóa/đổi ảnh.

Yêu cầu UI:

- Có hướng dẫn ngắn: nên dùng ảnh thật của hoạt động/địa điểm, tránh ảnh logo hoặc poster nhiều chữ.
- Preview không méo.
- Mobile vẫn chọn ảnh được dễ dàng.

### Step 6 - Xem trước & gửi duyệt

Nội dung:

- Hiển thị bản xem trước event như volunteer sẽ thấy.
- Tóm tắt:
  - Tên event.
  - Mô tả.
  - Địa điểm.
  - Thời gian.
  - Số lượng.
  - Yêu cầu KYC.
  - Ảnh.
  - Danh mục/kỹ năng.
- Có nút sửa nhanh từng phần nếu khả thi.

Yêu cầu UI:

- Có nút `Gửi duyệt`.
- Nếu thiếu dữ liệu bắt buộc, chỉ rõ thiếu ở step nào.
- Preview không cần giống 100% event detail nhưng phải đủ thông tin chính.

## Pha 3 - Cải tiến layout và hành động

### Stepper

- Thêm stepper trên đầu form.
- Desktop hiển thị đủ tên bước.
- Mobile có thể hiển thị dạng compact:

```text
Bước 2/6 - Địa điểm
```

### Thanh hành động cố định

Thêm sticky action bar ở cuối màn hình:

```text
Hủy | Lưu nháp | Quay lại | Tiếp tục / Gửi duyệt
```

Yêu cầu:

- Không che nội dung quan trọng.
- Mobile đủ khoảng cách để bấm.
- Nếu chưa làm backend draft thì `Lưu nháp` có thể lưu local state hoặc tạm ẩn đến khi có nghiệp vụ.

### Cảnh báo nghiệp vụ

Đưa cảnh báo vào đúng vị trí:

- Organizer chưa verified.
- Event yêu cầu KYC.
- Chưa đủ số người tối thiểu.
- Min/max không hợp lệ.
- Thiếu tọa độ/địa chỉ.
- Thiếu ảnh nếu ảnh là bắt buộc.

## Pha 4 - Screenshot kiểm tra responsive sau khi sửa

### Screenshot cần chụp sau khi cải tiến

Desktop:

- Step 1 - Thông tin cơ bản.
- Step 2 - Địa điểm có map.
- Step 3 - Thời gian & số lượng.
- Step 4 - Điều kiện tham gia.
- Step 5 - Ảnh.
- Step 6 - Preview.
- Manage event.
- Event detail.

Mobile:

- Step 1 - Thông tin cơ bản.
- Step 2 - Địa điểm có map.
- Step 3 - Thời gian & số lượng.
- Step 4 - Điều kiện tham gia.
- Step 5 - Ảnh.
- Step 6 - Preview.
- Manage event.
- Event detail.

### Checklist khi nhìn screenshot

- Không có text tràn khỏi nút/card/input.
- Không có thành phần đè lên nhau.
- Sticky action bar không che field cuối.
- Stepper không vỡ layout trên mobile.
- Map không quá thấp hoặc quá cao.
- Preview ảnh không méo.
- Form vẫn thao tác thuận tiện trên mobile.
- Các cảnh báo nổi bật nhưng không gây rối.
- Font trong panel/form không quá lớn như hero.

## Pha 5 - Test nghiệp vụ qua browser

Workflow cần test:

```text
1. Organizer verified vào tạo event.
2. Đi từng bước wizard.
3. Nhập địa chỉ, chọn gợi ý, xem map cập nhật.
4. Tick trên map, xem địa chỉ cập nhật lại.
5. Bật/tắt KYC.
6. Nhập min/max hợp lệ.
7. Nhập min/max không hợp lệ và kiểm tra cảnh báo.
8. Upload ảnh.
9. Xem preview.
10. Gửi duyệt.
11. Admin duyệt event.
12. Volunteer xem event detail.
13. Volunteer chưa KYC thử đăng ký event yêu cầu KYC và bị chặn.
14. Volunteer KYC verified đăng ký thành công.
```

## Pha 6 - Build và rà diff

### Lệnh kiểm tra

```text
npm run build
dotnet build BaseCore.sln
git diff --stat
git status --short
```

### Checklist cuối

- Không commit nhầm `dist/`.
- Không commit log hoặc screenshot tạm nếu không cần.
- Không đổi API route không cần thiết.
- Không làm hỏng luồng tạo/sửa event cũ.
- Nếu có screenshot test cần giữ, lưu vào `Context/e2e-screenshots/...`.
- Nếu screenshot chỉ là file tạm, xóa trước khi commit.

## Thứ tự triển khai đề xuất

```text
1. Chụp baseline.
2. Refactor EventForm thành wizard.
3. Thêm preview + sticky action bar.
4. Test desktop/mobile bằng screenshot.
5. Test flow thật qua browser.
6. Build + rà diff.
```

Nên làm từng pha nhỏ để sau mỗi pha còn dễ kiểm tra và rollback nếu UI bị lệch.
