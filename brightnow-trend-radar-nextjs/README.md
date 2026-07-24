# BrightNow Trend Radar — Next.js + Supabase

Repo ini adalah versi functional MVP dari prototype V6.

## Yang sudah tersedia

- Next.js App Router
- API backend menggunakan Next.js Route Handlers
- Supabase sebagai database bersama
- Profile picker tanpa signup
- Contributor masuk tanpa PIN
- Curator dan Admin menggunakan PIN
- Secure session cookie
- One vote per user per trend
- Contributor dapat menentukan dan mengubah Trend Board status
- Curator/Admin dapat memberikan Opportunity Score
- Contributor dapat membuat dan mengedit Action Pipeline
- Action memiliki Source Trend
- Hanya Action Owner yang dapat menyelesaikan action
- Saat action diselesaikan, learning langsung terbit
- Upload profile picture ke private Supabase Storage
- Admin mengelola users dan divisions
- Google Sheets mirror dengan retry queue
- UI mengikuti prototype V6 dengan sidebar kiri dan logo BrightNow

## File penting

```text
src/components/TrendRadarApp.tsx   UI utama
src/app/api/                       Backend API
src/lib/                           Session, Supabase, sync, validation
supabase/schema.sql                Struktur database
supabase/seed.sql                  User awal dan demo PIN
google-apps-script/Code.gs         Google Sheets connector
PANDUAN_DEPLOY_ID.md               Panduan klik-per-klik
.env.example                       Daftar secret yang perlu diisi
```

## Demo login setelah seed.sql

- Fathiya — Admin — PIN `1234`
- Tia — Curator — PIN `2468`
- Contributor lain tidak menggunakan PIN

Ganti PIN setelah aplikasi berhasil online.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Build check

```bash
npm run typecheck
npm run build
```

## Catatan keamanan

- `SUPABASE_SECRET_KEY` hanya digunakan di server.
- Jangan menambahkan awalan `NEXT_PUBLIC_` pada secret key.
- Jangan upload `.env.local` ke GitHub.
- Browser tidak mengakses tabel Supabase secara langsung.
- Contributor tanpa PIN cocok untuk trusted internal squad, bukan strong authentication.
- Untuk penggunaan bisnis resmi, periksa plan Vercel yang sesuai.
