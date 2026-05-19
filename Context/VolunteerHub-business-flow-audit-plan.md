# Ke hoach ra soat nghiep vu end-to-end - VolunteerHub

Tai lieu nay dung de ra soat lai toan bo project sau khi da tach service, them Rust Certificate Worker, va hoan thien cac luong event/donation/sponsorship. Muc tieu khong phai la test man hinh rieng le, ma la doi chieu xem he thong co chay dung nghiep vu da mo ta trong cac file spec hay khong.

## 1. Muc tieu

- Xac nhan cac luong chinh cua VolunteerHub chay dung voi mo ta nghiep vu.
- Xac nhan ket qua hien thi tren UI khop voi trang thai trong database.
- Xac nhan cac role chi duoc thao tac dung quyen.
- Xac nhan kien truc moi chay dung qua ApiGateway va cac service rieng.
- Xac nhan Rust Certificate Worker tao PDF that va cap nhat `Certificates.PdfUrl`.
- Ghi ro phan nao da dung, phan nao con thieu, phan nao sai nghiep vu can sua.

## 2. Tai lieu lam chuan

Doc va doi chieu theo cac file sau truoc khi test:

- `Context/project-reading-guide.md`
- `Context/VolunteerHub-requirements-spec.md`
- `Context/VolunteerHub-demo-workflow.md`
- `Context/VolunteerHub-event-registration-participation-flow-spec.md`
- `Context/VolunteerHub-sponsorship-donation-spec.md`
- `Context/VolunteerHub-sponsorship-donation-flow-spec.md`
- `Context/VolunteerHub-real-world-scenarios.md`
- `Context/VolunteerHub-team-service-split.md`
- `Context/VolunteerHub-team-integration-guide.md`
- `BaseCore.APIService/Controllers/Identity/README-nghiep-vu.md`
- `BaseCore.APIService/Controllers/Events/README-nghiep-vu.md`
- `BaseCore.APIService/Controllers/Finance/README-nghiep-vu.md`
- `docs/1-mo-ta-de-tai.md`
- `docs/2-yeu-cau-chuc-nang.md`
- `docs/3-thiet-ke-he-thong.md`
- `docs/4-huong-dan-cai-dat.md`
- `docs/5-phan-cong-nhom.md`

Ket qua can co: mot bang tom tat "yeu cau nghiep vu" gom role, hanh dong, dieu kien, ket qua mong doi.

## 3. Moi truong va service can chay

### 3.1. Connection string

Tat ca service backend can dung chung database:

```json
"Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=VolunteerHub;Integrated Security=True;Encrypt=True;Trust Server Certificate=True"
```

Kiem tra trong:

- `BaseCore.APIService/appsettings.json`
- `BaseCore.AuthService/appsettings.json`
- `BaseCore.EventService/appsettings.json`
- `BaseCore.FinanceService/appsettings.json`

### 3.2. Cac process can chay

Chay cac service:

```powershell
dotnet run --project BaseCore.AuthService --urls http://localhost:5002
dotnet run --project BaseCore.EventService --urls http://localhost:5003
dotnet run --project BaseCore.FinanceService --urls http://localhost:5004
dotnet run --project BaseCore.ApiGateway --urls http://localhost:5000
dotnet run --project BaseCore.APIService --urls http://localhost:5001
```

Chay frontend:

```powershell
cd BaseCore.WebClient
npm run dev -- --host 127.0.0.1
```

Chay Rust Certificate Worker:

```powershell
cd BaseCore.CertificateWorker
cargo run
```

### 3.3. Health check

Kiem tra:

- `GET http://localhost:5002/health` -> `200 Healthy`
- `GET http://localhost:5003/health` -> `200 Healthy`
- `GET http://localhost:5004/health` -> `200 Healthy`
- `GET http://localhost:5000/api/event-categories` -> `200`
- `GET http://localhost:3000/api/events?page=1&pageSize=3` -> `200`

Pass khi frontend load duoc danh sach event qua proxy `/api`.

## 4. Cach ghi ket qua

Tao file bao cao sau khi test:

`Context/VolunteerHub-business-flow-audit-report.md`

Moi testcase ghi theo mau:

```md
## TC-<ma> - <ten testcase>

- Role:
- Man hinh:
- Endpoint lien quan:
- Du lieu test:
- Buoc thuc hien:
- Ket qua mong doi:
- Ket qua thuc te:
- DB doi chieu:
- Screenshot:
- Trang thai: Pass / Fail / Partial
- Ghi chu can sua:
```

Screenshot luu vao:

`Context/e2e-screenshots/business-flow-audit/`

Dat ten:

`TC01-organizer-verification-pending.png`

## 5. Ranh gioi danh gia

Trang thai:

- `Pass`: UI, API, DB, notification/audit neu co deu dung.
- `Partial`: nghiep vu chinh dung nhung thieu UI, thieu thong bao, thieu report, hoac can thao tac tay.
- `Fail`: sai role, sai status, loi 4xx/5xx khong hop ly, UI khong load, DB khong cap nhat dung.

Muc uu tien sua:

- `P0`: chan demo hoac lam sai nghiep vu chinh.
- `P1`: demo duoc nhung thieu hanh dong quan trong.
- `P2`: bat tien, text/UI chua dep, can cai tien.
- `P3`: nice-to-have.

## 6. Ma tran role va pham vi

| Role | Pham vi can dung |
| --- | --- |
| Guest | Xem landing, danh sach event approved, chi tiet event, verify certificate |
| Volunteer | Profile, skill, KYC tuy chon, dang ky event, xin huy, check-in, certificate, rating, donation |
| Organizer | Xac minh phap ly, tao/sua event, quan ly dang ky, diem danh, campaign, sponsor proposal, report |
| Sponsor | Xem event approved, gui de nghi tai tro, xem sponsorship cua minh, huy khi pending, xem report |
| Admin | Duyet organizer/event/KYC/skill/rating, monitoring, audit log, export |

## 7. Nhom test A - Kien truc va routing

### TC-A01 - Frontend goi API qua gateway

- Mo `http://localhost:3000/events`.
- Kiem tra network/proxy `/api/events` tra data.
- Kiem tra UI khong dung endpoint truc tiep `5002/5003/5004`.
- DB khong can doi chieu.
- Pass khi UI hien danh sach event va khong co loi console 500/502.

### TC-A02 - Gateway route dung service

Kiem tra:

- `/api/auth/login` -> AuthService `5002`
- `/api/events` -> EventService `5003`
- `/api/event-categories` -> EventService `5003`
- `/api/certificates` -> EventService `5003`
- `/api/support-campaigns/...` -> FinanceService `5004`
- `/api/sponsorship-proposals/...` -> FinanceService `5004`
- `/api/admin/finance/overview` -> FinanceService `5004`
- `/api/admin/export/events` -> APIService `5001`
- fallback `/api/{everything}` -> APIService `5001`

Pass khi route khong tra 404/502 sai.

### TC-A03 - Tat mot service va xem loi co de hieu khong

- Tat EventService.
- Mo `/events`.
- Mong doi: UI bao loi tai du lieu hoac proxy/gateway tra loi de debug.
- Khoi dong lai EventService.
- Pass neu he thong phuc hoi sau reload.

## 8. Nhom test B - Identity, profile, KYC, verification

### TC-B01 - Login cac role seed

Dang nhap lan luot:

- `admin / admin123`
- `organizer / organizer123`
- `volunteer / volunteer123`
- `sponsor / sponsor123`

Pass khi moi role vao dung dashboard/menu cua minh.

### TC-B02 - Organizer verification truoc khi tao event

- Tao hoac dung organizer chua verified.
- Thu tao event.
- Mong doi: bi chan, hien thong bao can xac minh to chuc.
- Gui thong tin xac minh.
- Admin vao duyet.
- Organizer tao event lai.
- Pass khi chi organizer verified moi tao event duoc.

### TC-B03 - Organizer sua thong tin da verified

- Organizer da verified vao sua thong tin xac minh.
- UI can canh bao sua se cho duyet lai.
- Sau khi submit, status ve `Pending`.
- Organizer bi chan tao event trong luc cho duyet.
- Admin duyet lai.
- Pass khi dung trang thai va dung quyen.

### TC-B04 - Volunteer KYC tuy chon

- Volunteer chua KYC van dang ky duoc event khong yeu cau KYC.
- Volunteer chua KYC bi chan event co `RequiresKyc = true`.
- Volunteer gui KYC.
- Admin duyet KYC.
- Volunteer dang ky lai event yeu cau KYC.
- Pass khi KYC la tuy chon cap tai khoan, nhung event co the bat buoc.

### TC-B05 - Skill volunteer va xac thuc skill

- Volunteer them skill/language.
- Kiem tra skill moi them co trang thai nao: tu khai, pending, verified.
- Admin duyet skill verification neu flow co UI/API.
- Event yeu cau skill: volunteer co/khong co skill hien thi ra sao.
- Pass khi he thong khong nham skill tu khai thanh skill da xac thuc neu spec yeu cau phan biet.

## 9. Nhom test C - Event creation, moderation, participation

### TC-C01 - Organizer tao event day du

- Dang nhap organizer verified.
- Vao `/events/create`.
- Nhap thong tin co ban, dia diem autocomplete/map, thoi gian, min/max, skill, KYC option, anh.
- Buoc preview phai hien truoc khi submit.
- Submit.
- Event ve trang thai `Pending`.
- DB: `Events.Status = Pending`, `OrganizerId` dung, `RequiresKyc`, `MinParticipants`, `MaxParticipants` dung.

### TC-C02 - Validation wizard tao event

Test:

- Khong nhap title ma bam buoc 2.
- Nhap xong buoc 1, sang buoc 2, quay lai xoa title, thu sang buoc 2.
- Min > max.
- Toa do thieu/ngoai range.
- Thoi gian ket thuc truoc bat dau.
- Anh thieu neu form yeu cau.

Pass khi khong co tick xanh gia va khong cho submit sai.

### TC-C03 - Admin duyet event

- Admin vao `/admin/events`.
- Duyet event pending.
- DB: `Events.Status = Approved`.
- Guest/volunteer thay event tren `/events`.
- Pass khi event chi public sau khi approved.

### TC-C04 - Admin tu choi va organizer gui duyet lai

- Admin reject event.
- Organizer thay event `Rejected`.
- Organizer bam `Gui duyet lai`.
- Event ve `Pending`.
- Admin duyet.
- Pass khi khong can tao event moi.

### TC-C05 - Organizer cancel event

- Tao event approved co volunteer da confirmed.
- Organizer cancel voi ly do.
- DB: `Events.Status = Cancelled`.
- Registration lien quan co trang thai/notification phu hop theo spec.
- Volunteer khong dang ky/check-in tiep duoc.

### TC-C06 - Volunteer dang ky event

- Volunteer mo event approved.
- Dang ky.
- DB: `Registrations.Status = Pending`.
- Organizer thay registration pending.
- Pass khi khong tang sai `CurrentParticipants` neu chua confirmed, hoac tang dung theo spec.

### TC-C07 - Organizer confirm/reject volunteer

- Organizer confirm registration.
- DB: `Registrations.Status = Confirmed`.
- Volunteer thay trang thai da xac nhan.
- Neu reject/cancel, DB va UI phai dong bo.

### TC-C08 - Volunteer xin huy sau confirm

- Volunteer da confirmed bam xin huy, nhap ly do.
- DB: `CancelRequested = true`, co ly do.
- Organizer thay canh bao.
- Organizer chap nhan huy.
- DB: `Status = Cancelled`, `CancelRequested = false` hoac trang thai ket thuc ro rang.
- Pass khi volunteer khong tu huy truc tiep sau confirm neu spec yeu cau organizer duyet.

### TC-C09 - Check-in QR/manual/walk-in

Test 3 cach:

- Organizer hien QR, volunteer quet/self check-in.
- Organizer chon volunteer va diem danh manual.
- Organizer walk-in volunteer tai cho.

DB can dung:

- `IsAttended = true`
- `VolunteerHours` dung
- `CheckedInAt` neu co
- Registration walk-in co `Status = Confirmed`

### TC-C10 - Min participants khi bat dau/hoan thanh

- Event co min participants > confirmed count.
- Organizer vao manage event.
- UI can hien canh bao chua du so nguoi toi thieu.
- Van cho tiep tuc neu spec dang chon "canh bao nhung khong chan".
- Pass khi canh bao ro, khong am tham bo qua.

### TC-C11 - Complete va uncomplete event

- Organizer complete event co attended volunteer.
- DB: `Events.Status = Completed`.
- Certificate duoc tao cho volunteer attended.
- Admin uncomplete.
- DB: event ve `Approved`, certificate cua event bi xoa neu spec yeu cau.
- Pass khi trang thai va certificate khop.

## 10. Nhom test D - Certificate va Rust worker

### TC-D01 - Cap certificate khi complete event

- Co event completed va volunteer attended.
- Kiem tra `Certificates` co record moi.
- Kiem tra `CertificateJobs` co job `Pending` truoc khi worker xu ly.
- Pass khi chi volunteer attended moi co certificate.

### TC-D02 - Rust worker xu ly PDF

- Chay `cargo run` trong `BaseCore.CertificateWorker`.
- Tao certificate job moi.
- Kiem tra job chuyen:
  - `Pending` -> `Processing` -> `Completed`
- Kiem tra `Certificates.PdfUrl` duoc cap nhat.
- Kiem tra file PDF ton tai trong output dir.
- Pass khi PDF duoc tao bang worker Rust.

### TC-D03 - Worker khong chay

- Tat worker.
- Tao certificate moi.
- UI khong duoc vo trang.
- Neu dung fallback on-demand, nut `Tai PDF` van tai duoc.
- Neu theo async thuần, UI phai hien `Dang tao PDF` va monitoring phai co pending job.
- Pass khi hanh vi ro rang, khong gay hieu nham.

### TC-D04 - Verify certificate

- Mo `/verify/{certificateCode}`.
- Kiem tra thong tin volunteer, event, gio, ngay cap.
- Thu ma sai.
- Pass khi ma dung verify duoc, ma sai bao khong tim thay.

### TC-D05 - Download PDF

- Bam `Tai PDF`.
- Kiem tra response `200 application/pdf`.
- Kiem tra file mo duoc va co QR verify.
- Pass khi PDF that, khong phai JSON `202`.

## 11. Nhom test E - Donation campaign ca nhan

### TC-E01 - Organizer tao campaign ung ho ca nhan

- Event approved.
- Organizer vao manage event, tao campaign.
- Nhap title, mo ta, target amount, minimum amount, thoi gian, thong tin nhan tien.
- DB: `SupportCampaigns.Status = Open/Draft` dung.
- Pass khi campaign hien tren event detail.

### TC-E02 - Volunteer ung ho hop le

- Volunteer vao event co campaign open.
- Ung ho so tien >= minimum.
- Upload/nhap minh chung neu UI co.
- DB: `IndividualDonations.Status = PendingConfirmation`.
- Organizer xac nhan.
- DB: `Status = Confirmed`.
- So tien tong campaign cap nhat dung.

### TC-E03 - Validation donation

Test:

- So tien am.
- So tien bang 0.
- So tien nho hon minimum.
- Campaign het han.
- Campaign chua open/cancelled.
- User khong login.

Pass khi tra loi dung 400/401/403 va UI bao loi de hieu.

### TC-E04 - Volunteer huy donation pending

- Donation pending.
- Volunteer huy.
- DB: `Status = Cancelled`.
- Organizer khong confirm duoc donation da huy.

### TC-E05 - Organizer reject donation

- Donation pending.
- Organizer reject voi ly do.
- Volunteer thay ly do bi tu choi.
- DB: `RejectedReason` dung.

### TC-E06 - Campaign report

- Campaign co donation confirmed.
- Organizer tao report voi used amount.
- Used amount khong duoc vuot received/confirmed amount.
- Event impact va admin finance hien dung.

## 12. Nhom test F - Sponsorship doanh nghiep

### TC-F01 - Sponsor gui offer

- Sponsor dang nhap.
- Chon event approved.
- Gui sponsor offer voi amount, purpose, public name/message.
- DB: `SponsorshipProposals.Type = SponsorOffer`, `Status = Pending`.
- Organizer thay proposal.

### TC-F02 - Organizer accept/reject sponsor offer

- Organizer accept.
- DB: `Status = Accepted`.
- Sponsor khong huy duoc sau accepted neu spec yeu cau.
- Organizer mark received.
- DB: `Status = Received`, `ActualReceivedAmount` dung.

### TC-F03 - Organizer moi sponsor

- Organizer chon sponsor account.
- Gui organizer request.
- Sponsor thay request.
- Sponsor accept/reject.
- DB: `Type = OrganizerRequest`, status dung.

### TC-F04 - Sponsorship received actual amount

- Pledged amount = 100000.
- Actual received amount = 80000.
- Impact/report dung so 80000, khong dung pledged amount.
- Pass khi dashboard/export dung actual.

### TC-F05 - Sponsorship report

- Proposal received.
- Organizer report used amount, summary, expense detail.
- Used amount <= actual received.
- Sponsor xem report.
- Admin finance export co dong report.

### TC-F06 - Edge cases sponsorship

Test:

- Sponsor offer amount am/0.
- Sponsor offer event cancelled/rejected/completed.
- Sponsor huy pending.
- Sponsor huy after accepted/received.
- Organizer mark received khi proposal chua accepted.
- Organizer report khi proposal chua received.

Pass khi role va status transition bi chan dung.

## 13. Nhom test G - Rating va moderation

### TC-G01 - Volunteer rating organizer

- Event completed.
- Volunteer attended.
- Volunteer rating organizer.
- DB: `Ratings` co record.
- Public rating cua organizer co hien.

### TC-G02 - Organizer rating volunteer

- Organizer rating volunteer attended.
- Volunteer khong attended khong duoc rating.
- Pass khi chi dung doi tuong moi duoc rating.

### TC-G03 - Admin hide/unhide/delete rating

- Admin vao `/admin/ratings`.
- Hide rating voi ly do.
- Public user ratings khong hien rating hidden.
- Unhide rating hien lai.
- Delete rating bien mat.

### TC-G04 - Rating validation

Test:

- Score < 1 hoac > 5.
- Rate chinh minh.
- Rate trung lap cung event.
- Rate khi event chua completed.
- User khong tham gia/khong attended.

Pass khi backend chan dung.

## 14. Nhom test H - Admin, monitoring, export

### TC-H01 - Admin dashboard va monitoring

- Admin vao dashboard.
- Vao `/admin/monitoring`.
- Kiem tra health, count jobs pending/failed, audit log.
- Pass khi khong 500, so lieu hop ly.

### TC-H02 - Audit log

Thuc hien cac action nhay cam:

- Login.
- Create event.
- Approve/reject event.
- Confirm registration.
- Confirm donation.
- Accept sponsorship.
- Hide rating.

Kiem tra `AuditLogs` co record voi action/entity/user dung.

### TC-H03 - Export users/events/finance

- Admin vao `/admin/export`.
- Export users.
- Export events.
- Export finance.
- Kiem tra file CSV tai duoc, header dung, du lieu khop DB.

### TC-H04 - Admin categories/skills

- Tao/sua/xoa category.
- Tao/sua/xoa skill.
- Kiem tra event form lay category/skill moi.
- Xoa category/skill dang duoc tham chieu phai bi chan hoac xu ly ro rang.

## 15. Nhom test I - Phan quyen va bao mat

### TC-I01 - Guest truy cap endpoint can auth

Test cac endpoint:

- `/api/events/my`
- `/api/my-registrations`
- `/api/donations/my`
- `/api/sponsorship-proposals/my`
- `/api/admin/users`

Mong doi: `401`.

### TC-I02 - Sai role truy cap endpoint

Test:

- Volunteer goi admin approve event -> `403`.
- Sponsor goi organizer manage registration -> `403`.
- Organizer goi admin export users -> `403`.
- Volunteer goi finance report campaign cua organizer -> `403`.

Pass khi khong co leo quyen.

### TC-I03 - Data ownership

Test:

- Organizer A truy cap event cua Organizer B.
- Sponsor A xem proposal cua Sponsor B.
- Volunteer A huy registration cua Volunteer B.

Pass khi `403/404` hop ly.

### TC-I04 - Upload va file

- Upload anh event.
- Upload KYC.
- Upload proof donation neu co.
- Kiem tra file type/size/path.
- Truy cap file public/private co dung khong.

## 16. Nhom test J - UI desktop/mobile

### TC-J01 - Desktop smoke

Viewport desktop, chup:

- `/`
- `/events`
- `/events/{id}`
- `/events/create`
- `/events/{id}/manage`
- `/my-registrations`
- `/my-certificates`
- `/my-donations`
- `/my-sponsorships`
- `/admin/events`
- `/admin/ratings`
- `/admin/export`
- `/admin/monitoring`

Pass khi khong vo layout, khong text tran, khong loading ket.

### TC-J02 - Mobile smoke

Viewport mobile, chup cung cac man tren.

Can chu y:

- Sidebar/menu mobile.
- Wizard tao event.
- Bang registration trong manage event.
- Modal accept/reject/cancel/report.
- Card certificate/donation/sponsorship.
- Nut hanh dong khong bi che.

### TC-J03 - Mojibake/text tieng Viet

Rà cac man chinh:

- MyCertificates hien dang con/khong con mojibake.
- EventDetail.
- ManageEvent.
- MyRegistrations.
- MyDonations.
- MySponsorships.
- AdminEvents.
- AdminExport.
- AdminRatings.

Pass khi text demo chinh hien tieng Viet co dau dung.

## 17. Doi chieu database

Sau cac flow, doi chieu cac bang:

- `Users`
- `OrganizerVerifications`
- `VolunteerProfiles`
- `VolunteerSkillVerifications`
- `Events`
- `Registrations`
- `Certificates`
- `CertificateJobs`
- `SupportCampaigns`
- `IndividualDonations`
- `SponsorshipProposals`
- `Ratings`
- `Notifications`
- `AuditLogs`

Lenh mau:

```powershell
sqlcmd -S "(localdb)\MSSQLLocalDB" -d VolunteerHub -E -Q "SELECT TOP 20 * FROM Events ORDER BY Id DESC"
```

Khi UI noi thanh cong nhung DB sai thi danh `Fail`, vi nghiep vu chua dung.

## 18. Build va kiem tra artifact

Truoc khi ket luan:

```powershell
dotnet build BaseCore.sln --no-incremental -m:1 /p:UseSharedCompilation=false
cd BaseCore.WebClient
npm run build
cd ..\BaseCore.CertificateWorker
cargo build
cargo run -- --self-test
```

Kiem tra git:

```powershell
git status --short
git diff --stat
```

Khong duoc commit file tam/log/build artifact.

## 19. Thu tu thuc hien khuyen nghi

1. Chay service va health check.
2. Test Guest/Public.
3. Test Organizer verification.
4. Test Organizer tao event.
5. Test Admin duyet event.
6. Test Volunteer dang ky/check-in/certificate.
7. Test Rust worker PDF.
8. Test Donation.
9. Test Sponsorship.
10. Test Rating moderation.
11. Test Admin monitoring/export.
12. Test role/ownership edge cases.
13. Test UI desktop/mobile.
14. Build full.
15. Viet report ket luan.

## 20. Mau ket luan cuoi bao cao

Bao cao cuoi nen co bang:

| Module | Ket qua | Van de con lai | Uu tien |
| --- | --- | --- | --- |
| Identity/KYC | Pass/Partial/Fail | ... | P0-P3 |
| Event lifecycle | Pass/Partial/Fail | ... | P0-P3 |
| Registration/check-in | Pass/Partial/Fail | ... | P0-P3 |
| Certificate/Rust worker | Pass/Partial/Fail | ... | P0-P3 |
| Donation | Pass/Partial/Fail | ... | P0-P3 |
| Sponsorship | Pass/Partial/Fail | ... | P0-P3 |
| Rating moderation | Pass/Partial/Fail | ... | P0-P3 |
| Admin monitoring/export | Pass/Partial/Fail | ... | P0-P3 |
| UI desktop/mobile | Pass/Partial/Fail | ... | P0-P3 |

Ket luan chung can tra loi 3 cau:

1. He thong da dung nghiep vu mo ta chua?
2. Co luong nao cho ket qua sai hoac gay hieu nham khong?
3. Neu demo/cham diem ngay thi can sua gap nhung gi?
