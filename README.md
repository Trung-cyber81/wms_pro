# WMS Pro — Quản lý Kho Pallet

Ứng dụng quản lý kho (vị trí, pallet, hàng hóa, xuất/nhập kho) xây dựng bằng
React + Vite, dùng **Supabase** làm backend (database + đăng nhập) — không
còn phụ thuộc vào Base44.

## Hướng dẫn setup đầy đủ

Xem file `HUONG_DAN_CHI_TIET.md` trong thư mục gốc — hướng dẫn từng bước
từ A-Z dành cho người mới, từ tạo project Supabase đến deploy lên Vercel.

## Tóm tắt nhanh (nếu bạn đã quen)

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào SQL Editor, chạy file `supabase_setup.sql` để tạo bảng + bảo mật
3. Tắt "Confirm email" trong Authentication > Settings nếu muốn test nhanh (tùy chọn)
4. Copy `.env.example` thành `.env.local`, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (lấy ở Settings > API)
5. `npm install`
6. `npm run dev` → mở `http://localhost:5173`

## Deploy lên Vercel

1. Push code lên GitHub
2. Import repo vào Vercel
3. Thêm 2 biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong Vercel > Settings > Environment Variables
4. Deploy

## Cấu trúc thư mục chính

```
src/
├── pages/
│   ├── Dashboard.jsx        # Tổng quan
│   ├── Locations.jsx        # Vị trí kho
│   ├── Pallets.jsx          # Quản lý Pallet
│   ├── Goods.jsx            # Hàng hóa (nhập kho)
│   ├── ExportedGoods.jsx    # Đã xuất kho
│   ├── Login.jsx / Register.jsx / ForgotPassword.jsx / ResetPassword.jsx
├── lib/
│   ├── supabaseClient.js    # Kết nối Supabase
│   ├── entitiesClient.js    # CRUD database (thay thế base44.entities)
│   ├── authClient.js        # Đăng nhập / đăng ký (thay thế base44.auth)
│   ├── timeUtils.js         # Parse thời gian Q1.2026
│   └── exportUtils.js       # Download CSV/Template
entities/                    # Mô tả schema (tham khảo, không chạy code)
supabase_setup.sql           # Script tạo bảng + bảo mật cho Supabase
```

## Template Import/Export

| File | Dùng cho |
|------|----------|
| `template_import_nhap_hang.csv` | Tải từ nút "Template nhập" – nhập hàng hàng loạt |
| `template_import_xuat_hang.csv` | Tải từ nút trong "Import xuất" – xuất hàng loạt |

Cột template nhập: `sku, location, pallet, type, name, quantity, time, order_id, supplier, damage_rate, weight_kg, received_date, notes`
Cột template xuất: `pallet_or_good_name, type (pallet/good), exported_note, exported_date`
