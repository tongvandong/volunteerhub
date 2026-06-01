# Rust certificate worker. On Linux it talks to SQL Server over TCP via tiberius
# (DATABASE_URL = ADO.NET style string with SQL auth — NOT the sqlcmd: LocalDB path).
# Build context MUST be the repository root.
#
#   docker build -f deploy/certificateworker.Dockerfile -t volunteerhub-certworker .

FROM rust:1-bookworm AS build
WORKDIR /src
COPY BaseCore.CertificateWorker/Cargo.toml ./BaseCore.CertificateWorker/Cargo.toml
COPY BaseCore.CertificateWorker/Cargo.lock ./BaseCore.CertificateWorker/Cargo.lock
COPY BaseCore.CertificateWorker/src ./BaseCore.CertificateWorker/src
WORKDIR /src/BaseCore.CertificateWorker
RUN cargo build --release

FROM debian:bookworm-slim AS final
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/BaseCore.CertificateWorker/target/release/basecore-certificate-worker /usr/local/bin/certificate-worker
ENV CERTIFICATE_OUTPUT_DIR=/data/certificates \
    CERTIFICATE_PUBLIC_BASE_URL=/certificates \
    RUST_LOG=info
ENTRYPOINT ["certificate-worker"]
