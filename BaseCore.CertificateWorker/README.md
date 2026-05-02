# BaseCore Certificate Worker

Rust background worker for VolunteerHub certificate PDF generation.

The .NET API creates `Certificates` and enqueues `CertificateJobs`. This worker polls pending jobs, generates a PDF with a QR verification matrix, stores it under the API `wwwroot/certificates` folder, and updates `Certificates.PdfUrl`.

## Setup

Install Rust first:

```powershell
winget install Rustlang.Rustup
```

Open a new terminal, then create a local `.env` file:

```powershell
cd D:\FW\FW\BaseCore\BaseCore.CertificateWorker
copy .env.example .env
cargo run
```

For LocalDB development, use the `sqlcmd:` connection mode in `.env`. The worker still generates certificates in Rust, and uses `sqlcmd` only as the database bridge because LocalDB exposes a named-pipe connection.
