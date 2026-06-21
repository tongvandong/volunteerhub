# Volunteer Hub - Bao cao audit luong nghiep vu

Ngay thuc hien: 14/05/2026  
Pham vi: audit theo `Context/VolunteerHub-business-flow-audit-plan.md`  
Trang thai: dang thuc hien

## 1. Tom tat ket qua

| Nhom | Noi dung | Trang thai | Ghi chu |
| --- | --- | --- | --- |
| A | Moi truong, gateway, worker, build baseline | Dat co ghi chu | Gateway/service/frontend chay; Release build pass; Rust build pass; Debug build bi lock do service dang chay |
| B | Identity, role, KYC, xac minh organizer | Dat | Organizer chua verified bi chan tao event; KYC volunteer duoc admin duyet moi dang ky event yeu cau KYC |
| C | Tao, duyet, sua, huy, hoan thanh event | Dat co ghi chu | Tao/duyet/validate min-max/complete chay; complete khong chan khi chua du min participant |
| D | Dang ky, duyet tham gia, diem danh QR/manual | Dat | Pending event bi chan dang ky; KYC gate dung; confirm va self check-in GPS dung; duplicate check-in bi chan |
| E | Certificate va Rust worker | Dat co ghi chu | Certificate tao va PDF download duoc; certificate moi chua co PdfUrl vi worker khong chay luc audit, endpoint co fallback PDF |
| F | Campaign ung ho ca nhan | Dat co loi timezone | Validation amount/min/pass; confirm/cancel dung; co loi campaign now-1h bi coi ngoai window |
| G | Sponsorship doanh nghiep | Dat | Offer/accept/cancel/received/report va edge case am/overspend dung |
| H | Rating, admin export, monitoring | Dat | Rating sau completed, duplicate/hide, monitoring summary, export finance deu pass |
| I | Phan quyen va truong hop dac biet | Dat co loi | Role admin/event duoc chan; donation ca nhan dang cho moi authenticated role |
| J | UI desktop/mobile va screenshot | Dat co ghi chu | Da chup desktop/mobile; event image fallback can cai thien khi anh loi |

## 2. Moi truong thuc thi

- Workspace: `D:\FW\FW\BaseCore`
- Gateway/API du kien: `http://localhost:5000`
- Frontend du kien: `http://localhost:3000`
- Database local: `(localdb)\MSSQLLocalDB`, database `VolunteerHub`
- Thu muc screenshot: `Context\e2e-screenshots\business-flow-audit`

## 3. Ket qua chi tiet

### A. Moi truong, gateway, worker, build baseline

Ket qua:

- Port backend dang lang nghe: `5000`, `5001`, `5002`, `5003`, `5004`.
- Frontend da duoc bat lai va lang nghe o `3000`.
- Gateway `http://localhost:5000/api/events`, `/api/categories`, `/api/skills` tra `200`.
- Health truc tiep tung service:
  - AuthService `http://localhost:5002/health` -> `200 Healthy`
  - EventService `http://localhost:5003/health` -> `200 Healthy`
  - FinanceService `http://localhost:5004/health` -> `200 Healthy`
- Gateway khong co `/health` hoac `/api/health` -> `404`. Neu muon monitoring qua gateway can them route rieng hoac dung `/api/monitoring/health`.
- `npm run build` frontend -> pass.
- `dotnet build BaseCore.sln -c Release --no-restore` -> pass.
- `cargo build` trong `BaseCore.CertificateWorker` -> pass.
- `dotnet build BaseCore.sln --no-restore` Debug -> fail do DLL trong `bin\Debug` dang bi cac service dang chay lock (`BaseCore.ApiGateway`, `BaseCore.AuthService`, `BaseCore.FinanceService`, `BaseCore.APIService`). Can dung Release build khi dang chay service hoac tat service truoc khi build Debug.
- `CertificateJobs`: 3 job, tat ca `Completed`, cac certificate co `PdfUrl`.
- Tai thoi diem kiem tra process, chua thay Rust worker/cargo dang chay. Cac PDF hien co la ket qua job da completed truoc do.

### B. Identity, role, KYC, organizer verification

Da test qua API voi tai khoan audit:

- Tao organizer moi `audit_org_20260514082459@example.test`.
- Organizer moi chua verified goi `POST /api/events` -> `400`, dung nghiep vu "phai xac minh to chuc truoc khi tao event".
- Organizer submit `POST /api/organizer/verification` -> `200`.
- Admin approve `PUT /api/admin/organizer-verifications/{id}/approve` -> `200`.
- Tao volunteer moi `audit_vol_20260514082459@example.test`.
- Volunteer chua KYC dang ky event `requiresKyc=true` -> `400`.
- Volunteer submit `POST /api/profile/kyc`, admin approve `PUT /api/admin/volunteer-kyc/{profileId}/approve` -> `200`.
- Volunteer da KYC dang ky event yeu cau KYC -> `200`.

Ket luan: role gate va KYC gate dung yeu cau o muc backend.

### C. Event lifecycle

Da test:

- Tao event voi organizer da verified -> `201`, status ban dau `Pending`.
- Admin approve event -> `200`, status `Approved`.
- Tao event `minParticipants > maxParticipants` -> `400`, dung validation.
- Volunteer dang ky event con `Pending` -> `400`, dung.
- Organizer complete event -> `200`.

Du lieu audit trong DB:

- Event `4010` - `AUDIT KYC Event 20260514082459`: `Completed`, `MinParticipants=2`, `CurrentParticipants=1`, `RequiresKyc=1`.
- Event `4011` - `AUDIT Finance Event 20260514082810`: `Approved`, `MinParticipants=1`, `CurrentParticipants=0`, `RequiresKyc=0`.

Ghi chu: backend cho phep complete event khi `CurrentParticipants < MinParticipants`. Neu nghiep vu chi yeu cau canh bao UI thi chap nhan; neu can chan that thi can bo sung rule backend.

### D. Participation va attendance

Da test:

- Volunteer KYC verified register event -> `200`, tao registration `Pending`.
- Organizer confirm registration -> `200`.
- Volunteer self check-in bang GPS tai toa do event -> `200`, `IsAttended=true`.
- Duplicate self check-in -> `400 Already checked in`.

Ket luan: luong dang ky, organizer duyet va volunteer tu check-in bang GPS chay dung. Manual/QR UI can tiep tuc xac minh bang browser trong muc UI.

### E. Certificate va Rust worker

Da test:

- Sau khi complete event co volunteer attended, he thong tao certificate moi `CERT-2026-B55EE6AE`.
- `GET /api/certificates` bang volunteer token -> `200`.
- `GET /api/certificates/CERT-2026-B55EE6AE/pdf` -> `200 application/pdf`.

DB doi chieu:

- Certificate moi `Id=3002`, `EventId=4010`, `UserId=3009`, `CertificateCode=CERT-2026-B55EE6AE`, `PdfUrl` rong.
- CertificateJobs hien chi co 3 job cu `Completed`; tai thoi diem audit khong thay Rust worker dang chay.

Ket luan: PDF tai duoc nho endpoint co fallback tao PDF truc tiep. Luong Rust worker async chua duoc xac nhan cho certificate moi trong phien nay vi worker khong chay thuong truc luc audit.

### F. Donation campaign

Da test:

- Organizer tao campaign `Open` cho event approved -> `200`.
- Campaign co `StartDate = now - 1h`, `EndDate = now + 5d` bi API coi la ngoai donation window khi donate -> `400 Campaign is outside its donation window`.
- Tao campaign khung rong hon (`now - 2d` den `now + 2d`) -> donate hoat dong.
- Donation am -> `400 Donation amount must be greater than zero`.
- Donation duoi minimum -> `400 Donation amount must be at least the campaign minimum amount`.
- Donation hop le `60000` -> `200 PendingConfirmation`.
- Organizer confirm donation -> `200 Confirmed`.
- Volunteer cancel donation da confirmed -> `400 Only pending donations can be cancelled`.

DB doi chieu:

- Donation `5004`, campaign `5006`, amount `60000`, status `Confirmed`.

Ket luan: luong donation chinh dung, nhung co kha nang loi timezone trong validation thoi gian campaign.

### G. Sponsorship doanh nghiep

Da test:

- Sponsor offer amount am -> `400 Offered amount must be greater than zero`.
- Sponsor gui offer hop le -> `200 Pending`.
- Organizer accept offer -> `200 Accepted`.
- Sponsor cancel offer da accepted -> `400 Only pending proposals can be cancelled`.
- Organizer mark received voi amount am -> `400 Actual received amount cannot be negative`.
- Organizer mark received amount `180000` -> `200 Received`.
- Report usedAmount lon hon received -> `400 Used amount cannot exceed received sponsorship amount`.
- Report hop le `usedAmount=150000` -> `200 Reported`.

DB doi chieu:

- Sponsorship proposal `5005`, event `4011`, sponsor `3`, offered `200000`, actual received `180000`, status `Reported`, used `150000`.

Ket luan: luong sponsorship doanh nghiep dung nghiep vu da dac ta.

### H. Admin, export, monitoring, rating

Da test:

- Volunteer attended rate organizer sau event completed -> `200`.
- Duplicate rating cung event/ratee -> `400 Already rated this user for this event`.
- Admin hide rating -> `200`.
- `GET /api/admin/monitoring/summary` -> `200`.
- `GET /api/admin/export/finance` -> `200`.

Ket luan: rating sau event va cac API admin chinh chay duoc.

### I. Phan quyen va edge cases

Da test:

- Volunteer goi `POST /api/events` -> `403`, dung vi chi organizer tao event.
- Volunteer goi `GET /api/admin/export/finance` -> `403`, dung vi chi admin.
- Sponsor goi donation ca nhan vao campaign -> `200`, tao donation `5005`.
- Organizer goi donation ca nhan vao campaign -> `200`, tao donation `5006`.
- Admin goi donation ca nhan vao campaign -> `200`, tao donation `5007`.

Ket luan: phan quyen admin/event dung. Rieng donation ca nhan hien cho moi authenticated role, khong chi volunteer. Neu theo spec "volunteer ung ho ca nhan, sponsor tai tro doanh nghiep" thi can siết `POST /api/support-campaigns/{campaignId}/donations` ve role `Volunteer`.

### J. UI desktop/mobile

Da dung browser/UI de chup smoke:

- Desktop:
  - `Context/e2e-screenshots/business-flow-audit/desktop-event-detail-4011.png`
  - `Context/e2e-screenshots/business-flow-audit/desktop-manage-event-4011.png`
  - `Context/e2e-screenshots/business-flow-audit/desktop-my-donations.png`
  - `Context/e2e-screenshots/business-flow-audit/desktop-my-certificates.png`
  - `Context/e2e-screenshots/business-flow-audit/desktop-my-sponsorships.png`
  - `Context/e2e-screenshots/business-flow-audit/desktop-admin-export.png`
  - `Context/e2e-screenshots/business-flow-audit/desktop-admin-monitoring.png`
- Mobile viewport `390x844`:
  - `Context/e2e-screenshots/business-flow-audit/mobile-event-detail-4011.png`
  - `Context/e2e-screenshots/business-flow-audit/mobile-manage-event-4011.png`
  - `Context/e2e-screenshots/business-flow-audit/mobile-my-donations.png`
  - `Context/e2e-screenshots/business-flow-audit/mobile-my-sponsorships.png`
  - `Context/e2e-screenshots/business-flow-audit/mobile-admin-export.png`

Nhan xet UI:

- Mobile `event detail` hien du lieu tai chinh dung: ung ho ca nhan `60.000d`, tai tro doanh nghiep da nhan `180.000d`, tong `240.000d`.
- Mobile `manage event` co canh bao "Chua du so tinh nguyen vien toi thieu" va van cho thao tac hoan thanh/huy, dung voi huong "canh bao nhung khong chan".
- Mobile `my donations`, `my sponsorships`, `admin export` khong bi vo layout nghiem trong.
- Anh event audit dung dummy URL `/uploads/images/audit.png` nen UI hien broken image/khung trong rat lon tren event detail. Can them fallback image khi image load fail, hoac validate/upload image that khi tao event demo.

## 4. Danh sach loi/phat hien can sua

- [A-01] Gateway chua expose `/health`; plan dang de health o service truc tiep. Khuyen nghi them health route qua gateway hoac sua runbook demo de dung dung port service.
- [A-02] Build Debug fail neu service dang chay do lock DLL. Khuyen nghi them huong dan build Release hoac tat service truoc khi build Debug.
- [A-03] Rust Certificate Worker khong chay thuong truc tai thoi diem audit. Neu muon PDF async on-demand on dinh, can chay worker cung voi cac service hoac them worker vao runbook/start script.
- [C-01] Backend cho phep complete event khi `CurrentParticipants < MinParticipants`. Neu min participant la dieu kien van hanh bat buoc, can chan hoac yeu cau override co reason; neu chi la canh bao demo thi can ghi ro trong spec/UI.
- [E-01] Certificate moi tai duoc PDF nhung `Certificates.PdfUrl` van rong, chung to worker async chua xu ly job trong phien audit. Can dam bao worker chay cung runbook hoac them hang doi/job status ro tren UI.
- [F-01] Campaign voi `StartDate = now - 1h` van bi coi la ngoai donation window. Can thong nhat UTC/local time khi tao campaign va so sanh `DateTime.UtcNow`.
- [I-01] Donation ca nhan dang cho phep Sponsor/Organizer/Admin tao donation. Neu nghiep vu chot la chi Volunteer ung ho ca nhan, can doi authorize role va UI route tuong ung.
- [J-01] Event detail khong co fallback dep khi anh event loi/mat file, dan den mobile co khung anh trong lon va icon anh bi vo. Can them `onError` fallback hoac default image.

## 5. Ket luan

He thong hien da chay dung phan lon nghiep vu cot loi:

- Organizer phai duoc admin xac minh moi tao event.
- Admin duyet event, volunteer dang ky theo dieu kien KYC, organizer confirm, volunteer check-in.
- Event completed sinh certificate va tai PDF duoc.
- Donation campaign, sponsorship doanh nghiep, rating, admin monitoring/export deu co luong chay duoc.

Can sua truoc khi coi la "khoa nghiep vu":

1. Chay Rust Certificate Worker thuong truc va dam bao certificate moi co `PdfUrl` sau khi worker xu ly.
2. Chot rule donation ca nhan co chi danh cho Volunteer hay khong; neu co thi siết backend.
3. Sua timezone campaign donation window.
4. Them fallback anh event khi anh loi.
5. Quyet dinh min participant chi la canh bao hay rule chan backend.

## 6. Trang thai sua loi sau audit

- Da them health endpoint rieng cho API Gateway: `/health` va `/api/health`.
- Da gioi han API tao/huy donation ca nhan cho role `Volunteer`.
- Da chuan hoa thoi gian campaign khi tao/sua va so sanh theo UTC de tranh campaign moi tao bi coi la het han do lech mui gio.
- Da chan backend khi hoan thanh event neu so volunteer da xac nhan nho hon `MinParticipants`; UI quan ly event cung disable nut hoan thanh khi chua du.
- Da them fallback anh cho trang chi tiet event neu `imageUrl` hong.
- Da luu PDF fallback vao `wwwroot/certificates` va cap nhat `Certificates.PdfUrl` khi endpoint download PDF tu tao file.
- Da them script `scripts/start-volunteerhub-dev.ps1` de chay cung luc Auth, Event, Finance, Gateway, Rust CertificateWorker va WebClient.
