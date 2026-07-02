# VolunteerHub

VolunteerHub lÃ  há»‡ thá»‘ng quáº£n lÃ½ hoáº¡t Ä‘á»™ng tÃ¬nh nguyá»‡n gá»“m backend `.NET 8` vÃ  frontend React/Vite.

Frontend chÃ­nh Ä‘ang dÃ¹ng náº±m á»Ÿ `BaseCore.WebClient`.

## Kiáº¿n TrÃºc Cháº¡y Local

CÃ¡c service local:

| Service | Project | Port | URL |
| --- | --- | ---: | --- |
| API Gateway | `BaseCore.ApiGateway` | `5000` | `http://localhost:5000` |
| Auth API | `BaseCore.AuthService` | `5002` | `http://localhost:5002` |
| Event API | `BaseCore.EventService` | `5003` | `http://localhost:5003` |
| Finance API | `BaseCore.FinanceService` | `5004` | `http://localhost:5004` |
| Report API | `RubyReportService` | `5005` | `http://localhost:5005` |
| Frontend | `BaseCore.WebClient` | `3000` | `http://localhost:3000` |

Frontend gá»i API qua `/api`, Vite proxy `/api` vá» Gateway `http://localhost:5000`.

Gateway route:

- `/api/auth/*` -> AuthService `5002`
- `/api/users/*` -> AuthService `5002`
- `/api/events/*`, `/api/dashboard/*`, `/api/channels/*` -> EventService `5003`
- `/api/donations/*`, `/api/support-campaigns/*`, `/api/admin/finance/*` -> FinanceService `5004`
- `/api/reports/*` -> RubyReportService `5005`
- `/api/*` fallback -> AuthService `5002`

## YÃªu Cáº§u MÃ´i TrÆ°á»ng

- .NET SDK 8+
- Node.js 20+ vÃ  npm
- SQL Server
- Git

## Cáº¥u HÃ¬nh SQL Server

Connection string hiá»‡n náº±m trong:

- `BaseCore.APIService/appsettings.json`
- `BaseCore.AuthService/appsettings.json`

Máº·c Ä‘á»‹nh hiá»‡n táº¡i:

```json
"ConnectionStrings": {
  "ConnectedDb": "Data Source=LAPTOP-70RJA2GI\\SQLSERVER2022DEV;Initial Catalog=VolunteerHub;Integrated Security=True;Trust Server Certificate=True"
}
```

Khi cháº¡y trÃªn mÃ¡y khÃ¡c, Ä‘á»•i `Data Source` theo SQL Server instance local cá»§a báº¡n. VÃ­ dá»¥:

```json
"ConnectionStrings": {
  "ConnectedDb": "Data Source=localhost;Initial Catalog=VolunteerHub;Integrated Security=True;Trust Server Certificate=True"
}
```

Hoáº·c náº¿u dÃ¹ng SQL login:

```json
"ConnectionStrings": {
  "ConnectedDb": "Data Source=localhost;Initial Catalog=VolunteerHub;User Id=sa;Password=YOUR_PASSWORD;Trust Server Certificate=True"
}
```

Database tÃªn `VolunteerHub`. Hai service `APIService` vÃ  `AuthService` tá»± cháº¡y EF migration khi startup qua `DatabaseMigrationRunner`, nÃªn chá»‰ cáº§n SQL Server truy cáº­p Ä‘Æ°á»£c.

## CÃ i Package

Backend restore:

```powershell
cd D:\FW\FW\BaseCore
dotnet restore BaseCore.sln
```

Frontend install:

```powershell
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm install
```

## Cháº¡y Project Local

Má»Ÿ 4 terminal riÃªng.

Terminal 1: AuthService

```powershell
cd D:\FW\FW\BaseCore
dotnet run --project BaseCore.AuthService\BaseCore.AuthService.csproj --urls http://localhost:5002
```

Terminal 2: APIService

```powershell
cd D:\FW\FW\BaseCore
dotnet run --project BaseCore.APIService\BaseCore.APIService.csproj --urls http://localhost:5001
```

Terminal 3: ApiGateway

```powershell
cd D:\FW\FW\BaseCore
dotnet run --project BaseCore.ApiGateway\BaseCore.ApiGateway.csproj --urls http://localhost:5000
```

Terminal 4: Frontend

```powershell
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm run dev -- --host 127.0.0.1
```

Má»Ÿ app:

```text
http://localhost:3000
```

Swagger:

- Gateway: `http://localhost:5000/swagger`
- Core API: `http://localhost:5001/swagger`
- Auth API: `http://localhost:5002/swagger`

## TÃ i Khoáº£n Demo

CÃ¡c tÃ i khoáº£n nÃ y Ä‘Æ°á»£c seed trong `BaseCore.Repository/MySqlDbContext.cs` khi migration táº¡o database:

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Admin | `admin` | `admin@volunteerhub.vn` | `admin123` |
| Organizer | `organizer` | `organizer@volunteerhub.vn` | `organizer123` |
| Sponsor | `sponsor` | `sponsor@volunteerhub.vn` | `sponsor123` |
| Volunteer | `volunteer` | `volunteer@volunteerhub.vn` | `volunteer123` |

Báº¡n cÅ©ng cÃ³ thá»ƒ Ä‘Äƒng kÃ½ tÃ i khoáº£n má»›i trá»±c tiáº¿p tá»« UI.

## Seed Data Demo

Migration máº·c Ä‘á»‹nh seed dá»¯ liá»‡u ná»n:

- 4 user demo theo role.
- Category, product cÅ© cá»§a base project.
- Skill, event category, badge.
- Má»™t sá»‘ event máº«u, work shift, channel, registration, certificate.

File `seed_data.sql` cÃ³ thÃªm dá»¯ liá»‡u demo má»Ÿ rá»™ng cho SQL Server. Cháº¡y file nÃ y sau khi database Ä‘Ã£ Ä‘Æ°á»£c táº¡o vÃ  migration Ä‘Ã£ cháº¡y.

VÃ­ dá»¥ báº±ng `sqlcmd`:

```powershell
sqlcmd -S "localhost" -d "VolunteerHub" -E -i ".\seed_data.sql"
```

Náº¿u dÃ¹ng SQL login:

```powershell
sqlcmd -S "localhost" -d "VolunteerHub" -U "sa" -P "YOUR_PASSWORD" -i ".\seed_data.sql"
```

LÆ°u Ã½: `seed_data.sql` dÃ¹ng ID cá»‘ Ä‘á»‹nh. Náº¿u database Ä‘Ã£ cÃ³ dá»¯ liá»‡u test nhiá»u láº§n, nÃªn dÃ¹ng database sáº¡ch hoáº·c kiá»ƒm tra trÃ¹ng ID trÆ°á»›c khi cháº¡y.

Reset database local vá» tráº¡ng thÃ¡i demo:

```powershell
cd D:\FW\FW\BaseCore
.\scripts\reset-demo-data.ps1 -ConfirmReset
```

Máº·c Ä‘á»‹nh script dÃ¹ng LocalDB `(localdb)\MSSQLLocalDB` vÃ  database `VolunteerHub`. CÃ³ thá»ƒ chá»‰ Ä‘á»‹nh SQL Server khÃ¡c:

```powershell
.\scripts\reset-demo-data.ps1 -Server "localhost" -Database "VolunteerHub" -ConfirmReset
```

## Kiá»ƒm Tra Build

Backend:

```powershell
cd D:\FW\FW\BaseCore
dotnet build BaseCore.sln --no-incremental
```

Frontend:

```powershell
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm run build
```

Audit package backend:

```powershell
cd D:\FW\FW\BaseCore
dotnet list BaseCore.sln package --vulnerable --include-transitive
```

## Flow Demo Nhanh

1. Login `organizer / organizer123`.
2. Táº¡o event má»›i á»Ÿ `Táº¡o sá»± kiá»‡n`.
3. Login `admin / admin123`.
4. VÃ o `Duyá»‡t sá»± kiá»‡n`, approve event.
5. Login `volunteer / volunteer123`.
6. VÃ o danh sÃ¡ch sá»± kiá»‡n, má»Ÿ event Ä‘Ã£ duyá»‡t, Ä‘Äƒng kÃ½ event.
7. Login láº¡i organizer.
8. VÃ o `Sá»± kiá»‡n cá»§a tÃ´i` -> quáº£n lÃ½ event.
9. XÃ¡c nháº­n Ä‘Äƒng kÃ½, check-in báº±ng QR cá»§a event.
10. HoÃ n thÃ nh event vÃ  xem lá»‹ch sá»­/chá»©ng chá»‰ náº¿u cÃ³.

## Ghi ChÃº Project

- `BaseCore.WebClient` lÃ  frontend chÃ­nh. CÃ¡c frontend cÅ©/thá»­ nghiá»‡m Ä‘Ã£ Ä‘Æ°á»£c dá»n khá»i repo Ä‘á»ƒ trÃ¡nh nháº§m source khi debug.
- `RubyReportService` lÃ  module backend Ruby/Sinatra Ä‘á»ƒ xuáº¥t bÃ¡o cÃ¡o CSV qua `/api/reports/*`.
- `Context/project-reading-guide.md` lÃ  living document ghi láº¡i hiá»ƒu biáº¿t vÃ  tráº¡ng thÃ¡i E2E gáº§n nháº¥t cá»§a project.
