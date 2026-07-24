# Panduan Deployment untuk Non-Technical User

Panduan ini dibuat supaya kamu bisa mengikuti prosesnya tanpa background IT.

---

# Gambaran Besar

Ada empat tempat yang akan kita gunakan:

1. **Folder repo**  
   Berisi seluruh kode aplikasi.

2. **Supabase**  
   Tempat data bersama disimpan.  
   Contoh: user, trend, vote, action, learning, dan profile picture.

3. **GitHub**  
   Tempat menyimpan kode secara online.

4. **Vercel**  
   Tempat aplikasi dijalankan dan mendapatkan link website.

Google Sheets bersifat tambahan sebagai mirror atau rekap.

Alurnya:

```text
Team membuka link Vercel
        ↓
Next.js memproses request
        ↓
Data disimpan di Supabase
        ↓
Salinan dikirim ke Google Sheets
```

---

# Bagian A — Siapkan Folder

1. Download ZIP repo.
2. Double-click ZIP untuk extract.
3. Pastikan folder hasil extract bernama:

```text
brightnow-trend-radar-nextjs
```

4. Jangan menghapus file atau folder di dalamnya.

---

# Bagian B — Buat Supabase Project

## B1. Membuat project

1. Buka Supabase.
2. Login atau buat account.
3. Klik **New Project**.
4. Pilih organization.
5. Isi:
   - Project name: `brightnow-trend-radar`
   - Database password: buat password yang kuat
   - Region: pilih yang paling dekat dengan Indonesia, bila tersedia
6. Simpan database password di password manager.
7. Klik **Create new project**.
8. Tunggu sampai project selesai dibuat.

## B2. Membuat tabel database

1. Dari sidebar Supabase, pilih **SQL Editor**.
2. Klik **New query**.
3. Di folder repo, buka:

```text
supabase/schema.sql
```

4. Select All dan Copy seluruh isinya.
5. Paste ke SQL Editor.
6. Klik **Run**.
7. Tunggu sampai muncul notifikasi success.

File ini otomatis membuat:

- Divisions
- App users
- Sessions
- Trends
- Votes
- Status history
- Opportunity scores
- Actions
- Learnings
- Google Sheets sync queue
- Private avatar bucket

## B3. Memasukkan user awal

1. Di SQL Editor, klik **New query** lagi.
2. Buka:

```text
supabase/seed.sql
```

3. Copy seluruh isinya.
4. Paste ke SQL Editor.
5. Klik **Run**.

User awal:

- Fathiya — Admin — PIN `1234`
- Tia — Curator — PIN `2468`
- Nala — Contributor
- Rara — Contributor
- Dinda — Contributor
- Kahleav — Contributor

User dan division dapat diedit lagi melalui aplikasi setelah deployment.

## B4. Mengecek apakah database berhasil

1. Buka **Table Editor**.
2. Kamu harus melihat tabel seperti:
   - `app_users`
   - `trends`
   - `actions`
   - `learnings`
3. Klik `app_users`.
4. Pastikan nama user awal sudah muncul.
5. Buka **Storage**.
6. Pastikan ada bucket bernama `avatars`.

## B5. Mengambil Supabase URL dan Secret Key

1. Buka **Settings** di sidebar Supabase.
2. Pilih **API Keys**.
3. Copy:
   - Project URL
   - Secret key yang diawali `sb_secret_`
4. Simpan sementara di tempat aman.

Jangan:

- Mengirim secret key melalui chat grup.
- Menaruh key di slide.
- Menaruh key di file source code.
- Memberi nama key dengan awalan `NEXT_PUBLIC_`.

---

# Bagian C — Hubungkan Google Sheets

Bagian ini bisa dilakukan setelah deployment, tetapi lebih mudah disiapkan sekarang.

## C1. Membuat Sheet

1. Buat Google Sheet baru.
2. Ganti nama menjadi:

```text
BrightNow Trend Radar Database
```

Tidak perlu membuat kolom manual.

## C2. Memasang Apps Script

1. Dari Google Sheet, klik **Extensions**.
2. Pilih **Apps Script**.
3. Hapus code default.
4. Buka file repo:

```text
google-apps-script/Code.gs
```

5. Copy seluruh isi.
6. Paste ke Apps Script.
7. Klik ikon **Save**.

## C3. Deploy Apps Script

1. Klik tombol **Deploy**.
2. Pilih **New deployment**.
3. Pada Select type, pilih **Web app**.
4. Isi:
   - Description: `BrightNow Trend Radar Connector`
   - Execute as: `Me`
   - Who has access: pilih akses yang diizinkan kebijakan perusahaan
5. Klik **Deploy**.
6. Google mungkin meminta authorization.
7. Selesaikan proses authorization.
8. Copy **Web app URL**.

URL yang benar berakhir dengan:

```text
/exec
```

Simpan URL ini. Nanti dimasukkan ke Vercel.

---

# Bagian D — Jadikan Folder Sebagai Git Repository

Repo yang kamu download sudah dapat dijadikan Git repository.

Cara paling visual adalah memakai **GitHub Desktop**.

## D1. Install GitHub Desktop

1. Install GitHub Desktop.
2. Buka aplikasinya.
3. Login menggunakan akun GitHub.
4. Pilih akun atau organization yang akan memiliki repository.

## D2. Tambahkan folder repo

1. Di GitHub Desktop, klik **File**.
2. Klik **Add Local Repository**.
3. Klik **Choose**.
4. Pilih folder:

```text
brightnow-trend-radar-nextjs
```

5. Klik **Add Repository**.

Folder yang diberikan sudah disiapkan sebagai Git repository, sehingga GitHub Desktop seharusnya dapat membacanya.

## D3. Publish ke GitHub

1. Klik **Publish repository**.
2. Name:

```text
brightnow-trend-radar
```

3. Centang **Keep this code private**.
4. Pilih organization bila repository harus dimiliki perusahaan.
5. Klik **Publish Repository**.
6. Tunggu sampai selesai.

## D4. Cara update kode nanti

Setelah ada perubahan file:

1. Buka GitHub Desktop.
2. Isi Summary, contoh:

```text
Update Trend Radar
```

3. Klik **Commit to main**.
4. Klik **Push origin**.

Vercel akan deploy ulang secara otomatis.

---

# Bagian E — Deploy di Vercel

> **Catatan plan:** Vercel Hobby gratis hanya ditujukan untuk personal/non-commercial use. Untuk aplikasi internal BrightNow, gunakan Vercel perusahaan, Pro, Enterprise, atau Pro trial yang disetujui perusahaan. Langkah teknis deployment-nya tetap sama.


## E1. Import repository

1. Login ke Vercel.
2. Klik **Add New**.
3. Klik **Project**.
4. Hubungkan GitHub bila belum terhubung.
5. Cari repository:

```text
brightnow-trend-radar
```

6. Klik **Import**.

Vercel akan mendeteksi framework sebagai Next.js.

Jangan klik Deploy dulu sebelum environment variables selesai.

## E2. Isi Environment Variables

Cari bagian **Environment Variables**.

Masukkan satu per satu:

### Variable 1

Name:

```text
SUPABASE_URL
```

Value:

```text
Project URL dari Supabase
```

### Variable 2

Name:

```text
SUPABASE_SECRET_KEY
```

Value:

```text
Secret key Supabase yang diawali sb_secret_
```

### Variable 3

Name:

```text
SESSION_COOKIE_NAME
```

Value:

```text
bn_session
```

### Variable 4

Name:

```text
GOOGLE_SHEETS_WEBHOOK_URL
```

Value:

```text
Apps Script URL yang berakhir /exec
```

Variable Google Sheets boleh dikosongkan sementara bila connector belum dibuat.

Untuk setiap variable, aktifkan minimal:

- Production
- Preview

## E3. Deploy

1. Setelah environment variables terisi, klik **Deploy**.
2. Tunggu proses build.
3. Jika berhasil, akan muncul halaman Congratulations.
4. Klik **Visit**.

Link aplikasi kira-kira berbentuk:

```text
https://brightnow-trend-radar-xxxx.vercel.app
```

---

# Bagian F — First Login dan Test

## F1. Test Admin

1. Buka link Vercel.
2. Pilih profil `Fathiya`.
3. Masukkan PIN:

```text
1234
```

4. Pastikan Dashboard terbuka.

## F2. Ganti data master

Dari sidebar:

1. Buka **Team Members**.
2. Edit nama, division, dan role.
3. Tambahkan semua anggota BrightNow Squad.
4. Nonaktifkan user dummy yang tidak dibutuhkan.
5. Ganti PIN Admin dan Curator.

## F3. Test Contributor

1. Klik **Switch Profile**.
2. Pilih contributor.
3. Pastikan contributor bisa:
   - Submit trend
   - Memilih board status
   - Upvote
   - Membuat action
   - Mengedit action
4. Pastikan contributor tidak melihat menu Master Admin.

## F4. Test Curator

1. Switch ke profil Curator.
2. Masukkan PIN.
3. Buka Trend Detail.
4. Pastikan tombol Opportunity Score terlihat.

## F5. Test Action dan Learning

1. Buat trend.
2. Klik **Turn into action**.
3. Pilih Action Owner.
4. Switch ke profil Action Owner.
5. Buka Action Pipeline.
6. Klik **Complete**.
7. Isi Capture Learning.
8. Klik **Complete & publish**.
9. Pastikan learning langsung muncul di Learning Library.

## F6. Test shared backend

1. Buka aplikasi di laptop.
2. Submit satu trend.
3. Buka link yang sama di HP atau incognito window.
4. Pilih profil lain.
5. Pastikan trend yang baru dibuat terlihat.
6. Upvote dari profil kedua.
7. Refresh laptop.
8. Pastikan vote ikut berubah.

Kalau ini berhasil, backend bersama sudah aktif.

## F7. Test Google Sheets

1. Submit trend baru.
2. Buka Google Sheet.
3. Pastikan tab berikut terbentuk:
   - Trend Submissions
   - Actions
   - Learning Library
   - Connector Log
4. Bila record tidak masuk:
   - Login sebagai Admin
   - Buka Google Sheets Sync
   - Klik Retry pending records

---

# Bagian G — Hal yang Tidak Boleh Dilakukan

Jangan:

- Upload `.env.local` ke GitHub.
- Menaruh Supabase Secret Key di file React.
- Menamai secret key `NEXT_PUBLIC_SUPABASE_SECRET_KEY`.
- Membagikan PIN Admin ke seluruh team.
- Menghapus tabel langsung dari Supabase.
- Mengedit data production langsung dari Table Editor tanpa backup.
- Menjadikan Google Sheet sebagai database utama.

---

# Troubleshooting

## Vercel menampilkan Missing environment variable

Penyebab:

- Nama variable salah.
- Variable belum diisi.
- Deployment belum diulang setelah variable ditambahkan.

Solusi:

1. Vercel Project → Settings.
2. Environment Variables.
3. Periksa:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
4. Klik Redeploy.

## Profile picker kosong

Periksa:

1. `seed.sql` sudah dijalankan.
2. Supabase → Table Editor → `app_users`.
3. Field `is_active` harus `true`.

## PIN selalu salah

Periksa:

1. Seed SQL berhasil.
2. Gunakan PIN demo yang tepat.
3. Bila user diubah menjadi Admin/Curator, isi PIN baru melalui Team Members.

## Avatar gagal upload

Periksa:

1. File JPG, PNG, atau WebP.
2. Ukuran maksimal 2 MB.
3. Supabase Storage memiliki bucket `avatars`.
4. Secret key Vercel benar.

## Data hanya terlihat di satu device

Artinya aplikasi yang dibuka mungkin masih prototype HTML lama, bukan repo Next.js ini.

Pastikan link yang dibuka adalah link hasil deployment Vercel dari repository ini.

## Google Sheets tidak terisi

Periksa:

1. Apps Script sudah di-deploy sebagai Web App.
2. URL berakhir `/exec`.
3. `GOOGLE_SHEETS_WEBHOOK_URL` sudah dimasukkan ke Vercel.
4. Vercel sudah Redeploy.
5. Klik Retry pending records.

## Build Vercel gagal

Buka build log dan lihat baris merah paling bawah.

Penyebab paling umum:

- File tidak lengkap saat di-upload ke GitHub.
- Environment variable belum terisi.
- Folder source berada satu tingkat terlalu dalam.

Root repository harus langsung memiliki:

```text
package.json
src
public
supabase
```

Bukan:

```text
brightnow-trend-radar/
  brightnow-trend-radar-nextjs/
    package.json
```

---

# Checklist Launch

- [ ] Supabase project selesai
- [ ] `schema.sql` berhasil dijalankan
- [ ] `seed.sql` berhasil dijalankan
- [ ] Bucket avatars terlihat
- [ ] Supabase URL tersimpan
- [ ] Supabase Secret Key tersimpan
- [ ] Google Apps Script deployed
- [ ] Repository private di GitHub
- [ ] Environment Variables terisi di Vercel
- [ ] Vercel build berhasil
- [ ] Admin login berhasil
- [ ] Contributor login berhasil
- [ ] Shared trend terlihat lintas device
- [ ] Vote hanya satu kali per user
- [ ] Action terhubung ke Source Trend
- [ ] Learning terbit saat action selesai
- [ ] Google Sheet menerima data
- [ ] PIN demo sudah diganti
