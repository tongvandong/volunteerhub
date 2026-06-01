# Ke hoach chinh sua giao dien Sponsor theo phong cach Volunteer

## 1. Muc tieu

Chinh sua cac man hinh cua Sponsor de dong bo voi phong cach giao dien cua Volunteer: gon, ro, co ngu canh, de thao tac tren mobile va desktop.

Pham vi chinh:

- `BaseCore.WebClient/src/pages/sponsor/MySponsorships.jsx`
- `BaseCore.WebClient/src/pages/sponsor/SponsorProfile.jsx`
- `BaseCore.WebClient/src/components/layouts/MainLayout.jsx` neu can dong bo menu Sponsor
- Cac component UI dung chung neu can: `StatusBadge`, `EmptyState`, `Skeleton`, `Modal`, `Tabs`

## 2. Nguyen tac giao dien can bam theo Volunteer

### 2.1. Layout

- Dung container chinh co max width tuong tu cac trang Volunteer.
- Header trang gom:
  - Tieu de ro rang.
  - Mo ta ngan.
  - Hanh dong chinh neu co.
- Card trang, bo goc vua phai, shadow nhe.
- Khong long card trong card neu khong can thiet.
- Khoang cach giua cac block thong tin dong deu.

### 2.2. Trang thai va thong tin nhanh

- Badge trang thai can dong bo style voi `StatusBadge`.
- Summary cards nam dau trang, giup Sponsor nhin nhanh:
  - Tong so tien da tai tro.
  - So de nghi dang cho.
  - So tai tro da chap nhan.
  - So tai tro da ghi nhan nhan tien.
- Cac filter nen dung chip/tab giong cac man Volunteer activity/donation.

### 2.3. Loading va empty state

- Loading dung `Skeleton` thay vi man trang hoac text don gian.
- Khi khong co du lieu, dung `EmptyState`:
  - Icon/visual nhe.
  - Noi dung ngan.
  - CTA phu hop, vi du: "De nghi tai tro su kien".

### 2.4. Mobile

- Summary cards xuong 1 cot tren mobile.
- Filter chip co the scroll ngang.
- Card proposal khong tran text.
- Nut action xep doc neu khong du ngang.
- Modal khong vuot chieu cao viewport.

## 3. Chinh sua `MySponsorships.jsx`

### 3.1. Cau truc trang moi

Trang nen chia thanh cac vung:

1. Page header.
2. Summary cards.
3. Filter tabs/chips.
4. Danh sach sponsorship proposals.
5. Modal tao de nghi tai tro.
6. Modal chap nhan/tu choi/huy neu can.

### 3.2. Page header

Noi dung de xuat:

- Tieu de: `Tai tro cua toi`
- Mo ta: `Theo doi cac de nghi tai tro, phan hoi cua nha to chuc va so tien da duoc ghi nhan.`
- Nut chinh: `De nghi tai tro`

### 3.3. Summary cards

Can tinh tu danh sach proposals:

| Card | Cach tinh |
| --- | --- |
| Tong da ghi nhan | Sum `actualReceivedAmount` cua status `Received` hoac `Reported` |
| Dang cho phan hoi | Count status `Pending` |
| Da chap nhan | Count status `Accepted` |
| Da hoan tat/bao cao | Count status `Received` + `Reported` |

### 3.4. Filter tabs

Danh sach filter:

| Key | Label |
| --- | --- |
| `all` | Tat ca |
| `pending` | Cho phan hoi |
| `accepted` | Da chap nhan |
| `received` | Da ghi nhan |
| `closed` | Tu choi / da huy |

Map status:

```text
Pending -> pending
Accepted -> accepted
Received, Reported -> received
Rejected, Cancelled -> closed
```

### 3.5. Proposal card

Moi card nen hien:

- Ten su kien.
- Ten organizer.
- So tien de nghi.
- Trang thai.
- Ngay tao/gui de nghi.
- Tieu de tai tro.
- Noi dung de nghi.
- Phan hoi cua organizer/sponsor neu co.
- Thong tin nhan tai tro/chuyen khoan neu proposal da `Accepted`.
- So tien thuc nhan neu da `Received`.

Action theo status:

| Status | Action |
| --- | --- |
| `Pending` do Sponsor gui | Huy de nghi |
| `Pending` do Organizer moi | Chap nhan / Tu choi |
| `Accepted` | Xem thong tin chuyen khoan / cho ghi nhan |
| `Received` | Xem ghi nhan |
| `Reported` | Xem bao cao su dung tai tro |
| `Rejected`, `Cancelled` | Chi xem ly do |

### 3.6. Trang thai proposal

Can co status meta rieng:

| Status | Label | Mau goi y |
| --- | --- | --- |
| `Pending` | Cho phan hoi | amber |
| `Accepted` | Da chap nhan | blue |
| `Received` | Da ghi nhan | emerald |
| `Reported` | Da bao cao | indigo |
| `Rejected` | Da tu choi | rose |
| `Cancelled` | Da huy | gray |

## 4. Chinh sua form de nghi tai tro

### 4.1. Modal tao de nghi

Form nen nam trong modal dong bo voi UI Volunteer.

Fields:

- Event can tai tro.
- So tien de nghi.
- Tieu de tai tro.
- Noi dung de nghi.
- Ghi chu lien he/chuyen khoan neu can.

### 4.2. Chon event

Nen cai tien field chon event:

- Co placeholder ro: `Chon su kien muon tai tro`.
- Hien ten event, ngay dien ra, organizer.
- Neu chon event, hien preview nho ben duoi.

Preview nen gom:

- Ten event.
- Thoi gian.
- Dia diem.
- Organizer.
- Trang thai event.

### 4.3. Validation

Frontend can chan:

- Chua chon event.
- So tien rong, bang 0 hoac am.
- Tieu de qua ngan neu backend yeu cau.
- Noi dung de nghi rong.

Khong dung `alert`; hien loi inline trong modal.

## 5. Chinh sua `SponsorProfile.jsx`

### 5.1. Cau truc trang

Trang profile Sponsor nen dong bo voi profile Volunteer:

1. Header profile.
2. Card thong tin nha tai tro.
3. Form thong tin co ban.
4. Form thong tin lien he.
5. Form gioi thieu.

### 5.2. Header profile

Nen hien:

- Logo/avatar tron.
- Ten sponsor/doanh nghiep.
- Role badge: `Nha tai tro`.
- Mot thong tin phu: email hoac website.

Neu project da co component upload avatar tron, uu tien dung lai `AvatarUploadField`.

### 5.3. Form thong tin

Fields de xuat:

- Ten nha tai tro/doanh nghiep.
- Email lien he.
- So dien thoai.
- Website.
- Dia chi.
- Mo ta/gioi thieu.

Button:

- `Luu ho so`
- Loading state khi saving.

### 5.4. Mobile

- Header profile xep doc.
- Form 1 cot.
- Button luu nam cuoi form, khong bi tran.

## 6. Dong bo navigation Sponsor

Can kiem tra `MainLayout.jsx` voi role Sponsor.

Menu de xuat:

| Path | Label |
| --- | --- |
| `/dashboard` hoac trang sponsor home | Tong quan |
| `/my-sponsorships` | Tai tro cua toi |
| `/sponsor/profile` hoac path hien co | Ho so nha tai tro |
| `/notifications` | Thong bao |

Neu chua co dashboard rieng cho Sponsor, co the:

- Tam thoi dung `MySponsorships` lam trang chinh.
- Hoac tao `SponsorHome.jsx` o buoc sau.

## 7. Kiem thu giao dien

Sau khi sua can test/chup man hinh:

### 7.1. Desktop

- `MySponsorships` co du lieu.
- `MySponsorships` empty state.
- Modal de nghi tai tro.
- Modal chap nhan/tu choi.
- `SponsorProfile`.

Viewport goi y:

```text
1366 x 768
```

### 7.2. Mobile

Can test:

- Summary cards xuong dung 1 cot.
- Filter chips khong tran.
- Proposal card khong bi vo layout.
- Modal scroll duoc.
- Action buttons de bam.

Viewport goi y:

```text
390 x 844
```

## 8. Build va smoke test

Chay build frontend:

```powershell
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm run build
```

Neu build pass, chay app va test cac flow chinh:

1. Login Sponsor.
2. Mo `Tai tro cua toi`.
3. Tao de nghi tai tro.
4. Kiem tra proposal moi trong list.
5. Thu filter theo tung trang thai.
6. Mo profile sponsor.
7. Sua thong tin profile va luu.
8. Kiem tra mobile viewport.

## 9. Thu tu thuc hien de it rui ro

1. Tao/bo sung status meta cho Sponsorship.
2. Refactor `MySponsorships.jsx` theo layout moi.
3. Refactor modal tao de nghi tai tro.
4. Refactor card proposal va action.
5. Refactor `SponsorProfile.jsx`.
6. Kiem tra/dong bo menu Sponsor trong `MainLayout.jsx`.
7. Build frontend.
8. Test UI desktop.
9. Test UI mobile.
10. Chup screenshot ket qua.

## 10. Tieu chi hoan thanh

- Sponsor UI nhin dong bo voi Volunteer UI.
- Khong con alert tho trong flow chinh.
- Trang thai tai tro hien bang badge tieng Viet.
- Co summary cards va filter ro rang.
- Empty/loading state duoc xu ly dep.
- Mobile khong tran layout.
- `npm run build` thanh cong.
