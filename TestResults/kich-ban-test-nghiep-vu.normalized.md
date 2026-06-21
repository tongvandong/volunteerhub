# K?ch b?n test nghi?p v? � VolunteerHub

T�i li?u n�y li?t k� c�c k?ch b?n test th? c�ng (manual) bao g?m c? **happy path** v� **t�nh hu?ng b?t th??ng/edge case** m� ng??i test c?n ki?m tra tr�n giao di?n.

> **T�i kho?n demo:** admin/admin123, organizer/organizer123, volunteer/volunteer123, sponsor/sponsor123
> **URL:** http://localhost:3000

---

## 1. ??ng k� & ??ng nh?p (FR-01)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 1.1 | ??ng k� t�i kho?n m?i (Volunteer) | Th�nh c�ng, redirect v? login |
| 1.2 | ??ng nh?p ?�ng username/password | V�o dashboard ?�ng role |
| 1.3 | ??ng nh?p b?ng email thay username | C?ng th�nh c�ng |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 1.4 | ??ng k� tr�ng username | B�o l?i "username ?� t?n t?i" |
| 1.5 | ??ng k� tr�ng email | B�o l?i |
| 1.6 | ??ng nh?p sai m?t kh?u 8 l?n li�n ti?p | B? rate-limit 429 "Too many requests" |
| 1.7 | ??ng nh?p user b? kh�a (IsActive=false) | B�o l?i 401, kh�ng v�o ???c |
| 1.8 | Truy c?p /admin/users b?ng t�i kho?n volunteer | B? redirect v? dashboard (403) |
| 1.9 | Token h?t h?n → g?i API | T? refresh token ho?c redirect login |
| 1.10 | S?a localStorage token th�nh gi� tr? b?y → reload | B? ??y v? login |

---

## 2. X�c minh t? ch?c (FR-06)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 2.1 | Organizer v�o /organizer/verification, ?i?n ??y ?? th�ng tin, g?i | Status chuy?n Pending |
| 2.2 | Admin v�o /admin/organizer-verifications, duy?t | Status → Verified, organizer nh?n th�ng b�o |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 2.3 | Admin t? ch?i nh?ng l� do < 10 k� t? | B�o l?i validation |
| 2.4 | Organizer ch?a verified → t?o event | B? ch?n, hi?n th�ng b�o "C?n x�c minh t? ch?c" |
| 2.5 | Organizer ?� verified → s?a th�ng tin x�c minh | Status quay v? Pending, kh�ng t?o event m?i ???c |
| 2.6 | Admin duy?t organizer ?� Verified (double approve) | Kh�ng l?i, gi? nguy�n |

---

## 3. T?o & Duy?t s? ki?n (FR-07, FR-08)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 3.1 | Organizer (verified) t?o event ??y ?? th�ng tin | Event status = Pending |
| 3.2 | Admin duy?t event | Status → Approved, QR code sinh, channel t?o |
| 3.3 | Organizer s?a event Approved (??i th?i gian) | L?u th�nh c�ng, volunteer ?� confirm nh?n th�ng b�o |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 3.4 | T?o event EndDate < StartDate | B�o l?i validation |
| 3.5 | T?o event MinParticipants > MaxParticipants | B�o l?i |
| 3.6 | T?o event StartDate trong qu� kh? | B�o l?i ho?c c?nh b�o |
| 3.7 | Admin t? ch?i event, l� do < 10 k� t? | B�o l?i |
| 3.8 | Organizer g?i duy?t l?i event b? Rejected | Status → Pending |
| 3.9 | Volunteer c? approve event (s?a API call) | 403 Forbidden |
| 3.10 | S?a event ?� Cancelled | B? ch?n |
| 3.11 | T?o event khi organizer ch?a verified | B? ch?n |

---

## 4. ??ng k� s? ki?n (FR-10, FR-11, FR-12)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 4.1 | Volunteer ??ng k� event Approved | Registration status = Pending |
| 4.2 | Organizer x�c nh?n ??ng k� | Status → Confirmed, volunteer nh?n th�ng b�o |
| 4.3 | Volunteer r�t ??ng k� khi c�n Pending | Th�nh c�ng |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 4.4 | ??ng k� event ?� h?t ch? (MaxParticipants) | B�o l?i "H?t ch?" |
| 4.5 | ??ng k� event y�u c?u KYC nh?ng volunteer ch?a KYC | B�o l?i "C?n x�c minh danh t�nh" |
| 4.6 | ??ng k� l?i event ?� r�t tr??c ?� | Th�nh c�ng (t?o registration m?i) |
| 4.7 | ??ng k� 2 l?n c�ng event | B�o l?i "?� ??ng k�" |
| 4.8 | R�t ??ng k� khi ?� Confirmed | Kh�ng ???c r�t tr?c ti?p, ph?i g?i y�u c?u h?y |
| 4.9 | Volunteer g?i y�u c?u h?y (?� Confirmed) | Organizer nh?n request, ph� duy?t → Cancelled |
| 4.10 | Organizer h?y registration | Status → Cancelled, volunteer nh?n th�ng b�o |
| 4.11 | ??ng k� event Pending (ch?a duy?t) | B? ch?n |
| 4.12 | ??ng k� event ?ang di?n ra (StartDate ?� qua) | B? ch?n |

---

## 5. Ca l�m vi?c (FR-13)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 5.1 | Organizer t?o ca cho event | Th�nh c�ng, sub-channel t?o |
| 5.2 | Volunteer ??ng k� ch?n ca | Registration g?n shiftId |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 5.3 | T?o ca EndTime < StartTime | B�o l?i |
| 5.4 | T?o ca ngo�i kho?ng th?i gian event | B�o l?i |
| 5.5 | ??ng k� ca ?� h?t ch? | B�o l?i |
| 5.6 | T?o ca cho event Pending (ch?a approve) | Th�nh c�ng (parent channel t? t?o) |
| 5.7 | X�a ca ?� c� ng??i ??ng k� | C?n x? l�: ch?n ho?c c?nh b�o |

---

## 6. ?i?m danh & Check-out (FR-14, FR-14b)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 6.1 | Organizer qu�t QR volunteer ?� Confirmed | Check-in th�nh c�ng, volunteer nh?n th�ng b�o |
| 6.2 | Volunteer t? check-in b?ng QR (self check-in) | Th�nh c�ng |
| 6.3 | Organizer check-out volunteer | VolunteerHours t? t�nh, volunteer nh?n th�ng b�o |
| 6.4 | Walk-in: organizer ??ng k� + check-in t?i ch? | Registration t?o + check-in lu�n |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 6.5 | Check-in volunteer ch?a Confirmed (c�n Pending) | B? ch?n |
| 6.6 | Check-in ngo�i c?a s? th?i gian (event ch?a b?t ??u) | B? ch?n |
| 6.7 | Check-in ngo�i b�n k�nh GPS (>CheckInRadiusKm) | B? ch?n (n?u d�ng GPS) |
| 6.8 | Check-in 2 l?n c�ng volunteer | B? ch?n "?� ?i?m danh" |
| 6.9 | Check-out volunteer ch?a check-in | B? ch?n |
| 6.10 | Check-out 2 l?n | B? ch?n |
| 6.11 | Organizer xoay QR code → volunteer d�ng QR c? | B? ch?n "QR kh�ng h?p l?" |
| 6.12 | B? sung ?i?m danh sau 7 ng�y | B? ch?n |
| 6.13 | Organizer ch?nh VolunteerHours th�nh s? �m | B? ch?n |

---

## 7. Ho�n th�nh s? ki?n & Ch?ng ch? (FR-15, FR-16)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 7.1 | Organizer ?�nh d?u Complete | Event → Completed, ch?ng ch? t? c?p cho volunteer ?� check-in |
| 7.2 | Volunteer xem ch?ng ch? ? /my-certificates | Hi?n th? ?�ng, t?i PDF ???c |
| 7.3 | Guest x�c th?c ch?ng ch? qua m� verify | Hi?n th? th�ng tin h?p l? |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 7.4 | Complete event ch?a c� ai check-in | Th�nh c�ng nh?ng kh�ng c?p ch?ng ch? n�o |
| 7.5 | Complete event ch?a ?? MinParticipants | B�o l?i ho?c c?nh b�o |
| 7.6 | Admin m? l?i event (Uncomplete) | Status → Approved, ch?ng ch? b? thu h?i |
| 7.7 | X�c th?c ch?ng ch? v?i m� sai | Hi?n th? "Kh�ng t�m th?y" |
| 7.8 | Volunteer ch?a check-in nh?ng ?� Confirmed → Complete | Kh�ng ???c c?p ch?ng ch? |

---

## 8. H?y s? ki?n & Cascade (FR-09)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 8.1 | Organizer h?y event Approved (c� l� do) | Status → Cancelled |
| 8.2 | Volunteer ?� Confirmed nh?n th�ng b�o h?y | C� notification |
| 8.3 | Campaign Open t? chuy?n Closed | Ki?m tra campaign status |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 8.4 | H?y event ?� Completed | B? ch?n |
| 8.5 | H?y event kh�ng c� l� do | Th�nh c�ng (l� do optional) ho?c b?t bu?c t�y rule |
| 8.6 | Volunteer c? h?y event (kh�ng ph?i organizer) | 403 |
| 8.7 | Sau khi h?y, event bi?n m?t kh?i trang public | ?�ng, kh�ng hi?n n?a |
| 8.8 | Sponsor c� proposal Accepted → event h?y | Proposal → Cancelled, sponsor nh?n th�ng b�o |

---

## 9. K�u g?i ?ng h? & Donation (FR-20)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 9.1 | Organizer t?o campaign (Draft) → m? (Open) | Status chuy?n ?�ng |
| 9.2 | Volunteer donate 50.000? | Donation status = PendingConfirmation |
| 9.3 | Organizer x�c nh?n donation | Status → Confirmed, t?ng public c?p nh?t |
| 9.4 | Organizer ?�ng campaign → b�o c�o | Status → Closed → Reported |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 9.5 | Donate v�o campaign Draft (ch?a Open) | B? ch?n "Campaign is not open" |
| 9.6 | Donate v�o campaign Closed | B? ch?n |
| 9.7 | Donate s? ti?n = 0 ho?c �m | B? ch?n |
| 9.8 | Donate ?n danh → organizer xem list | Kh�ng th?y phone/email donor |
| 9.9 | Volunteer h?y donation khi c�n PendingConfirmation | Th�nh c�ng |
| 9.10 | Volunteer h?y donation ?� Confirmed | B? ch?n |
| 9.11 | Organizer t? ch?i donation | Status → Rejected, donor nh?n th�ng b�o |
| 9.12 | M? campaign t? Closed (?� ?�ng) | B? ch?n (ch? Draft→Open→Closed) |
| 9.13 | B�o c�o UsedAmount > ConfirmedAmount | B? ch?n ho?c y�u c?u gi?i tr�nh |

---

## 10. T�i tr? doanh nghi?p (FR-21)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 10.1 | Organizer m?i sponsor (OrganizerRequest) | Proposal status = Pending |
| 10.2 | Sponsor ch?p nh?n | Status → Accepted |
| 10.3 | Organizer x�c nh?n ?� nh?n ti?n (Received) | Nh?p ActualReceivedAmount |
| 10.4 | Organizer b�o c�o s? d?ng (Report) | Status → Reported |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 10.5 | Sponsor ?? ngh? t�i tr? event ?� c� proposal active | B? ch?n "?� c� ?? ngh?" |
| 10.6 | Sponsor h?y proposal sau khi Accepted | B? ch?n |
| 10.7 | Organizer reject proposal, l� do < 10 k� t? | B? ch?n |
| 10.8 | Event h?y → proposal Pending/Accepted t? Cancelled | Ki?m tra status |
| 10.9 | Admin rollback proposal v? Pending | Th�nh c�ng |
| 10.10 | Sponsor offer v�o event Pending (ch?a Approved) | B? ch?n |

---

## 11. ?�nh gi� hai chi?u (FR-18)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 11.1 | Volunteer ?�nh gi� organizer sau event Completed | Th�nh c�ng (1-5 sao + nh?n x�t) |
| 11.2 | Organizer ?�nh gi� volunteer ?� tham gia | Th�nh c�ng |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 11.3 | ?�nh gi� event ch?a Completed | B? ch?n |
| 11.4 | ?�nh gi� 2 l?n c�ng c?p/event | B? ch?n "?� ?�nh gi�" |
| 11.5 | Volunteer ?�nh gi� organizer event m�nh kh�ng tham gia | B? ch?n |
| 11.6 | Volunteer t? x�a ?�nh gi� | B? ch?n (ch? Admin x�a) |
| 11.7 | Admin ?n ?�nh gi� kh�ng ph� h?p | Th�nh c�ng, kh�ng hi?n public |
| 11.8 | ?i?m ngo�i 1-5 (0 ho?c 6) | B? ch?n |

---

## 12. Th�ng b�o & Realtime (FR-19, FR-24)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 12.1 | Event ???c duy?t → organizer nh?n th�ng b�o | C� notification m?i |
| 12.2 | Volunteer ???c check-in → nh?n th�ng b�o | C� notification |
| 12.3 | Chat trong channel event → tin nh?n hi?n realtime | SignalR push |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 12.4 | Th?i gian hi?n th? "X ph�t tr??c" ?�ng timezone | Kh�ng hi?n "7 gi? tr??c" khi v?a g?i |
| 12.5 | Volunteer kh�ng thu?c event → truy c?p channel | B? ch?n |
| 12.6 | G?i tin nh?n r?ng | B? ch?n |
| 12.7 | M?t k?t n?i SignalR → reconnect | T? reconnect, kh�ng m?t tin |

---

## 13. Admin qu?n tr? (FR-23)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 13.1 | Admin kh�a user | User b? 401 m?i API |
| 13.2 | Admin m? kh�a user | User ho?t ??ng b�nh th??ng |
| 13.3 | Admin t?o user m?i | Th�nh c�ng |
| 13.4 | Admin export events CSV | T?i file CSV ?�ng |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 13.5 | Kh�a organizer c� event Approved | Event t? h?y, campaign/proposal cascade |
| 13.6 | Admin transfer event cho organizer ch?a Verified | B? ch?n |
| 13.7 | Admin transfer event cho organizer b? kh�a | B? ch?n |
| 13.8 | Admin x�a skill ?ang ???c event s? d?ng | Skill b? x�a kh?i JSON event |
| 13.9 | Export > 10.000 rows | B? gi?i h?n maxRows |
| 13.10 | Admin auto-complete event ch?a qu� h?n 24h | Kh�ng complete |

---

## 14. H? s? & KYC (FR-03, FR-05)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 14.1 | Volunteer c?p nh?t profile (k? n?ng, bio, avatar) | L?u th�nh c�ng |
| 14.2 | Volunteer g?i KYC (?nh CCCD + ch�n dung) | Status → PendingVerification |
| 14.3 | Admin duy?t KYC | Status → Verified, volunteer nh?n th�ng b�o |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 14.4 | Admin t? ch?i KYC, l� do < 10 k� t? | B? ch?n |
| 14.5 | Volunteer g?i KYC l?n 2 khi ?ang Pending | B? ch?n ho?c ghi ?� |
| 14.6 | Xem profile ng??i kh�c → kh�ng th?y ?nh CCCD | ?�ng, KYC kh�ng leak |
| 14.7 | Volunteer g?i minh ch?ng k? n?ng → admin duy?t | Skill → Verified |

---

## 15. B?n ?? & Filter (FR-02)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 15.1 | Ch?n b�n k�nh 5km → hi?n event trong 5km | S? event tr�n b?n ?? = s? trong list |
| 15.2 | Ch?n k? n?ng "Kh�ng y�u c?u k? n?ng" | Hi?n event kh�ng y�u c?u skill |
| 15.3 | T�m ki?m keyword | K?t qu? ?�ng |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 15.4 | Ch?n 10km r?i ??i 5km | S? marker tr�n b?n ?? = s? event trong list (kh�ng l?ch) |
| 15.5 | T�m keyword kh�ng t?n t?i | Hi?n "Kh�ng t�m th?y s? ki?n" |
| 15.6 | Kh�ng cho ph�p GPS → b?n ?? v?n hi?n | Hi?n v? tr� m?c ??nh, kh�ng crash |

---

## 16. Sponsor Profile (FR-27)

### Happy path
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 16.1 | Sponsor v�o /sponsor/profile l?n ??u | Profile t? t?o, form tr?ng |
| 16.2 | Sponsor c?p nh?t th�ng tin | L?u th�nh c�ng |

### T�nh hu?ng b?t th??ng
| # | B??c | K?t qu? mong ??i |
|---|------|------------------|
| 16.3 | Volunteer truy c?p /sponsor/profile | B? redirect (kh�ng ph?i Sponsor) |
| 16.4 | Sponsor ?? tr?ng t�n t? ch?c → l?u | B? ch?n validation |

---

## 17. T�nh hu?ng ??c bi?t / Edge case t?ng h?p

| # | K?ch b?n | K?t qu? mong ??i |
|---|----------|------------------|
| 17.1 | Event ??n gi? b?t ??u nh?ng ch?a c� ai ??ng k� | H? th?ng g?i th�ng b�o cho organizer |
| 17.2 | Event k?t th�c nh?ng organizer kh�ng Complete | Admin th?y trong overdue preview, auto-complete sau 24h |
| 17.3 | Organizer t?o event → b? kh�a → event t? h?y | Cascade ?�ng |
| 17.4 | 2 tab c�ng login → 1 tab logout | Tab c�n l?i b? ??y v? login khi g?i API |
| 17.5 | Upload ?nh > 5MB | B? ch?n ho?c resize |
| 17.6 | Nh?p XSS `<script>alert(1)</script>` v�o t�n event | Hi?n th? text thu?n, kh�ng execute |
| 17.7 | Nh?p SQL injection v�o search | Kh�ng l?i, tr? k?t qu? r?ng |
| 17.8 | M? 2 browser, c�ng ??ng k� event → 1 ng??i cu?i h?t ch? | Ng??i sau nh?n l?i "H?t ch?" |
| 17.9 | Refresh token h?t h?n (sau 7 ng�y) | B? ??y v? login |
| 17.10 | Event c� 100 volunteer check-in → Complete | Ch?ng ch? c?p ?? 100 |
| 17.11 | Trang hi?n th? ti?ng Vi?t ?�ng (kh�ng mojibake) | T?t c? trang kh�ng c� k� t? l? |
| 17.12 | Mobile responsive (viewport 375px) | Layout kh�ng v? |
| 17.13 | Slow network (3G) → submit form | Kh�ng submit 2 l?n (double-click protection) |
| 17.14 | Back button sau khi submit form | Kh�ng re-submit |

---

## C�ch s? d?ng t�i li?u n�y

1. **M?i k?ch b?n** = 1 test case. ?�nh d?u ?/? khi test.
2. **T�nh hu?ng b?t th??ng** quan tr?ng h?n happy path � ?�y l� n?i bug th??ng ?n.
3. ?u ti�n test theo th? t?: **Security (RBAC, leak)** → **Data integrity (cascade, status)** → **UX (th�ng b�o, redirect)**.
4. N?u ph�t hi?n l?i, ghi l?i: s? k?ch b?n + m� t? l?i + screenshot.

---

*T?ng: 17 nh�m, ~120 k?ch b?n.*
