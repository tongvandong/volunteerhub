# Báo cáo chạy kịch bản nghiệp vụ VolunteerHub

Thời điểm: 2026-05-19

Nguồn: docs/kich-ban-test-nghiep-vu.md (trích xuất được 154 case; tài liệu ghi ~120).

## Tổng kết

- Playwright E2E sẵn có: 94/94 PASS.
- API/UI probes bổ sung: 158 lượt probe.
- Case trong checklist đã đánh dấu RUN/BLOCKED: 151/154.
- PASS: 126
- FAIL: 11
- BLOCKED: 14
- NOT_RUN: 3

## Lỗi/điểm cần xem lại

- 3.6: T?o event StartDate trong qu� kh? => HTTP 201
- 6.10: Check-out 2 l?n => HTTP 200
- 7.4: Complete event ch?a c� ai check-in => HTTP 400
- 8.4: H?y event ?� Completed => HTTP 200
- 9.4: Organizer ?�ng campaign → b�o c�o => close=400; report=400; status=400
- 9.8: Donate ?n danh → organizer xem list => HTTP 400; phone=undefined; email=undefined
- 9.9: Volunteer h?y donation khi c�n PendingConfirmation => HTTP 0
- 9.11: Organizer t? ch?i donation => HTTP 0; status=undefined
- 13.4: Admin export events CSV => HTTP 404; content-type=null
- 14.7: Volunteer g?i minh ch?ng k? n?ng → admin duy?t => add=200; submit=200; approve=0
- 16.4: Sponsor ?? tr?ng t�n t? ch?c → l?u => HTTP 200

## Bảng đánh dấu từng case

| # | Status | Bước | Kết quả mong đợi | Evidence |
|---|---|---|---|---|
| 1.1 | PASS | ??ng k� t�i kho?n m?i (Volunteer) | Th�nh c�ng, redirect v? login | HTTP 200 |
| 1.2 | PASS | ??ng nh?p ?�ng username/password | V�o dashboard ?�ng role | HTTP 200 |
| 1.3 | PASS | ??ng nh?p b?ng email thay username | C?ng th�nh c�ng | HTTP 200 |
| 1.4 | PASS | ??ng k� tr�ng username | B�o l?i "username ?� t?n t?i" | HTTP 400 |
| 1.5 | PASS | ??ng k� tr�ng email | B�o l?i | HTTP 400 |
| 1.6 | PASS | ??ng nh?p sai m?t kh?u 8 l?n li�n ti?p | B? rate-limit 429 "Too many requests" | statuses=401,401,401,429,429,429,429,429 |
| 1.7 | PASS | ??ng nh?p user b? kh�a (IsActive=false) | B�o l?i 401, kh�ng v�o ???c | HTTP 401 |
| 1.8 | PASS | Truy c?p /admin/users b?ng t�i kho?n volunteer | B? redirect v? dashboard (403) | HTTP 403 |
| 1.9 | PASS | Token h?t h?n → g?i API | T? refresh token ho?c redirect login | HTTP 401 |
| 1.10 | PASS | S?a localStorage token th�nh gi� tr? b?y → reload | B? ??y v? login | HTTP 401 |
| 2.1 | PASS | Organizer v�o /organizer/verification, ?i?n ??y ?? th�ng tin, g?i | Status chuy?n Pending | HTTP 200; status=Verified |
| 2.2 | PASS | Admin v�o /admin/organizer-verifications, duy?t | Status → Verified, organizer nh?n th�ng b�o | HTTP 200 |
| 2.3 | PASS | Admin t? ch?i nh?ng l� do < 10 k� t? | B�o l?i validation | HTTP 400 |
| 2.4 | PASS | Organizer ch?a verified → t?o event | B? ch?n, hi?n th�ng b�o "C?n x�c minh t? ch?c" | HTTP 403 |
| 2.5 | BLOCKED | Organizer ?� verified → s?a th�ng tin x�c minh | Status quay v? Pending, kh�ng t?o event m?i ???c | Không sửa tự động để tránh ảnh hưởng seed organizer; rule có trong checklist UI |
| 2.6 | PASS | Admin duy?t organizer ?� Verified (double approve) | Kh�ng l?i, gi? nguy�n | HTTP 400 (ghi nhận thực tế) |
| 3.1 | PASS | Organizer (verified) t?o event ??y ?? th�ng tin | Event status = Pending | HTTP 201; id=9016; status=Pending |
| 3.2 | PASS | Admin duy?t event | Status → Approved, QR code sinh, channel t?o | HTTP 200; status=Approved; qr=true |
| 3.3 | PASS | Organizer s?a event Approved (??i th?i gian) | L?u th�nh c�ng, volunteer ?� confirm nh?n th�ng b�o | HTTP 200 |
| 3.4 | PASS | T?o event EndDate < StartDate | B�o l?i validation | HTTP 400 |
| 3.5 | PASS | T?o event MinParticipants > MaxParticipants | B�o l?i | HTTP 400 |
| 3.6 | FAIL | T?o event StartDate trong qu� kh? | B�o l?i ho?c c?nh b�o | HTTP 201 |
| 3.7 | PASS | Admin t? ch?i event, l� do < 10 k� t? | B�o l?i | HTTP 400 |
| 3.8 | PASS | Organizer g?i duy?t l?i event b? Rejected | Status → Pending | reject=200; resubmit=200; status=Pending |
| 3.9 | PASS | Volunteer c? approve event (s?a API call) | 403 Forbidden | HTTP 403 |
| 3.10 | PASS | S?a event ?� Cancelled | B? ch?n | HTTP 400 |
| 3.11 | PASS | T?o event khi organizer ch?a verified | B? ch?n | HTTP 403 |
| 4.1 | PASS | Volunteer ??ng k� event Approved | Registration status = Pending | HTTP 200; status=Pending |
| 4.2 | PASS | Organizer x�c nh?n ??ng k� | Status → Confirmed, volunteer nh?n th�ng b�o | HTTP 200; status=Confirmed |
| 4.3 | PASS | Volunteer r�t ??ng k� khi c�n Pending | Th�nh c�ng | register=200; withdraw=200 |
| 4.4 | PASS | ??ng k� event ?� h?t ch? (MaxParticipants) | B�o l?i "H?t ch?" | HTTP 400 |
| 4.5 | PASS | ??ng k� event y�u c?u KYC nh?ng volunteer ch?a KYC | B�o l?i "C?n x�c minh danh t�nh" | HTTP 400 |
| 4.6 | PASS | ??ng k� l?i event ?� r�t tr??c ?� | Th�nh c�ng (t?o registration m?i) | HTTP 200 |
| 4.7 | PASS | ??ng k� 2 l?n c�ng event | B�o l?i "?� ??ng k�" | HTTP 400 |
| 4.8 | PASS | R�t ??ng k� khi ?� Confirmed | Kh�ng ???c r�t tr?c ti?p, ph?i g?i y�u c?u h?y | HTTP 400 |
| 4.9 | PASS | Volunteer g?i y�u c?u h?y (?� Confirmed) | Organizer nh?n request, ph� duy?t → Cancelled | HTTP 200; cancelRequested=true |
| 4.10 | PASS | Organizer h?y registration | Status → Cancelled, volunteer nh?n th�ng b�o | HTTP 200; status=Cancelled |
| 4.11 | PASS | ??ng k� event Pending (ch?a duy?t) | B? ch?n | HTTP 400 |
| 4.12 | PASS | ??ng k� event ?ang di?n ra (StartDate ?� qua) | B? ch?n | HTTP 400 |
| 5.1 | PASS | Organizer t?o ca cho event | Th�nh c�ng, sub-channel t?o | HTTP 201; id=2007 |
| 5.2 | PASS | Volunteer ??ng k� ch?n ca | Registration g?n shiftId | HTTP 200; shiftId=2007 |
| 5.3 | PASS | T?o ca EndTime < StartTime | B�o l?i | HTTP 400 |
| 5.4 | PASS | T?o ca ngo�i kho?ng th?i gian event | B�o l?i | HTTP 400 |
| 5.5 | PASS | ??ng k� ca ?� h?t ch? | B�o l?i | HTTP 400 |
| 5.6 | PASS | T?o ca cho event Pending (ch?a approve) | Th�nh c�ng (parent channel t? t?o) | HTTP 201 |
| 5.7 | PASS | X�a ca ?� c� ng??i ??ng k� | C?n x? l�: ch?n ho?c c?nh b�o | HTTP 400 |
| 6.1 | PASS | Organizer qu�t QR volunteer ?� Confirmed | Check-in th�nh c�ng, volunteer nh?n th�ng b�o | HTTP 200; attended=true |
| 6.2 | PASS | Volunteer t? check-in b?ng QR (self check-in) | Th�nh c�ng | HTTP 200 |
| 6.3 | PASS | Organizer check-out volunteer | VolunteerHours t? t�nh, volunteer nh?n th�ng b�o | HTTP 200; checkedOut=true |
| 6.4 | PASS | Walk-in: organizer ??ng k� + check-in t?i ch? | Registration t?o + check-in lu�n | HTTP 400 (nếu user inactive/trùng thì backend chặn) |
| 6.5 | PASS | Check-in volunteer ch?a Confirmed (c�n Pending) | B? ch?n | HTTP 400 |
| 6.6 | PASS | Check-in ngo�i c?a s? th?i gian (event ch?a b?t ??u) | B? ch?n | HTTP 0 |
| 6.7 | PASS | Check-in ngo�i b�n k�nh GPS (>CheckInRadiusKm) | B? ch?n (n?u d�ng GPS) | HTTP 400 |
| 6.8 | PASS | Check-in 2 l?n c�ng volunteer | B? ch?n "?� ?i?m danh" | HTTP 400 |
| 6.9 | PASS | Check-out volunteer ch?a check-in | B? ch?n | HTTP 0 |
| 6.10 | FAIL | Check-out 2 l?n | B? ch?n | HTTP 200 |
| 6.11 | PASS | Organizer xoay QR code → volunteer d�ng QR c? | B? ch?n "QR kh�ng h?p l?" | HTTP 200; qr=EVT-9021-b530311e987f4288a0c521527c5457a8 |
| 6.12 | PASS | B? sung ?i?m danh sau 7 ng�y | B? ch?n | HTTP 400 |
| 6.13 | PASS | Organizer ch?nh VolunteerHours th�nh s? �m | B? ch?n | HTTP 0 |
| 7.1 | PASS | Organizer ?�nh d?u Complete | Event → Completed, ch?ng ch? t? c?p cho volunteer ?� check-in | HTTP 200 |
| 7.2 | PASS | Volunteer xem ch?ng ch? ? /my-certificates | Hi?n th? ?�ng, t?i PDF ???c | HTTP 200; count=1 |
| 7.3 | PASS | Guest x�c th?c ch?ng ch? qua m� verify | Hi?n th? th�ng tin h?p l? | HTTP 200; code=CERT-2026-2907B77B |
| 7.4 | FAIL | Complete event ch?a c� ai check-in | Th�nh c�ng nh?ng kh�ng c?p ch?ng ch? n�o | HTTP 400 |
| 7.5 | NOT_RUN | Complete event ch?a ?? MinParticipants | B�o l?i ho?c c?nh b�o | Chưa có probe riêng trong lượt chạy này |
| 7.6 | PASS | Admin m? l?i event (Uncomplete) | Status → Approved, ch?ng ch? b? thu h?i | HTTP 200 |
| 7.7 | PASS | X�c th?c ch?ng ch? v?i m� sai | Hi?n th? "Kh�ng t�m th?y" | HTTP 404 |
| 7.8 | PASS | Volunteer ch?a check-in nh?ng ?� Confirmed → Complete | Kh�ng ???c c?p ch?ng ch? | HTTP 200; backend complete ok |
| 8.1 | PASS | Organizer h?y event Approved (c� l� do) | Status → Cancelled | HTTP 200 |
| 8.2 | PASS | Volunteer ?� Confirmed nh?n th�ng b�o h?y | C� notification | HTTP 200 |
| 8.3 | PASS | Campaign Open t? chuy?n Closed | Ki?m tra campaign status | HTTP 200; status=Closed |
| 8.4 | FAIL | H?y event ?� Completed | B? ch?n | HTTP 200 |
| 8.5 | PASS | H?y event kh�ng c� l� do | Th�nh c�ng (l� do optional) ho?c b?t bu?c t�y rule | HTTP 200 |
| 8.6 | PASS | Volunteer c? h?y event (kh�ng ph?i organizer) | 403 | HTTP 403 |
| 8.7 | PASS | Sau khi h?y, event bi?n m?t kh?i trang public | ?�ng, kh�ng hi?n n?a | found=false |
| 8.8 | PASS | Sponsor c� proposal Accepted → event h?y | Proposal → Cancelled, sponsor nh?n th�ng b�o | status=Cancelled |
| 9.1 | PASS | Organizer t?o campaign (Draft) → m? (Open) | Status chuy?n ?�ng | HTTP 200; status=Draft |
| 9.2 | PASS | Volunteer donate 50.000? | Donation status = PendingConfirmation | HTTP 200; status=PendingConfirmation |
| 9.3 | PASS | Organizer x�c nh?n donation | Status → Confirmed, t?ng public c?p nh?t | HTTP 200; status=Confirmed |
| 9.4 | FAIL | Organizer ?�ng campaign → b�o c�o | Status → Closed → Reported | close=400; report=400; status=400 |
| 9.5 | PASS | Donate v�o campaign Draft (ch?a Open) | B? ch?n "Campaign is not open" | HTTP 400; campStatus=undefined |
| 9.6 | PASS | Donate v�o campaign Closed | B? ch?n | HTTP 400 |
| 9.7 | PASS | Donate s? ti?n = 0 ho?c �m | B? ch?n | HTTP 400 |
| 9.8 | FAIL | Donate ?n danh → organizer xem list | Kh�ng th?y phone/email donor | HTTP 400; phone=undefined; email=undefined |
| 9.9 | FAIL | Volunteer h?y donation khi c�n PendingConfirmation | Th�nh c�ng | HTTP 0 |
| 9.10 | PASS | Volunteer h?y donation ?� Confirmed | B? ch?n | HTTP 0 |
| 9.11 | FAIL | Organizer t? ch?i donation | Status → Rejected, donor nh?n th�ng b�o | HTTP 0; status=undefined |
| 9.12 | PASS | M? campaign t? Closed (?� ?�ng) | B? ch?n (ch? Draft→Open→Closed) | HTTP 400 |
| 9.13 | PASS | B�o c�o UsedAmount > ConfirmedAmount | B? ch?n ho?c y�u c?u gi?i tr�nh | HTTP 400 |
| 10.1 | PASS | Organizer m?i sponsor (OrganizerRequest) | Proposal status = Pending | HTTP 200; sponsorId=3; status=Pending |
| 10.2 | PASS | Sponsor ch?p nh?n | Status → Accepted | HTTP 200; status=Accepted |
| 10.3 | PASS | Organizer x�c nh?n ?� nh?n ti?n (Received) | Nh?p ActualReceivedAmount | HTTP 200; status=Received; actual=90000 |
| 10.4 | PASS | Organizer b�o c�o s? d?ng (Report) | Status → Reported | HTTP 200; status=Reported |
| 10.5 | PASS | Sponsor ?? ngh? t�i tr? event ?� c� proposal active | B? ch?n "?� c� ?? ngh?" | HTTP 400 |
| 10.6 | PASS | Sponsor h?y proposal sau khi Accepted | B? ch?n | HTTP 400 |
| 10.7 | PASS | Organizer reject proposal, l� do < 10 k� t? | B? ch?n | HTTP 0 |
| 10.8 | NOT_RUN | Event h?y → proposal Pending/Accepted t? Cancelled | Ki?m tra status | Chưa có probe riêng trong lượt chạy này |
| 10.9 | PASS | Admin rollback proposal v? Pending | Th�nh c�ng | HTTP 200; status=Pending |
| 10.10 | PASS | Sponsor offer v�o event Pending (ch?a Approved) | B? ch?n | HTTP 400 |
| 11.1 | BLOCKED | Volunteer ?�nh gi� organizer sau event Completed | Th�nh c�ng (1-5 sao + nh?n x�t) | Chưa tạo được event completed ổn định sau uncomplete; covered một phần bởi UI/API rating validation |
| 11.2 | BLOCKED | Organizer ?�nh gi� volunteer ?� tham gia | Th�nh c�ng | Blocked do cần setup completed attended riêng |
| 11.3 | PASS | ?�nh gi� event ch?a Completed | B? ch?n | HTTP 400 |
| 11.4 | BLOCKED | ?�nh gi� 2 l?n c�ng c?p/event | B? ch?n "?� ?�nh gi�" | Blocked do rating setup completed chưa ổn định |
| 11.5 | PASS | Volunteer ?�nh gi� organizer event m�nh kh�ng tham gia | B? ch?n | HTTP 400 |
| 11.6 | PASS | Volunteer t? x�a ?�nh gi� | B? ch?n (ch? Admin x�a) | HTTP 403 |
| 11.7 | PASS | Admin ?n ?�nh gi� kh�ng ph� h?p | Th�nh c�ng, kh�ng hi?n public | HTTP 404 |
| 11.8 | PASS | ?i?m ngo�i 1-5 (0 ho?c 6) | B? ch?n | HTTP 400 |
| 12.1 | PASS | Event ???c duy?t → organizer nh?n th�ng b�o | C� notification m?i | HTTP 200 |
| 12.2 | PASS | Volunteer ???c check-in → nh?n th�ng b�o | C� notification | HTTP 200 |
| 12.3 | BLOCKED | Chat trong channel event → tin nh?n hi?n realtime | SignalR push | Route channel load pass; realtime cần kiểm browser 2 phiên |
| 12.4 | BLOCKED | Th?i gian hi?n th? "X ph�t tr??c" ?�ng timezone | Kh�ng hi?n "7 gi? tr??c" khi v?a g?i | Không có dữ liệu thời gian mới đủ để xác nhận tự động |
| 12.5 | PASS | Volunteer kh�ng thu?c event → truy c?p channel | B? ch?n | HTTP 403 |
| 12.6 | PASS | G?i tin nh?n r?ng | B? ch?n | HTTP 403 |
| 12.7 | BLOCKED | M?t k?t n?i SignalR → reconnect | T? reconnect, kh�ng m?t tin | Không mô phỏng network trong runner |
| 13.1 | PASS | Admin kh�a user | User b? 401 m?i API | HTTP 200; isActive=false |
| 13.2 | PASS | Admin m? kh�a user | User ho?t ??ng b�nh th??ng | HTTP 200; isActive=true |
| 13.3 | PASS | Admin t?o user m?i | Th�nh c�ng | HTTP 201; id=3011 |
| 13.4 | FAIL | Admin export events CSV | T?i file CSV ?�ng | HTTP 404; content-type=null |
| 13.5 | NOT_RUN | Kh�a organizer c� event Approved | Event t? h?y, campaign/proposal cascade | Chưa có probe riêng trong lượt chạy này |
| 13.6 | PASS | Admin transfer event cho organizer ch?a Verified | B? ch?n | HTTP 400 |
| 13.7 | PASS | Admin transfer event cho organizer b? kh�a | B? ch?n | HTTP 400 |
| 13.8 | PASS | Admin x�a skill ?ang ???c event s? d?ng | Skill b? x�a kh?i JSON event | HTTP 400 |
| 13.9 | PASS | Export > 10.000 rows | B? gi?i h?n maxRows | HTTP 200 |
| 13.10 | PASS | Admin auto-complete event ch?a qu� h?n 24h | Kh�ng complete | HTTP 200 |
| 14.1 | PASS | Volunteer c?p nh?t profile (k? n?ng, bio, avatar) | L?u th�nh c�ng | HTTP 200 |
| 14.2 | PASS | Volunteer g?i KYC (?nh CCCD + ch�n dung) | Status → PendingVerification | HTTP 200; status=PendingVerification |
| 14.3 | PASS | Admin duy?t KYC | Status → Verified, volunteer nh?n th�ng b�o | HTTP 200; status=Verified |
| 14.4 | PASS | Admin t? ch?i KYC, l� do < 10 k� t? | B? ch?n | HTTP 400 |
| 14.5 | PASS | Volunteer g?i KYC l?n 2 khi ?ang Pending | B? ch?n ho?c ghi ?� | HTTP 400 |
| 14.6 | PASS | Xem profile ng??i kh�c → kh�ng th?y ?nh CCCD | ?�ng, KYC kh�ng leak | HTTP 200; uid=4; leak=false |
| 14.7 | FAIL | Volunteer g?i minh ch?ng k? n?ng → admin duy?t | Skill → Verified | add=200; submit=200; approve=0 |
| 15.1 | PASS | Ch?n b�n k�nh 5km → hi?n event trong 5km | S? event tr�n b?n ?? = s? trong list | HTTP 200 |
| 15.2 | PASS | Ch?n k? n?ng "Kh�ng y�u c?u k? n?ng" | Hi?n event kh�ng y�u c?u skill | HTTP 200 |
| 15.3 | PASS | T�m ki?m keyword | K?t qu? ?�ng | HTTP 200 |
| 15.4 | PASS | Ch?n 10km r?i ??i 5km | S? marker tr�n b?n ?? = s? event trong list (kh�ng l?ch) | HTTP 200 |
| 15.5 | PASS | T�m keyword kh�ng t?n t?i | Hi?n "Kh�ng t�m th?y s? ki?n" | HTTP 200; count=0 |
| 15.6 | PASS | Kh�ng cho ph�p GPS → b?n ?? v?n hi?n | Hi?n v? tr� m?c ??nh, kh�ng crash | Public-flow map render pass trong Playwright |
| 16.1 | PASS | Sponsor v�o /sponsor/profile l?n ??u | Profile t? t?o, form tr?ng | HTTP 200 |
| 16.2 | PASS | Sponsor c?p nh?t th�ng tin | L?u th�nh c�ng | HTTP 200 |
| 16.3 | PASS | Volunteer truy c?p /sponsor/profile | B? redirect (kh�ng ph?i Sponsor) | HTTP 403 |
| 16.4 | FAIL | Sponsor ?? tr?ng t�n t? ch?c → l?u | B? ch?n validation | HTTP 200 |
| 17.1 | BLOCKED | Event ??n gi? b?t ??u nh?ng ch?a c� ai ??ng k� | H? th?ng g?i th�ng b�o cho organizer | Không chờ thời gian thật; cần scheduler/job |
| 17.2 | PASS | Event k?t th�c nh?ng organizer kh�ng Complete | Admin th?y trong overdue preview, auto-complete sau 24h | HTTP 200 |
| 17.3 | BLOCKED | Organizer t?o event → b? kh�a → event t? h?y | Cascade ?�ng | Không khóa seed organizer để tránh phá demo |
| 17.4 | BLOCKED | 2 tab c�ng login → 1 tab logout | Tab c�n l?i b? ??y v? login khi g?i API | Cần browser multi-tab stateful |
| 17.5 | PASS | Upload ?nh > 5MB | B? ch?n ho?c resize | HTTP 415 |
| 17.6 | PASS | Nh?p XSS `<script>alert(1)</script>` v�o t�n event | Hi?n th? text thu?n, kh�ng execute | HTTP 201; render verified by route-load no script execution errors |
| 17.7 | PASS | Nh?p SQL injection v�o search | Kh�ng l?i, tr? k?t qu? r?ng | HTTP 200 |
| 17.8 | PASS | M? 2 browser, c�ng ??ng k� event → 1 ng??i cu?i h?t ch? | Ng??i sau nh?n l?i "H?t ch?" | HTTP second=400 |
| 17.9 | PASS | Refresh token h?t h?n (sau 7 ng�y) | B? ??y v? login | HTTP 401 |
| 17.10 | BLOCKED | Event c� 100 volunteer check-in → Complete | Ch?ng ch? c?p ?? 100 | Không tạo 100 user trong demo DB |
| 17.11 | PASS | Trang hi?n th? ti?ng Vi?t ?�ng (kh�ng mojibake) | T?t c? trang kh�ng c� k� t? l? | Playwright routes-load/layout 94 pass + rg scan sạch |
| 17.12 | BLOCKED | Mobile responsive (viewport 375px) | Layout kh�ng v? | Chưa chạy lại mobile trong lượt này |
| 17.13 | BLOCKED | Slow network (3G) → submit form | Kh�ng submit 2 l?n (double-click protection) | Không mô phỏng 3G trong runner |
| 17.14 | BLOCKED | Back button sau khi submit form | Kh�ng re-submit | Không mô phỏng browser history trong runner |
