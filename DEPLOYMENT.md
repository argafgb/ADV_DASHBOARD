# Deployment Guide & Architecture

Panduan komprehensif setup arsitektur, konfigurasi CI/CD Gitea Actions, Docker Compose orchestration, dan routing reverse proxy Caddy untuk repository **Advantage Unified Operations Dashboard** (Next.js 16 Modular Monolith).

---

## 1. Arsitektur Deployment

Deployment menggunakan arsitektur Docker Compose terisolasi yang terhubung ke jaringan edge (`dev-net` / `prod-net`) dengan Caddy Gateway sebagai Edge Reverse Proxy dan SSL Terminator.

```
[ Internet / Browser ]
          │ (HTTPS : 443)
          ▼
[ Caddy Gateway (caddy_proxy) ]
          │
          └──> (HTTP : 3000) reverse_proxy <IMAGE_NAME>-<STAGE>:3000
               [ Web Container: Node 22 Alpine, Next.js Standalone Runner ]
                     │
                     ├──> (stage-net) postgres-<STAGE>:5432 (Shared PostgreSQL Database)
                     └──> (external)  SQL Server ADV LIVE (Kredensial Login & Master Karyawan)
```

### Karakteristik Utama:

- **Single Fullstack Container**: Frontend, API Routes, dan Server Components dibundel ke dalam single container menggunakan Next.js `output: "standalone"` di port 3000.
- **Unified Modular Routing**: Satu domain melayani seluruh modul operasional (`/dashboard/asset-maintenance/*`, `/dashboard/helpdesk/*`, `/login`, `/api/auth/*`).
- **Symmetric JWT Session**: Autentikasi sesi menggunakan token JWT HS256 yang ditandatangani dan diverifikasi langsung secara in-code.
- **Rollback Instan**: Setiap deployment menggunakan tag commit SHA (`dev-<sha>` atau `prod-<sha>`) sehingga dapat di-rollback secara instan menggunakan script infra.

---

## 2. Struktur File Deployment

```
.
├── .gitea/
│   └── workflows/
│       ├── development.yaml    — pipeline CI/CD branch development (build, deploy, reload caddy)
│       └── production.yaml     — pipeline CI/CD branch main (build, deploy, reload caddy)
├── .deploy/
│   └── compose.yaml            — Docker Compose stack definition (Next.js web service)
├── Dockerfile                  — Multi-stage build (deps -> builder -> runner standalone)
└── .dockerignore               — Filter berkas build Docker
```

---

## 3. Konfigurasi Gitea Repository

Buka repository di Gitea, masuk ke **Settings -> Actions -> Variables & Secrets**.

### A. Variables (Gitea -> Settings -> Variables)

| Variable Name                | Deskripsi                                                    | Contoh Nilai                                               |
| :--------------------------- | :----------------------------------------------------------- | :--------------------------------------------------------- |
| `IMAGE_NAME`                 | Identifier unik stack / container                            | `adv-dashboard`                                            |
| `DEPLOY_INFRA_DIR` _(Org)_   | Lokasi direktori infra di server (default: `/opt/infra`)     | `/opt/infra` _(opsional)_                                  |
| `DEV_WEB_DOMAIN`             | Host domain Web (Dev)                                        | `dashboard-dev.product.adv.my.id`                          |
| `PROD_WEB_DOMAIN`            | Host domain Web (Prod)                                       | `dashboard.advantagescm.com`                               |

### B. Secrets (Gitea -> Settings -> Secrets)

#### Global Secrets (Org Level)

- `REGISTRY_URL`: URL Docker Registry (e.g. `registry.adv.my.id`)
- `REGISTRY_USERNAME` & `REGISTRY_PASSWORD`: Kredensial push/pull registry
- `DEPLOY_HOSTNAME`, `DEPLOY_PORT`, `DEPLOY_USERNAME`, `DEPLOY_SSH_KEY`: Kredensial SSH host deploy

#### Repository Secrets

| Secret Name                                            | Deskripsi                                                          |
| :----------------------------------------------------- | :----------------------------------------------------------------- |
| `DEV_PG_DATABASE_URL` / `PROD_PG_DATABASE_URL`         | Connection URI Postgres (`postgresql://user:pass@host:5432/db`)   |
| `DEV_MSSQL_DATABASE_URL` / `PROD_MSSQL_DATABASE_URL`   | Connection string SQL Server ADV LIVE                              |
| `DEV_JWT_SECRET` / `PROD_JWT_SECRET`                   | Secret key symmetric JWT (min 32 chars)                            |
| `DEV_REVALIDATE_SECRET` / `PROD_REVALIDATE_SECRET`     | Webhook revalidation secret                                        |

---

## 4. Rollback Deployment

Setiap rilis menghasilkan tag commit SHA (`dev-<sha>` atau `prod-<sha>`) dan menyimpan konfigurasi env di `/opt/infra/deployments/<APP>-<STAGE>/.env`.

Untuk rollback cepat ke versi commit tertentu di server:

```sh
/opt/infra/bin/app-rollback.sh adv-dashboard-dev dev-abc1234
```

---

## 5. Teardown / Menghapus Aplikasi

Untuk menghentikan aplikasi, menghapus folder deployment, dan mencabut route Caddy:

```sh
/opt/infra/bin/app-remove.sh adv-dashboard-dev
```

---

## 6. Pengujian Docker Lokal

```sh
docker build -t adv-dashboard:local .
docker run --rm -p 3000:3000 --env-file .env adv-dashboard:local
```
Buka `http://localhost:3000` di browser.
