# 7. Knowledge Graph (Mức 1) — Thiết kế chi tiết

> Tài liệu **thiết kế**, chưa phải hướng dẫn cài đặt. Mục đích: mô tả đầy đủ kiến trúc, mô hình
> đồ thị, cách đồng bộ và các truy vấn gợi ý cho VolunteerHub, **trước khi** viết code.
>
> Phạm vi: **Mức 1** — thêm Neo4j như một lớp đọc bổ sung cho gợi ý & khám phá quan hệ.
> **Không** có LLM/RAG/vector DB/agent (đó là Mức 2). SQL Server vẫn là nguồn dữ liệu chính.

---

## 7.1. Mục tiêu & phạm vi

### Mục tiêu (in-scope)
1. Dựng một **đồ thị tri thức** phản ánh quan hệ giữa Tình nguyện viên ↔ Kỹ năng ↔ Sự kiện ↔ Lĩnh vực ↔ Nhà tài trợ.
2. Cung cấp **API gợi ý** dựa trên đồ thị:
   - Gợi ý **sự kiện** phù hợp cho một tình nguyện viên.
   - Gợi ý **tình nguyện viên** phù hợp cho một sự kiện (cho organizer).
   - Gợi ý **nhà tài trợ** tiềm năng cho một sự kiện (theo lĩnh vực từng tài trợ).
   - "Tình nguyện viên tương tự" / hay tham gia cùng nhau (khám phá mạng lưới).
3. **Đồng bộ một chiều** SQL Server → Neo4j, idempotent, có thể chạy lại bất kỳ lúc nào.
4. (Tùy chọn) **Trực quan hóa đồ thị** quan hệ trên UI.

### Ngoài phạm vi (out-of-scope, để Mức 2)
- Hỏi-đáp bằng ngôn ngữ tự nhiên / LLM / GraphRAG.
- Vector DB (Weaviate/Qdrant…), semantic search.
- Ghi dữ liệu trực tiếp vào graph (graph **chỉ đọc**, luôn dựng lại từ SQL).
- Suy luận ontology nâng cao (OWL/RDF). Ở Mức 1 dùng property graph đơn giản.

### Nguyên tắc thiết kế
- **SQL là nguồn sự thật duy nhất.** Neo4j là bản phái sinh; xóa sạch & dựng lại lúc nào cũng được mà không mất dữ liệu.
- **Cộng thêm, không thay thế.** Không sửa schema SQL, không đụng nghiệp vụ hiện có.
- **Tách rời (decoupled).** Nếu Neo4j sập, toàn bộ chức năng cũ của VolunteerHub vẫn chạy bình thường; chỉ mất tính năng gợi ý.
- **Idempotent.** Mọi thao tác đồng bộ dùng `MERGE` (upsert) → chạy n lần ra cùng kết quả.

---

## 7.2. Bối cảnh & quyết định kiến trúc

### Vì sao dùng graph cho phần này
Gợi ý cơ bản (theo kỹ năng/lĩnh vực) **làm được bằng SQL**. Graph thắng ở các truy vấn **đi nhiều bước quan hệ**:
- "Người từng tham gia sự kiện cùng lĩnh vực → có kỹ năng sự kiện mới cần → chưa đăng ký sự kiện đó."
- "Nhà tài trợ X từng tài trợ lĩnh vực môi trường → sự kiện môi trường sắp tới chưa có nhà tài trợ."
- "Hai tình nguyện viên hay xuất hiện trong cùng sự kiện" (đồng tham gia — co-participation).

Những truy vấn này trong SQL phải self-join nhiều tầng, khó đọc và chậm; trong Cypher là vài dòng.

### Học gì từ qKnow (tham khảo, không copy code)
qKnow (Java/Spring) là nền tảng GraphRAG doanh nghiệp. Với **Mức 1** ta **chỉ học một mảnh nhỏ** từ module `qknow-module-kg`:

| Ý tưởng từ qKnow | Áp dụng cho VolunteerHub |
|---|---|
| **Structured extraction** (DB → graph) | Mẫu thiết kế cho job đồng bộ: đọc bảng → `MERGE` node/edge, đồng bộ tăng dần (§7.5). |
| **Concept / Relation config** (ontology động) | Ta **hard-code** ontology (§7.4) cho gọn, không làm "cấu hình được". |
| **Graph visualization** | Tham khảo cách phục vụ dữ liệu đồ thị cho UI; FE dùng thư viện riêng (§7.8). |

**Bỏ hẳn** khỏi qKnow ở Mức 1: Spring AI/LLM, RAG/Weaviate, Bot/Chatflow/agent orchestration, DolphinScheduler.
Khác stack (qKnow = Java, ta = .NET) ⇒ chỉ học tư duy, tự viết bản .NET tối giản.

---

## 7.3. Kiến trúc tổng thể

```
                 ┌──────────────────────────────────────────────┐
                 │                SQL Server                     │  ← nguồn chính (đã có)
                 │  Users, Events, Skills, Registrations, ...    │
                 └───────────────┬──────────────────────────────┘
                                 │  (đọc, EF Core)
                                 ▼
        ┌─────────────────────────────────────────────┐
        │  GraphSyncWorker  (BackgroundService .NET)    │  ← MỚI
        │  • full sync (khởi tạo)                        │
        │  • incremental sync (định kỳ / theo sự kiện)  │
        └───────────────┬─────────────────────────────┘
                        │  Bolt (Neo4j.Driver)  MERGE
                        ▼
                 ┌──────────────────────────┐
                 │        Neo4j 5           │  ← MỚI (container)
                 │  property graph (chỉ đọc)│
                 └───────────┬──────────────┘
                             │  Cypher (đọc)
                             ▼
        ┌─────────────────────────────────────────────┐
        │  RecommendationController  (trong EventService│  ← MỚI
        │  hoặc service nhỏ riêng: GraphService :5005)  │
        │  GET /api/recommendations/...                 │
        └───────────────┬─────────────────────────────┘
                        │  qua ApiGateway (Ocelot)
                        ▼
                 React WebClient  →  "Gợi ý cho bạn", trang đồ thị
```

### Hai phương án đặt code (đề xuất chọn A)
- **A. Nhúng vào EventService** (đề xuất cho Mức 1): thêm `RecommendationController` + `GraphSyncWorker` vào EventService đã có. Ít hạ tầng, nhanh.
- **B. Service riêng `GraphService` (:5005)**: tách hẳn microservice mới + route Ocelot riêng. Sạch về kiến trúc, nhưng tốn công hơn — để dành khi tính năng lớn lên.

> Quyết định: **bắt đầu bằng A**, có thể tách sang B sau nếu cần.

---

## 7.4. Mô hình đồ thị (ontology)

### 7.4.1. Node (thực thể)

| Label | Nguồn SQL | Thuộc tính | Ghi chú |
|---|---|---|---|
| `:Volunteer` | `User` (UserType=TNV) + `VolunteerProfile` | `userId`(unique), `name`, `totalHours`, `kycStatus` | Chỉ user đang `IsActive` |
| `:Organizer` | `User` (UserType=Organizer) | `userId`(unique), `name` | |
| `:Sponsor` | `User` (UserType=Sponsor) | `userId`(unique), `name` | |
| `:Event` | `Event` | `eventId`(unique), `title`, `status`, `startDate`, `endDate`, `location`, `lat`, `lng`, `maxParticipants` | |
| `:Skill` | `Skill` | `skillId`(unique), `name`, `category` | |
| `:Field` | `EventCategory` | `categoryId`(unique), `name` | "Lĩnh vực" của sự kiện |
| `:Interest` *(tùy chọn)* | `VolunteerProfile.Interests` | `name`(unique) | Parse theo định dạng đang lưu (CSV/JSON) |

> **Lưu ý về vai trò:** `User.UserType` là số. Job đồng bộ cần một bảng ánh xạ `UserType → {Volunteer|Organizer|Sponsor}`
> (kết hợp với việc tồn tại `VolunteerProfile`/`SponsorProfile`/`OrganizerVerification`). Định nghĩa map này là một hằng số trong code đồng bộ.

### 7.4.2. Edge (quan hệ)

| Quan hệ | Nguồn SQL | Thuộc tính | Điều kiện |
|---|---|---|---|
| `(:Volunteer)-[:HAS_SKILL]->(:Skill)` | `VolunteerSkill` | `level`, `verified`(bool) | `verified = (VerificationStatus='Verified')` |
| `(:Volunteer)-[:PARTICIPATED]->(:Event)` | `Registration` | `hours`, `attendedAt` | `Status='Confirmed' AND IsAttended=1` |
| `(:Volunteer)-[:REGISTERED]->(:Event)` | `Registration` | `status` | mọi đăng ký (để loại trừ khi gợi ý) |
| `(:Event)-[:IN_FIELD]->(:Field)` | `Event.CategoryId` | – | |
| `(:Event)-[:NEEDS_SKILL]->(:Skill)` | `Event.RequiredSkillIds` (JSON `"[1,3]"`) | – | parse JSON, bỏ id không hợp lệ |
| `(:Event)-[:ORGANIZED_BY]->(:Organizer)` | `Event.OrganizerId` | – | |
| `(:Sponsor)-[:SPONSORED]->(:Event)` | `EventSponsor` | `type`, `amount` | |
| `(:Volunteer)-[:DONATED]->(:Event)` *(phase 2)* | `IndividualDonation`→`SupportCampaign`→Event | `amount` | `Status='Confirmed' AND IsAnonymous=0` |
| `(:Volunteer)-[:RATED]->(:Event)` *(phase 2)* | `Rating` | `score` | `IsHidden=0` |
| `(:Volunteer)-[:INTERESTED_IN]->(:Interest)` *(tùy chọn)* | `VolunteerProfile.Interests` | – | |

### 7.4.3. Sơ đồ (rút gọn — phần lõi gợi ý)

```
        HAS_SKILL              NEEDS_SKILL
 Volunteer ───────► Skill ◄─────────── Event
     │                                   │
     │ PARTICIPATED / REGISTERED         │ IN_FIELD
     └─────────────────────────────────► Event ──► Field
                                          ▲
                          SPONSORED       │  ORGANIZED_BY
                  Sponsor ────────────────┘────────► Organizer
```

### 7.4.4. Ràng buộc & chỉ mục (Neo4j)
Tạo **uniqueness constraint** (tự kèm index) cho mỗi khóa node để `MERGE` nhanh và không trùng:
```cypher
CREATE CONSTRAINT volunteer_id  IF NOT EXISTS FOR (v:Volunteer) REQUIRE v.userId    IS UNIQUE;
CREATE CONSTRAINT organizer_id  IF NOT EXISTS FOR (o:Organizer) REQUIRE o.userId    IS UNIQUE;
CREATE CONSTRAINT sponsor_id    IF NOT EXISTS FOR (s:Sponsor)   REQUIRE s.userId    IS UNIQUE;
CREATE CONSTRAINT event_id      IF NOT EXISTS FOR (e:Event)     REQUIRE e.eventId   IS UNIQUE;
CREATE CONSTRAINT skill_id      IF NOT EXISTS FOR (k:Skill)     REQUIRE k.skillId   IS UNIQUE;
CREATE CONSTRAINT field_id      IF NOT EXISTS FOR (f:Field)     REQUIRE f.categoryId IS UNIQUE;
```

---

## 7.5. Đồng bộ dữ liệu SQL → Neo4j

### 7.5.1. Hai chế độ
1. **Full sync** (khởi tạo / dựng lại): đọc toàn bộ bảng liên quan, `MERGE` tất cả node + edge, rồi **dọn rác** (xóa node/edge không còn nguồn). Dùng khi khởi động lần đầu hoặc cần rebuild.
2. **Incremental sync** (định kỳ): chỉ đồng bộ bản ghi thay đổi gần đây. Đơn giản nhất ở Mức 1: **chạy lại full sync theo lịch** (vd mỗi 15–30 phút) vì khối lượng còn nhỏ. Khi dữ liệu lớn mới tối ưu theo `UpdatedAt`/CDC.

### 7.5.2. Cơ chế idempotent (MERGE)
Mọi ghi đều là upsert. Ví dụ đồng bộ kỹ năng của tình nguyện viên (batch bằng `UNWIND`):
```cypher
UNWIND $rows AS r
  MERGE (v:Volunteer {userId: r.userId})
    SET v.name = r.name, v.totalHours = r.totalHours, v.kycStatus = r.kycStatus
  WITH v, r WHERE r.skillId IS NOT NULL
  MERGE (s:Skill {skillId: r.skillId})
  MERGE (v)-[h:HAS_SKILL]->(s)
    SET h.level = r.level, h.verified = r.verified
```

### 7.5.3. Xử lý xóa / dữ liệu cũ
`MERGE` không tự xóa cái đã biến mất ở SQL. Hai cách:
- **Đơn giản (Mức 1):** gắn `syncBatchId` (hoặc `syncedAt`) cho mọi node/edge trong một lần full sync, sau đó **xóa những gì có `syncedAt` cũ hơn lần chạy hiện tại**:
  ```cypher
  MATCH (n) WHERE n.syncedAt < $batchStartedAt DETACH DELETE n;
  ```
- **Nâng cao (sau này):** publish sự kiện domain (đăng ký mới, hủy, hoàn thành…) → cập nhật graph realtime.

### 7.5.4. Lịch & kích hoạt
- `GraphSyncWorker : BackgroundService` chạy mỗi `GRAPH_SYNC_INTERVAL_MINUTES` (mặc định 20).
- Endpoint admin thủ công: `POST /api/admin/graph/rebuild` (đầy đủ full sync, cho lúc cần ép đồng bộ).
- Khởi động: chạy `CREATE CONSTRAINT` (idempotent) → full sync lần đầu.

### 7.5.5. Khung code (minh họa thiết kế, .NET + Neo4j.Driver)
```csharp
// NuGet: Neo4j.Driver
public sealed class GraphSyncWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly IDriver _neo4j;          // singleton, đăng ký ở Program.cs
    private readonly TimeSpan _interval;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await EnsureConstraintsAsync(ct);
        while (!ct.IsCancellationRequested)
        {
            try { await RunFullSyncAsync(ct); }
            catch (Exception ex) { /* log, KHÔNG ném ra ngoài để worker sống tiếp */ }
            await Task.Delay(_interval, ct);
        }
    }

    private async Task RunFullSyncAsync(CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MySqlDbContext>();
        var batchAt = DateTime.UtcNow;

        // 1) đọc dữ liệu cần thiết từ SQL (AsNoTracking, chỉ cột cần)
        // 2) MERGE theo từng nhóm: Volunteers+Skills, Events+Field+NeedsSkill,
        //    Participation, Sponsorship... (mỗi nhóm 1 Cypher UNWIND)
        // 3) gắn syncedAt = batchAt cho node/edge vừa chạm
        // 4) DETACH DELETE node có syncedAt < batchAt   (dọn rác)
    }
}
```
> Toàn bộ ghi qua `IDriver` (singleton, thread-safe). Mỗi nhóm dùng một transaction; batch bằng `UNWIND $rows` để giảm round-trip.

---

## 7.6. Cypher — các truy vấn gợi ý

### 7.6.1. Gợi ý sự kiện cho tình nguyện viên
Ưu tiên: trùng kỹ năng sự kiện cần (×3) + cùng lĩnh vực từng tham gia (×2); loại sự kiện đã đăng ký; chỉ sự kiện sắp tới đã duyệt.
```cypher
MATCH (v:Volunteer {userId: $userId})
MATCH (e:Event {status: 'Approved'})
WHERE e.startDate > datetime() AND NOT (v)-[:REGISTERED]->(e)
OPTIONAL MATCH (v)-[:HAS_SKILL]->(s:Skill)<-[:NEEDS_SKILL]-(e)
OPTIONAL MATCH (v)-[:PARTICIPATED]->(:Event)-[:IN_FIELD]->(f:Field)<-[:IN_FIELD]-(e)
WITH e,
     count(DISTINCT s) AS skillMatch,
     count(DISTINCT f) AS fieldMatch
WHERE skillMatch + fieldMatch > 0
RETURN e.eventId AS eventId, e.title AS title,
       skillMatch, fieldMatch,
       skillMatch*3 + fieldMatch*2 AS score
ORDER BY score DESC, e.startDate ASC
LIMIT $limit
```

### 7.6.2. Gợi ý tình nguyện viên cho sự kiện (cho organizer)
```cypher
MATCH (e:Event {eventId: $eventId})
MATCH (v:Volunteer)
WHERE v.kycStatus = 'Verified' AND NOT (v)-[:REGISTERED]->(e)
OPTIONAL MATCH (v)-[:HAS_SKILL]->(s:Skill)<-[:NEEDS_SKILL]-(e)
OPTIONAL MATCH (v)-[:PARTICIPATED]->(:Event)-[:IN_FIELD]->(:Field)<-[:IN_FIELD]-(e)
WITH v, count(DISTINCT s) AS skillMatch, count(DISTINCT e) AS fieldExp, v.totalHours AS hours
RETURN v.userId AS userId, v.name AS name,
       skillMatch, hours,
       skillMatch*3 + fieldExp*1 + (CASE WHEN hours > 20 THEN 1 ELSE 0 END) AS score
ORDER BY score DESC
LIMIT $limit
```

### 7.6.3. Gợi ý nhà tài trợ cho sự kiện (theo lĩnh vực từng tài trợ)
```cypher
MATCH (e:Event {eventId: $eventId})-[:IN_FIELD]->(f:Field)
MATCH (sp:Sponsor)-[:SPONSORED]->(past:Event)-[:IN_FIELD]->(f)
WHERE NOT (sp)-[:SPONSORED]->(e)
RETURN sp.userId AS sponsorId, sp.name AS name,
       count(DISTINCT past) AS pastInField
ORDER BY pastInField DESC
LIMIT $limit
```

### 7.6.4. Tình nguyện viên hay tham gia cùng nhau (đồng tham gia)
```cypher
MATCH (v:Volunteer {userId: $userId})-[:PARTICIPATED]->(e:Event)<-[:PARTICIPATED]-(other:Volunteer)
WHERE other.userId <> $userId
RETURN other.userId AS userId, other.name AS name,
       count(DISTINCT e) AS sharedEvents
ORDER BY sharedEvents DESC
LIMIT $limit
```

---

## 7.7. Thiết kế API

Đặt trong EthuventService (phương án A), expose qua ApiGateway. Tất cả đều **GET, có auth (JWT)**.

| Method & Path | Vai trò | Mô tả | Trả về |
|---|---|---|---|
| `GET /api/recommendations/events?limit=5` | Volunteer | Sự kiện gợi ý cho chính mình (userId lấy từ token) | `[{eventId,title,score,skillMatch,fieldMatch}]` |
| `GET /api/recommendations/events/{eventId}/volunteers?limit=10` | Organizer (chủ sự kiện) | TNV gợi ý cho sự kiện | `[{userId,name,score,skillMatch,hours}]` |
| `GET /api/recommendations/events/{eventId}/sponsors?limit=10` | Organizer/Admin | Nhà tài trợ tiềm năng | `[{sponsorId,name,pastInField}]` |
| `GET /api/recommendations/volunteers/{userId}/similar?limit=10` | Volunteer/Admin | Người hay tham gia cùng | `[{userId,name,sharedEvents}]` |
| `GET /api/graph/ego/{type}/{id}?depth=1` *(tùy chọn)* | Mọi vai trò | Đồ thị quanh 1 node (cho trang trực quan hóa) | `{nodes:[...], edges:[...]}` |
| `POST /api/admin/graph/rebuild` | Admin | Ép full sync | `{status, durationMs, counts}` |
| `GET /api/admin/graph/health` | Admin | Trạng thái đồng bộ (lastSyncAt, đếm node/edge) | `{lastSyncAt, nodes, edges}` |

**Phân quyền nghiệp vụ:** endpoint `events/{eventId}/volunteers` và `.../sponsors` chỉ cho **organizer sở hữu sự kiện** (hoặc admin). Kiểm tra ownership ở controller như các API hiện có.

**Ứng xử khi Neo4j sập:** trả `200` với danh sách rỗng + cờ `degraded: true` (hoặc `503` tùy thống nhất), **không** làm vỡ trang. Tính năng gợi ý là "nice-to-have".

---

## 7.8. Frontend (React)

### Bề mặt tích hợp
- **Trang chủ Volunteer (`Home.jsx`)**: khối **"Gợi ý cho bạn"** — gọi `/api/recommendations/events`, hiển thị bằng `EventCardCompact` đã có. Nếu rỗng → ẩn khối (không hiện lỗi).
- **Trang quản lý sự kiện của Organizer**: tab/khối **"TNV phù hợp"** + **"Nhà tài trợ gợi ý"**.
- **(Tùy chọn) Trang "Mạng lưới"**: trực quan hóa đồ thị quanh một node bằng thư viện:
  - `react-force-graph` hoặc `cytoscape.js` (đề xuất cytoscape — ổn định, nhiều layout).
  - Lấy dữ liệu từ `/api/graph/ego/...`.

### Service API
Thêm vào `services/api.js`:
```js
export const recommendationApi = {
  eventsForMe:        (limit=5)      => http.get(`/api/recommendations/events?limit=${limit}`),
  volunteersForEvent: (eid,limit=10) => http.get(`/api/recommendations/events/${eid}/volunteers?limit=${limit}`),
  sponsorsForEvent:   (eid,limit=10) => http.get(`/api/recommendations/events/${eid}/sponsors?limit=${limit}`),
  similarVolunteers:  (uid,limit=10) => http.get(`/api/recommendations/volunteers/${uid}/similar?limit=${limit}`),
};
```

Giữ đúng phong cách thiết kế ấm (warm tokens) hiện tại; khối gợi ý có tiêu đề + lý do ("Vì bạn có kỹ năng X / từng tham gia lĩnh vực Y").

---

## 7.9. Hạ tầng & Docker

### Thêm vào `docker-compose.yml`
```yaml
  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_server_memory_heap_max__size: 512m       # ghì RAM cho máy nhỏ
      NEO4J_server_memory_pagecache_size: 256m
    volumes:
      - neo4j_data:/data
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:7474 >/dev/null 2>&1 || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    networks: [volunteerhub]
    # KHÔNG publish cổng ra ngoài ở production (7474/7687 chỉ dùng nội bộ).
    # Khi cần xem Neo4j Browser lúc dev mới mở: ports: ["7474:7474","7687:7687"]

# volumes: thêm  neo4j_data:
```

### Biến môi trường mới (`.env`)
```
NEO4J_PASSWORD=Vhub2026Neo4j@Pass
```

### EventService nhận thêm env
```
Neo4j__Uri=bolt://neo4j:7687
Neo4j__User=neo4j
Neo4j__Password=${NEO4J_PASSWORD}
Graph__SyncIntervalMinutes=20
```

### `depends_on`
EventService thêm `neo4j: { condition: service_healthy }` (worker đồng bộ chỉ chạy khi Neo4j sẵn sàng — nhưng vẫn phải chịu lỗi nếu Neo4j sập giữa chừng).

---

## 7.10. Bảo mật & quyền riêng tư

- **Tối thiểu hóa PII trong graph:** chỉ đưa `userId`, `name` (đã hiển thị công khai), thống kê. **Không** đưa email/phone/CCCD/ảnh KYC/địa chỉ vào Neo4j.
- **Quyên góp ẩn danh:** chỉ tạo `:DONATED` khi `IsAnonymous=0`; người ẩn danh không xuất hiện như node quyên góp.
- **Auth bắt buộc** trên mọi endpoint gợi ý; kiểm tra **ownership** với endpoint của organizer.
- **Không expose cổng Neo4j** ra Internet ở production (chỉ mạng nội bộ Docker).
- **Mật khẩu Neo4j** trong `.env`, không hardcode. Đổi mật khẩu Neo4j → giống SQL Server, phải `down -v` volume `neo4j_data` (mật khẩu chỉ đặt lúc khởi tạo).
- Neo4j là dữ liệu **phái sinh** → có thể xóa & rebuild bất kỳ lúc nào; không cần backup riêng (backup SQL là đủ).

---

## 7.11. Hiệu năng

- **Constraint = index**: mọi `MERGE`/match theo khóa node đều dùng index → O(log n).
- **Batch bằng `UNWIND $rows`**: gom nhiều bản ghi trong một câu Cypher, giảm round-trip.
- **Full sync định kỳ** chấp nhận được khi dữ liệu nhỏ (vài nghìn node). Khi lớn (>100k) → chuyển incremental theo `UpdatedAt` hoặc event-driven.
- **Cache kết quả gợi ý** (tùy chọn) vào **Redis** (đã có sẵn) với TTL ngắn (vd 5–10 phút) để giảm tải Neo4j cho trang chủ.
- Giới hạn `depth` của truy vấn đồ thị (ego graph) để tránh truy vấn lan rộng.

---

## 7.12. Lộ trình triển khai (phases)

| Phase | Nội dung | Kết quả |
|---|---|---|
| **0. Hạ tầng** | Thêm Neo4j vào compose, đăng ký `IDriver` ở EventService, tạo constraint | Neo4j chạy + kết nối được |
| **1. Đồng bộ lõi** | `GraphSyncWorker`: Volunteer, Skill, Event, Field + HAS_SKILL/PARTICIPATED/REGISTERED/IN_FIELD/NEEDS_SKILL; full sync + dọn rác | Graph phản ánh đúng SQL |
| **2. Gợi ý sự kiện** | API `/recommendations/events` + Cypher §7.6.1 + khối UI trang chủ | TNV thấy "Gợi ý cho bạn" |
| **3. Gợi ý cho organizer** | Sponsor + EventSponsor vào graph; API volunteers/sponsors cho sự kiện | Organizer thấy gợi ý TNV/nhà tài trợ |
| **4. Khám phá mạng lưới** *(tùy chọn)* | RATED/DONATED; API similar + ego graph; trang trực quan hóa | Xem quan hệ trực quan |
| **5. Tinh chỉnh** | Cache Redis, recall test, chỉnh trọng số điểm | Gợi ý nhanh & hợp lý hơn |

---

## 7.13. Kiểm thử & nghiệm thu

- **Đối chiếu đếm**: sau full sync, số `:Volunteer`/`:Event`/`:Skill` khớp số bản ghi hợp lệ trong SQL.
- **Idempotent**: chạy sync 2 lần liên tiếp → số node/edge không đổi.
- **Dọn rác**: hủy một đăng ký trong SQL → sau sync, edge `:REGISTERED`/`:PARTICIPATED` tương ứng biến mất.
- **Chính xác gợi ý**: dựng case mẫu (TNV có kỹ năng A, sự kiện cần A) → phải xuất hiện trong top.
- **Khả chịu lỗi**: tắt container Neo4j → trang chủ vẫn load, khối gợi ý ẩn/thông báo nhẹ, các chức năng khác bình thường.
- **Phân quyền**: organizer không sở hữu sự kiện gọi API gợi ý TNV của sự kiện đó → bị từ chối.

---

## 7.14. Ước lượng công sức & rủi ro

| Hạng mục | Công sức | Ghi chú |
|---|---|---|
| Neo4j vào compose + DI driver | Thấp | vài chục dòng |
| GraphSyncWorker (đồng bộ + dọn rác) | **Trung bình–cao** | phần tốn công nhất; cần map UserType, parse RequiredSkillIds, Interests |
| API gợi ý + Cypher | Thấp–TB | logic gọn |
| UI khối gợi ý | Thấp | tái dùng card có sẵn |
| Trực quan hóa đồ thị *(tùy chọn)* | TB | thêm thư viện FE |

**Rủi ro & giảm thiểu:**
- *Lệch dữ liệu graph vs SQL* → full sync định kỳ + dọn rác theo `syncedAt`; có nút rebuild thủ công.
- *Neo4j ngốn RAM trên máy nhỏ* → ghì heap/pagecache (§7.9); Neo4j Community đủ cho Mức 1.
- *Định dạng `Interests`/`RequiredSkillIds` không nhất quán* → parse phòng thủ, bỏ qua giá trị lỗi, log cảnh báo.
- *Phình phạm vi sang Mức 2* → giữ kỷ luật: Mức 1 tuyệt đối không LLM/vector.

---

## 7.15. Phụ lục — Từ điển node/edge (tóm tắt)

```
Nodes:  Volunteer{userId,name,totalHours,kycStatus}
        Organizer{userId,name}
        Sponsor{userId,name}
        Event{eventId,title,status,startDate,endDate,location,lat,lng,maxParticipants}
        Skill{skillId,name,category}
        Field{categoryId,name}
        Interest{name}                      (tùy chọn)

Edges:  (Volunteer)-[:HAS_SKILL{level,verified}]->(Skill)
        (Volunteer)-[:PARTICIPATED{hours,attendedAt}]->(Event)
        (Volunteer)-[:REGISTERED{status}]->(Event)
        (Event)-[:IN_FIELD]->(Field)
        (Event)-[:NEEDS_SKILL]->(Skill)
        (Event)-[:ORGANIZED_BY]->(Organizer)
        (Sponsor)-[:SPONSORED{type,amount}]->(Event)
        (Volunteer)-[:DONATED{amount}]->(Event)       (phase 2)
        (Volunteer)-[:RATED{score}]->(Event)          (phase 2)
        (Volunteer)-[:INTERESTED_IN]->(Interest)      (tùy chọn)

Mọi node/edge mang thêm: syncedAt  (phục vụ dọn rác)
```

---

*Tài liệu này là bản thiết kế Mức 1. Khi thống nhất, bước tiếp theo là hiện thực hóa theo lộ trình §7.12 — bắt đầu từ Phase 0 (hạ tầng) và Phase 1 (đồng bộ lõi).*
