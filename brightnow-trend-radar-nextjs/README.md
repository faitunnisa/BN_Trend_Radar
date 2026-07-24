# BrightNow Trend Radar V7 — Next.js + Supabase

Repo ini adalah functional MVP dengan **global date-range filter**. Tidak ada lagi daftar minggu yang harus ditambah manual, sehingga aplikasi dapat digunakan terus-menerus.

## Perubahan utama V7

- Filter global memakai **From Date → To Date**.
- Quick filter: Last 7 Days, Last 30 Days, This Month, dan This Quarter.
- Trend memiliki **Trend Date** (`observed_date`).
- Action memiliki **Start Date** dan **End Date**.
- Learning memiliki **Published Date**.
- Dashboard, Trend Board, Leaderboard, Action Pipeline, dan Learning Library mengikuti rentang tanggal yang dipilih.
- Action ditampilkan bila periodenya beririsan dengan rentang tanggal filter.
- Existing V6 data tetap aman melalui migration SQL.

## Fitur lain yang tetap tersedia

- Profile picker tanpa signup
- Contributor tanpa PIN
- Curator dan Admin menggunakan PIN
- Shared Supabase database
- One vote per user per trend
- Contributor dapat mengubah Trend Board status
- Curator/Admin memberikan Opportunity Score
- Trend → Action → Learning lineage
- Action Owner langsung menerbitkan learning saat action selesai
- Private avatar storage
- Admin user/division management
- Google Sheets mirror dengan retry queue

## File penting

```text
src/components/TrendRadarApp.tsx                 UI utama
src/app/api/                                     Backend API
src/lib/                                         Session, database, sync, validation
supabase/schema.sql                              Schema untuk instalasi baru
supabase/migrations/20260724_date_range_filter.sql  Migration dari V6
supabase/seed.sql                                Initial user
google-apps-script/Code.gs                       Connector Google Sheets
PANDUAN_UPDATE_V7_DATE_FILTER_ID.md              Panduan update app yang sudah online
PANDUAN_DEPLOY_ID.md                             Panduan deployment dari awal
```

## Urutan update dari V6

1. Jalankan migration SQL di Supabase.
2. Replace source code dengan repo V7.
3. Commit dan push ke GitHub.
4. Vercel deploy otomatis.
5. Update Apps Script lalu buat deployment version baru.
6. Test date filter dan existing data.

Baca `PANDUAN_UPDATE_V7_DATE_FILTER_ID.md` sebelum mengganti kode production.
