# Volunteer Hub - Chia folder/service cho nhom 3 nguoi

Tai thoi diem hien tai project van nen giu chung solution va chung database de tranh tang do phuc tap tich hop. Viec chia folder duoi day nham giup 3 nguoi lap trinh song song, moi nguoi co vung file ro rang, it dung nhau.

## 1. Identity / Profile / Verification

Nguoi phu trach: thanh vien A.

Pham vi:

- Dang nhap, dang ky, JWT, role.
- Ho so nguoi dung.
- Ho so volunteer: ky nang, ngon ngu, KYC.
- Xac minh organizer: thong tin phap ly, trang thai pending/verified/rejected.
- Rule nen:
  - Organizer chua verified thi khong duoc tao event.
  - Volunteer chua KYC van dung app duoc, nhung bi chan khi event yeu cau KYC.

Folder chinh:

- `BaseCore.AuthService/`
- `BaseCore.Services/Authen/`
- `BaseCore.APIService/Controllers/Identity/`
- `BaseCore.Entities/User.cs`
- `BaseCore.Entities/VolunteerProfile.cs`
- `BaseCore.Entities/VolunteerSkill.cs`
- `BaseCore.Entities/OrganizerVerification.cs`
- `BaseCore.Repository/EFCore/VolunteerProfileRepository.cs`
- `BaseCore.Repository/Authen/`
- `BaseCore.WebClient/src/pages/auth/`
- `BaseCore.WebClient/src/pages/volunteer/MyProfile.jsx`
- `BaseCore.WebClient/src/pages/organizer/OrganizerVerification.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminOrganizerVerifications.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminVolunteerVerifications.jsx`

## 2. Event / Registration / Attendance

Nguoi phu trach: thanh vien B.

Pham vi:

- Organizer tao/sua event.
- Cau hinh event: yeu cau KYC, min/max volunteer, dia diem, ban do.
- Admin duyet/tu choi event.
- Volunteer xem va dang ky event.
- Organizer confirm/reject volunteer.
- Diem danh QR va diem danh thu cong.
- Ca lam viec, certificate, volunteer passport neu mo rong.

Folder chinh:

- `BaseCore.APIService/Controllers/Events/`
- `BaseCore.Services/VolunteerHub/Events/`
- `BaseCore.Entities/Event.cs`
- `BaseCore.Entities/EventCategory.cs`
- `BaseCore.Entities/Registration.cs`
- `BaseCore.Entities/WorkShift.cs`
- `BaseCore.Entities/Certificate.cs`
- `BaseCore.Entities/CertificateJob.cs`
- `BaseCore.Repository/EFCore/EventRepository.cs`
- `BaseCore.Repository/EFCore/RegistrationRepository.cs`
- `BaseCore.Repository/EFCore/WorkShiftRepository.cs`
- `BaseCore.Repository/EFCore/CertificateRepository.cs`
- `BaseCore.WebClient/src/pages/public/EventList.jsx`
- `BaseCore.WebClient/src/pages/public/EventDetail.jsx`
- `BaseCore.WebClient/src/pages/organizer/EventForm.jsx`
- `BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx`
- `BaseCore.WebClient/src/pages/organizer/MyEvents.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminEvents.jsx`
- `BaseCore.WebClient/src/pages/volunteer/MyRegistrations.jsx`
- `BaseCore.WebClient/src/pages/volunteer/Passport.jsx`

## 3. Donation / Sponsorship / Financial Report

Nguoi phu trach: thanh vien C.

Pham vi:

- Organizer tao dot keu goi ung ho cho event.
- Volunteer ung ho ca nhan vao campaign.
- Organizer confirm donation.
- Sponsor gui de nghi tai tro doanh nghiep.
- Organizer accept/reject sponsorship proposal.
- Sponsor/organizer cap nhat received/report.
- Bao cao tai chinh va minh bach dong gop.

Folder chinh:

- `BaseCore.APIService/Controllers/Finance/`
- `BaseCore.Entities/SupportCampaign.cs`
- `BaseCore.Entities/IndividualDonation.cs`
- `BaseCore.Entities/SponsorshipProposal.cs`
- `BaseCore.Entities/EventSponsor.cs`
- `BaseCore.Entities/SponsorProjectMilestone.cs`
- `BaseCore.WebClient/src/pages/volunteer/MyDonations.jsx`
- `BaseCore.WebClient/src/pages/sponsor/MySponsorships.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminExport.jsx`
- Cac phan tai chinh trong `BaseCore.WebClient/src/pages/public/EventDetail.jsx`
- Cac phan campaign/sponsorship trong `BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx`

## 4. Admin / Monitoring / Shared

Pham vi nay co the chia phu cho nguoi nao dang ranh, nhung nen de thanh vien C nam chinh neu lien quan bao cao.

Folder chinh:

- `BaseCore.APIService/Controllers/Admin/`
- `BaseCore.Services/VolunteerHub/Admin/`
- `BaseCore.APIService/Controllers/Shared/`
- `BaseCore.Services/VolunteerHub/Engagement/`
- `BaseCore.WebClient/src/pages/admin/`
- `BaseCore.WebClient/src/pages/Notifications.jsx`
- `BaseCore.WebClient/src/pages/shared/`

## Quy tac lam viec de tranh conflict

- Moi nguoi uu tien sua file trong folder minh phu trach.
- Neu can sua entity/database migration, bao truoc cho ca nhom vi day la vung de conflict.
- Neu module A can du lieu module B, goi qua service/repository hien co, khong copy logic.
- Khong doi route API neu frontend hoac nguoi khac dang dung route do.
- Moi PR/commit nen co it nhat:
  - Backend build pass.
  - Frontend build pass neu cham UI.
  - Test nhanh 1 flow lien quan.

## Huong tach tiep neu can microservice that

Sau khi chay on dinh theo folder, co the tach thanh 3 project backend rieng:

- `VolunteerHub.IdentityService`
- `VolunteerHub.EventService`
- `VolunteerHub.FinanceService`

Nhung voi do an/demo, nen giu cach chia folder trong cung solution truoc de giam rui ro.
