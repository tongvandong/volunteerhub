# API Layer

```text
httpClient.js     # Axios instance, bearer token, refresh token, 401 retry
authStorage.js    # localStorage wrapper cho token/user
modules/          # Endpoint chia theo domain
index.js          # Export tap trung cho cac module
```

Mapping nhanh:

- `auth.js`: login, register, forgot/reset password.
- `events.js`: event, registration, interview, recommendation, event category.
- `engagement.js`: channel, notification, badge, rating.
- `profiles.js`: profile, skill, sponsor profile, organizer verification, user lookup.
- `finance.js`: sponsor, campaign, donation, sponsorship proposal.
- `files.js`: upload va certificate.
- `admin.js`: admin, dashboard, export, monitoring.
- `reports.js`: RubyReportService qua `/api/reports`.

`src/services/api.js` chi la shim de import cu van chay. Code moi nen import tu `src/api` khi co the.
