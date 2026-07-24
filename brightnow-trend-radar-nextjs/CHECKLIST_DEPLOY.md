# Quick Checklist — BrightNow Trend Radar V7

## Untuk aplikasi yang sudah online
- [ ] Download dan extract repo V7
- [ ] Supabase: run `supabase/migrations/20260724_date_range_filter.sql`
- [ ] Pastikan migration menampilkan Success
- [ ] Replace file project lokal dengan file V7
- [ ] Commit dan Push ke repository GitHub yang sama
- [ ] Tunggu Vercel deployment berstatus Ready
- [ ] Update `google-apps-script/Code.gs`
- [ ] Apps Script: Deploy → Manage deployments → Edit → New version → Deploy
- [ ] Test Last 7 Days
- [ ] Test custom From dan To date
- [ ] Submit trend dengan Trend Date
- [ ] Create action dengan Start dan End Date
- [ ] Edit tanggal action lama hasil migration
- [ ] Complete action dan cek Learning Library
- [ ] Cek Google Sheet

## Untuk deployment baru
- [ ] Run `supabase/schema.sql`
- [ ] Run `supabase/seed.sql`
- [ ] Add Supabase environment variables di Vercel
- [ ] Deploy Apps Script
- [ ] Push repo ke GitHub
- [ ] Import repository di Vercel
