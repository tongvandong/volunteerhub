# Plan Hoan Thien Kenh Trao Doi Su Kien

## Summary

Hoan thien kenh trao doi theo 2 muc tieu chinh: chi organizer so huu su kien va volunteer da duoc duyet tham gia moi truy cap duoc kenh; nguoi dung co the gui tin nhan kem hinh anh o o nhap chinh. Pham vi gui anh chi ap dung cho tin nhan chinh, khong ap dung cho binh luan.

## Key Changes

### Backend quyen truy cap

- Chuan hoa toan bo endpoint `/api/channels/*` dung chung `CanAccessChannelAsync`.
- Dieu kien truy cap duy nhat: `event.OrganizerId == currentUserId` hoac user la volunteer co `Registration.Status == "Confirmed"` cho event do.
- Khong cho admin, sponsor, organizer khac bypass vao kenh.
- `GET /api/channels` chi tra ve cac kenh user hien tai duoc phep thay.
- `members`, `posts`, `comments`, `like`, `pin`, `poll` deu phai di qua check quyen nay.

### Backend gui anh

- Dung API upload anh hien co: `POST /api/uploads/images`.
- Dung field hien co trong post: `Post.ImageUrl` va DTO `PostCreateDto.ImageUrl`.
- Cho phep tao tin nhan khi co `content` hoac `imageUrl`; khong bat buoc text neu da co anh.
- Validate `imageUrl` chi nhan URL upload noi bo dang `/api/uploads/images/...` hoac `/uploads/...`.
- Giu gioi han anh hien co: JPG, PNG, WEBP, GIF, toi da 5MB.
- Khong can migration database.

### Frontend kenh trao doi

- O nhap tin nhan co nut chon anh, preview anh truoc khi gui, nut xoa anh da chon.
- Khi gui: upload anh truoc bang `uploadApi.uploadImage(file)`, sau do goi `channelApi.createPost(channelId, { content, imageUrl })`.
- Cho phep gui chi anh, chi text, hoac text + anh.
- Hien thi anh trong post duoi noi dung text, co style giong tin nhan: bo goc, gioi han chieu cao, click mo anh tab moi.
- Disable nut gui khi dang upload/gui; hien thi loi upload ro rang.
- Khong them phan gui anh trong binh luan.

## Test Plan

### Quyen truy cap

- Organizer cua event thay kenh va gui duoc tin nhan.
- Volunteer `Confirmed` thay kenh va gui duoc tin nhan.
- Volunteer `Pending`, `Cancelled`, sponsor, organizer khac, admin khong thay kenh trong danh sach va bi `403` neu goi truc tiep endpoint.
- Volunteer vua duoc confirm reload lai thi thay kenh.

### Gui anh

- Gui text-only thanh cong.
- Gui image-only thanh cong.
- Gui text + image thanh cong.
- File qua 5MB hoac sai dinh dang bi chan bang loi ro rang.
- Sau khi gui thanh cong, anh hien thi trong post moi va van hien thi sau reload.

### Regression

- Like, comment, mo danh sach kenh, chuyen kenh van hoat dong.
- `npm run build` frontend pass.
- `dotnet build BaseCore.APIService` pass.

## Assumptions

- Chuc nang gui anh chi can cho tin nhan chinh trong kenh, khong can cho comment/reply.
- Khong lam realtime moi trong scope nay; neu he thong notifier hien co hoat dong thi post anh van di qua cung luong `PostCreatedAsync`.
- Khong xoa hoac doi schema hien tai vi `Post.ImageUrl` da du cho yeu cau.
