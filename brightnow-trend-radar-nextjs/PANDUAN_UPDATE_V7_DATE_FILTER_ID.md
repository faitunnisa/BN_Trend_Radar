# Panduan Update V6 → V7: Filter Berdasarkan Tanggal

Panduan ini untuk aplikasi BrightNow Trend Radar yang **sudah berhasil online di Vercel**.

Update ini mengganti filter minggu menjadi:

```text
From Date → To Date
```

Data lama tidak dihapus.

---

# Hasil Setelah Update

## Filter global

Di bagian atas aplikasi akan ada:

- From
- To
- Apply
- Last 7 days
- Last 30 days
- This month
- This quarter

## Data yang mengikuti filter

- Dashboard dan Leaderboard: Trend Date berada dalam rentang pilihan.
- Trend Board: Trend Date berada dalam rentang pilihan.
- Action Pipeline: action muncul bila Start–End Date beririsan dengan rentang pilihan.
- Learning Library: Published Date berada dalam rentang pilihan.

Contoh:

```text
Filter: 1–31 August
Action: 28 July–5 August
```

Action tersebut tetap muncul karena periodenya masuk sebagian ke bulan August.

---

# BAGIAN 1 — Backup Dulu

Sebelum update:

1. Buka Supabase.
2. Jangan menghapus tabel apa pun.
3. Buka Google Sheet dan pastikan datanya masih dapat dilihat.
4. Di GitHub, pastikan repository terakhir sudah ter-upload.

Migration hanya menambahkan kolom baru dan membuat kolom lama tidak lagi wajib. Existing data tidak dihapus.

---

# BAGIAN 2 — Jalankan Migration di Supabase

Ini wajib dilakukan **sebelum** V7 dideploy.

1. Login ke Supabase.
2. Buka project BrightNow Trend Radar.
3. Klik **SQL Editor**.
4. Klik **New query**.
5. Dari repo V7, buka:

```text
supabase/migrations/20260724_date_range_filter.sql
```

6. Copy seluruh isi file.
7. Paste ke Supabase SQL Editor.
8. Klik **Run**.
9. Tunggu sampai muncul status **Success**.

Migration tersebut akan:

- Menambahkan `observed_date` pada Trends.
- Menambahkan `start_date` dan `end_date` pada Actions.
- Menambahkan `published_date` pada Learnings.
- Mengisi tanggal pada existing records.
- Mempertahankan kolom week lama sebagai history.

## Existing action lama

Work Period lama seperti `Week 1 August` berbentuk text sehingga tidak bisa dikonversi otomatis dengan aman.

Migration akan memberi existing action:

```text
Start Date = tanggal action dibuat
End Date   = tanggal action dibuat
```

Setelah V7 online, buka Action Pipeline dan edit tanggal action lama yang masih aktif.

---

# BAGIAN 3 — Replace Source Code

## Cara termudah dengan GitHub Desktop

1. Download repo V7 ZIP.
2. Extract ZIP.
3. Buka folder project lama yang terhubung ke GitHub Desktop.
4. Copy seluruh isi folder V7.
5. Paste ke folder project lama.
6. Pilih **Replace** saat komputer menanyakan file yang sama.

Pastikan struktur project tetap seperti:

```text
brightnow-trend-radar-nextjs/
├── package.json
├── src/
├── public/
├── supabase/
└── google-apps-script/
```

Jangan membuat folder baru di dalam folder project seperti:

```text
brightnow-trend-radar-nextjs/
└── brightnow-trend-radar-nextjs-v7/
```

## Commit dan Push

Di GitHub Desktop:

1. Lihat daftar file berubah.
2. Isi Summary:

```text
Update to date range filter V7
```

3. Klik **Commit to main**.
4. Klik **Push origin**.

---

# BAGIAN 4 — Tunggu Vercel

Setelah Push:

1. Buka Vercel.
2. Pilih project `bn-trend-radar`.
3. Buka **Deployments**.
4. Deployment baru seharusnya muncul otomatis.
5. Tunggu sampai status **Ready**.
6. Klik **Visit**.

Tidak perlu mengubah Root Directory. Tetap:

```text
brightnow-trend-radar-nextjs
```

Environment Variables juga tidak perlu diubah.

---

# BAGIAN 5 — Update Google Apps Script

Kode V7 mengirim kolom tanggal baru. Apps Script juga perlu diperbarui.

1. Buka Google Sheet BrightNow Trend Radar.
2. Klik **Extensions → Apps Script**.
3. Buka file repo V7:

```text
google-apps-script/Code.gs
```

4. Copy seluruh isi.
5. Hapus code lama di Apps Script.
6. Paste code V7.
7. Klik **Save**.

## Membuat versi deployment baru

1. Klik **Deploy**.
2. Pilih **Manage deployments**.
3. Klik ikon pensil pada Web App yang aktif.
4. Pada Version, pilih **New version**.
5. Klik **Deploy**.

URL `/exec` biasanya tetap sama, sehingga Environment Variable Vercel tidak perlu diganti.

## Bila Google Sheet sudah berisi data V6

Trend sheet masih kompatibel, tetapi nama kolom tanggal berubah.

Action dan Learning memiliki struktur kolom baru. Untuk pilot yang belum memiliki banyak record, cara paling rapi adalah:

1. Rename tab lama menjadi `Actions - V6 Archive` dan `Learning Library - V6 Archive`.
2. Buat tab baru kosong bernama `Actions` dan `Learning Library`, atau hapus tab lama bila memang belum ada data penting.
3. Submit satu record test agar Apps Script membuat header V7.

Jangan menghapus data penting tanpa membuat archive terlebih dahulu.

---

# BAGIAN 6 — Test

## Test filter

1. Pilih Last 7 days.
2. Pilih Last 30 days.
3. Pilih custom From dan To.
4. Klik Apply.
5. Pastikan isi dashboard berubah.

## Test trend

1. Klik Submit Trend.
2. Pilih Trend Date hari ini.
3. Submit.
4. Pastikan trend muncul dalam filter yang mencakup hari ini.

## Test action

1. Turn a trend into action.
2. Isi Start Date dan End Date.
3. Simpan.
4. Pilih filter yang beririsan dengan tanggal action.
5. Pastikan action muncul.

## Test learning

1. Login sebagai Action Owner.
2. Complete action.
3. Isi learning.
4. Pastikan Learning Library menampilkan learning pada Published Date hari ini.

## Test lintas device

1. Buka dari laptop.
2. Buka dari HP atau Incognito.
3. Gunakan rentang tanggal yang sama.
4. Pastikan data yang terlihat sama.

---

# Bila Error Setelah Update

## Error menyebut `observed_date does not exist`

Migration SQL belum dijalankan atau gagal.

Solusi:

1. Supabase → SQL Editor.
2. Jalankan migration V7.
3. Redeploy Vercel.

## Error menyebut `submission_week violates not-null constraint`

Migration belum menyelesaikan bagian yang membuat kolom lama menjadi optional.

Jalankan ulang file migration V7 secara penuh.

## App kosong setelah update

Filter default hanya menampilkan 7 hari terakhir. Data lama masih ada.

Ubah From Date ke tanggal yang lebih lama lalu klik Apply.

## Existing action tidak muncul

Action hanya tampil bila Start–End Date beririsan dengan filter. Perluas date range atau edit tanggal action tersebut.

---

# Checklist Singkat

```text
1. Run migration SQL
2. Replace code
3. Commit + Push
4. Wait for Vercel Ready
5. Update Apps Script version
6. Test date range
```
