# Backlog & Migration Roadmap (TODO)

Dokumentasi komprehensif rencana migrasi, standardisasi arsitektur Next.js 16 Modular Monolith, dan konsolidasi seluruh dashboard operasional PT Advantage SCM ke dalam satu repository terpadu (`adv_dashboard`).

---

## 1. Migrasi Penuh Modul IT & DCT Helpdesk (Primary & Default Dashboard)
- **Kategori**: Feature Migration / Fullstack
- **Prioritas**: High
- **Status**: Ready for Implementation (Default Module)
- **Latar Belakang**:
  Modul IT & DCT Helpdesk saat ini masih berjalan di repository terpisah (`WISECON_DASHBOARD.HELPDESK`). Modul ini ditetapkan sebagai dashboard default aplikasi pada rute `/dashboard/helpdesk`. Saat ini baru berupa halaman antarmuka stub pada PoC awal dan perlu dimigrasikan secara penuh tanpa ada fitur yang tertinggal.
- **Rencana Implementasi**:
  - Salin dan sesuaikan business logic, query PostgreSQL schema `helpdesk.*`, dan tipe data dari `WISECON_DASHBOARD.HELPDESK/src/features/` ke `src/features/helpdesk/`.
  - Bangun rute operasional fungsional:
    - `/dashboard/helpdesk` (Overview, status tiket, ringkasan FSD & SLA).
    - `/dashboard/helpdesk/tickets` (Manajemen tiket, filter status, pencarian, dan assignment).
    - `/dashboard/helpdesk/performance` (Analisis kepatuhan SLA, waktu resolusi, dan matriks produktivitas teknisi).
    - `/dashboard/helpdesk/attendance` (Rekapitulasi absensi dan aktivitas harian tim helpdesk).
  - Hubungkan seluruh query helpdesk ke connection pool PostgreSQL bersama di `src/lib/db.ts`.
  - Pastikan menu navigasi Helpdesk di `src/lib/menu-list.ts` aktif secara default ketika membuka dashboard.

---

## 2. Penyempurnaan & Validasi Data Live Modul IT Asset & PM
- **Kategori**: Feature Polish & Quality Assurance
- **Prioritas**: High
- **Status**: In Progress (PoC Completed)
- **Latar Belakang**:
  Seluruh 8 sub-menu PM Asset IT (`overview`, `asset-distribution`, `cost-maintenance-budget`, `comparison`, `finding-asset-lifecycle`, `asset-purchasing`, `device-requests`, `warehouse-stock`) telah berhasil diintegrasikan ke rute `/dashboard/asset-maintenance/*`. Perlu dilakukan validasi konsistensi filter dan penyesuaian dependensi komponen.
- **Rencana Implementasi**:
  - Verifikasi seluruh pemanggilan data live dari schema `pm_asset_it` agar tidak terjadi anomali query atau filter stale.
  - Periksa navigasi modal detail (seperti `MonthlyCellDetailModal` dan `FeedbackDetailModal`) agar tetap responsif pada struktur rute baru.
  - Pastikan filter global (Tahun, Bulan, Site, Perusahaan) di navbar bekerja mulus khusus saat modul Asset Maintenance aktif.

---

## 3. Migrasi Unified Access Management & User Directory
- **Kategori**: Auth, Security & User Management
- **Prioritas**: High
- **Status**: Backlog
- **Latar Belakang**:
  Akses pengguna ke dashboard saat ini dikelola melalui schema `helpdesk.access_user` dan `helpdesk.access_role`. Modul manajemen hak akses ini harus dapat diakses oleh administrator langsung di dalam dashboard terpadu tanpa bergantung pada service backend eksternal.
- **Rencana Implementasi**:
  - Bangun rute `/dashboard/access-management` (Users, Roles, dan Audit Logs).
  - Pindahkan CRUD logic manajemen user dan hak akses ke Server Actions / API Routes Next.js 16.
  - Hubungkan fungsi otorisasi `resolveUserAccessProfile` di `src/lib/auth/user-provider.ts` dengan penegakan granular role permissions dan pembatasan site/cabang (`dataScope`).

---

## 4. Migrasi PIC Monitoring Dashboard
- **Kategori**: Feature Migration / Operations
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard PIC Monitoring saat ini berjalan terpisah di port 5705. Dashboard ini memantau penugasan, rute, dan aktivitas operasional PIC di lapangan.
- **Rencana Implementasi**:
  - Buat folder domain `src/features/pic-monitoring/` mencakup services, types, dan components.
  - Buat rute halaman di `/dashboard/pic-monitoring`.
  - Pindahkan koneksi query database terkait ke shared DB client.
  - Perbarui target link di `BrowseDashboardModal.tsx` ke rute in-app `/dashboard/pic-monitoring`.

---

## 5. Migrasi Bug & Issue Tracker Dashboard
- **Kategori**: Feature Migration / IT Support
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard Bug & Issue Tracker berjalan di port 5710 untuk pencatatan dan pelacakan bug teknis aplikasi internal.
- **Rencana Implementasi**:
  - Buat domain `src/features/bug-tracker/` dan rute `/dashboard/bug-tracker`.
  - Terapkan guard izin khusus (hanya role IT Admin / IT Product yang dapat mengakses sesuai aturan katalog).
  - Porting kanban board / issue list components ke standar Tailwind CSS v4.

---

## 6. Migrasi Learning & Growth Dashboard
- **Kategori**: Feature Migration / HR & Training
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard Learning & Growth berjalan di port 5706 untuk memantau program pelatihan, kompetensi, dan sertifikasi karyawan.
- **Rencana Implementasi**:
  - Buat domain `src/features/learning-growth/` dan rute `/dashboard/learning-growth`.
  - Migrasikan visualisasi pencapaian materi, skor training, dan analitik progress peserta.
  - Sambungkan ke database atau skema terkait pelatihan.

---

## 7. Migrasi Server Performance Dashboard
- **Kategori**: Feature Migration / IT Infrastructure
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard Server Performance berjalan di port 5707 untuk monitoring metrik server fisik/VM (CPU, RAM, Storage, Uptime).
- **Rencana Implementasi**:
  - Buat domain `src/features/server-performance/` dan rute `/dashboard/server-performance`.
  - Integrasikan visualisasi time-series grafik performa server dan alarm threshold pemakaian resource.

---

## 8. Migrasi Network Performance Dashboard
- **Kategori**: Feature Migration / IT Infrastructure
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard Network Performance berjalan di port 5708 untuk memantau status link koneksi cabang, latensi, dan availability jaringan VPN/SD-WAN.
- **Rencana Implementasi**:
  - Buat domain `src/features/network-performance/` dan rute `/dashboard/network-performance`.
  - Porting visualisasi uptime jaringan antar cabang dan indikator status koneksi per region.

---

## 9. Migrasi Process & Risk Management Dashboard
- **Kategori**: Feature Migration / Audit & Compliance
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard Process & Risk berjalan di port 5709 untuk monitoring kepatuhan SOP, mitigasi risiko operasional, dan temuan audit.
- **Rencana Implementasi**:
  - Buat domain `src/features/process-risk/` dan rute `/dashboard/process-risk`.
  - Integrasikan matriks penilaian risiko (Risk Heatmap) dan pelacakan status tindak lanjut mitigasi.

---

## 10. Migrasi Overtime Analytics Dashboard
- **Kategori**: Feature Migration / HR & Operational Cost
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard Overtime berjalan di port 5711 untuk analisis biaya dan jam lembur karyawan operasional di seluruh cabang.
- **Rencana Implementasi**:
  - Buat domain `src/features/overtime/` dan rute `/dashboard/overtime`.
  - Pindahkan kalkulasi agregasi jam lembur per divisi dan per cabang ke service terisolasi.

---

## 11. Migrasi IT Repair & Maintenance Dashboard
- **Kategori**: Feature Migration / Asset Maintenance
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard IT Repair & Maintenance berjalan di port 5712 untuk pencatatan detail perbaikan hardware, pergantian suku cadang, dan vendor service.
- **Rencana Implementasi**:
  - Buat domain `src/features/it-repair-maintenance/` dan rute `/dashboard/it-repair-maintenance`.
  - Integrasikan alur riwayat perbaikan dengan master aset yang sudah ada di PM Asset IT.

---

## 12. Migrasi Kaldev Performance Dashboard
- **Kategori**: Feature Migration / Software Engineering
- **Prioritas**: Low
- **Status**: Backlog
- **Latar Belakang**:
  Dashboard Kaldev Performance mencatat metrik produktivitas tim pengembang internal, commit git, dan milestone rilis aplikasi.
- **Rencana Implementasi**:
  - Buat domain `src/features/kaldev-performance/` dan rute `/dashboard/kaldev-performance`.
  - Hubungkan integrasi webhook atau database aktivitas repositori pengembang.

---

## 13. Granular Suspense Boundaries & Widget-Level Streaming
- **Kategori**: Performance / UX
- **Prioritas**: Medium
- **Status**: Backlog
- **Latar Belakang**:
  Pada modul dengan pemrosesan analitik berat, membungkus seluruh halaman dalam satu loading skeleton tingkat halaman memperlambat waktu rendering widget-widget ringan.
- **Rencana Implementasi**:
  - Pecah batas `<Suspense>` ke level widget/kartu individual menggunakan React Server Components.
  - Tampilkan KPI card utama dan chart ringkasan secara instan, sementara tabel detail besar melakukan streaming di latar belakang.
