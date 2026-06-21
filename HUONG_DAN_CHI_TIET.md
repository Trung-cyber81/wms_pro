# Hướng dẫn chi tiết: Đưa app WMS Pro ra khỏi Base44, tự host bằng VS Code + GitHub + Vercel + Supabase

Tài liệu này dành cho người **chưa quen** với các công cụ này. Làm theo đúng
thứ tự từng bước, đừng nhảy cóc.

---

## TÓM TẮT: Mình đã sửa những gì trong code?

Trước khi bắt đầu, bạn cần hiểu vì sao phải đổi (đọc nhanh phần này):

App gốc bạn tải từ Base44 dùng gói `@base44/sdk` để: lưu dữ liệu (pallet,
hàng hóa, vị trí kho), xử lý đăng nhập, và đọc file Excel bằng AI. Gói này
chỉ chạy được khi kết nối tới máy chủ của Base44 — nên nếu không trả phí
Base44 nữa, app sẽ ngừng hoạt động.

Mình đã:
1. **Gỡ bỏ hoàn toàn `@base44/sdk`** và thay bằng **Supabase** (database +
   đăng nhập) — Supabase có gói miễn phí, dữ liệu là CỦA BẠN 100%.
2. **Thay tính năng "đọc Excel bằng AI"** bằng đọc file trực tiếp trong
   trình duyệt (thư viện `xlsx`) — nhanh hơn, miễn phí, không cần AI.
3. **Sửa 2 lỗi có sẵn trong code gốc** khiến app **chắc chắn sẽ không build
   được** nếu bạn không sửa: file `egister.jsx` thiếu chữ "R" (phải là
   `Register.jsx`), và `Goods.jsx` import sai tên thư mục (`goods/` thay vì
   `good/`).
4. **Bỏ tính năng đăng nhập Google** (theo lựa chọn của bạn) — giờ chỉ còn
   đăng nhập bằng email/mật khẩu.

Toàn bộ giao diện, các trang Dashboard/Pallets/Goods/Locations/Export... đều
**giữ nguyên y hệt**, không đổi gì về cách dùng. Bạn dùng app sẽ thấy không
khác gì so với bản cũ.

---

## Bước 1 — Tạo project Supabase (chứa dữ liệu của bạn)

1. Vào [supabase.com](https://supabase.com), đăng nhập (bạn nói đã có tài khoản).
2. Bấm **New Project**.
3. Điền:
   - **Name**: ví dụ `wms-pro` (tên gì cũng được)
   - **Database Password**: đặt một mật khẩu mạnh, **lưu lại** (chỗ khác có thể cần dùng)
   - **Region**: chọn khu vực gần bạn nhất (ví dụ Singapore nếu bạn ở Việt Nam, để app chạy nhanh)
4. Bấm **Create new project**, đợi khoảng 1-2 phút để Supabase khởi tạo xong.

## Bước 2 — Tạo bảng dữ liệu trong Supabase

1. Trong project vừa tạo, ở menu bên trái, chọn **SQL Editor**.
2. Bấm **New query**.
3. Mở file `supabase_setup.sql` (mình đã đính kèm trong project gửi cho
   bạn), copy **toàn bộ nội dung**, dán vào ô SQL Editor.
4. Bấm **Run** (hoặc Ctrl+Enter).
5. Nếu thấy thông báo **Success. No rows returned** là đã tạo xong 3 bảng:
   `locations`, `pallets`, `goods` — kèm theo cơ chế bảo mật để mỗi tài
   khoản chỉ thấy dữ liệu của chính mình.

> **Lưu ý:** Nếu sau này bạn muốn NHIỀU người dùng (ví dụ cả team) cùng xem
> chung 1 dữ liệu kho thay vì mỗi người 1 kho riêng, đọc phần ghi chú ở
> cuối file `supabase_setup.sql` để đổi cấu hình bảo mật.

## Bước 3 — Lấy API key của Supabase

1. Trong project Supabase, vào **Settings** (icon bánh răng, góc dưới trái) → **API**.
2. Bạn sẽ thấy 2 giá trị cần copy lại:
   - **Project URL** — dạng `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key (trong mục Project API keys) — chuỗi rất dài bắt đầu bằng `eyJ...`
3. Lưu tạm 2 giá trị này vào Notepad, sẽ dùng ở Bước 6.

## Bước 4 — (Tùy chọn) Tắt xác minh email để test nhanh

Mặc định, khi đăng ký tài khoản mới, Supabase sẽ gửi email yêu cầu xác minh
trước khi cho đăng nhập. Nếu bạn chỉ đang test thử, có thể tắt bước này:

1. Vào **Authentication** → **Sign In / Providers** (hoặc **Settings** tùy
   giao diện Supabase hiện tại) → tìm phần **Email**.
2. Tắt (uncheck) **Confirm email**.
3. Lưu lại.

> Khi đưa app cho người khác dùng thật, nên **bật lại** để bảo mật tài khoản.

## Bước 5 — Cài đặt VS Code và mở project

1. Tải project mình gửi (file zip), giải nén ra một thư mục, ví dụ `D:\wms-pro`.
2. Mở **VS Code** → **File** → **Open Folder** → chọn thư mục `wms-pro` vừa giải nén.
3. Mở Terminal trong VS Code: menu **Terminal** → **New Terminal**.
4. Kiểm tra máy đã có Node.js chưa, gõ lệnh:
   ```bash
   node -v
   ```
   Nếu báo lỗi "command not found", tải Node.js bản LTS tại
   [nodejs.org](https://nodejs.org) và cài đặt trước, sau đó mở lại Terminal.

## Bước 6 — Tạo file biến môi trường `.env.local`

1. Trong VS Code, ở thư mục gốc project, tạo file mới tên **`.env.local`**
   (chú ý: bắt đầu bằng dấu chấm).
2. Dán nội dung sau, thay bằng giá trị bạn đã lưu ở Bước 3:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Lưu file (Ctrl+S).

> File `.env.local` đã được liệt kê trong `.gitignore`, nghĩa là khi bạn
> đẩy code lên GitHub, file này **sẽ không bị lộ** lên mạng — đúng và an
> toàn, vì đây là thông tin nhạy cảm.

## Bước 7 — Cài đặt thư viện và chạy thử ở máy local

Trong Terminal của VS Code, gõ lần lượt:

```bash
npm install
```

Đợi cài xong (khoảng 1-2 phút), rồi gõ:

```bash
npm run dev
```

Terminal sẽ hiện dòng dạng `Local: http://localhost:5173/`. Giữ Ctrl và
bấm vào link đó (hoặc copy dán vào trình duyệt) để mở app.

**Kiểm tra app:**
1. Bạn sẽ thấy trang Đăng nhập.
2. Bấm "Đăng ký ngay" → nhập email + mật khẩu thật của bạn → Tạo tài khoản.
3. Nếu Bước 4 bạn đã tắt "Confirm email": vào thẳng được app luôn.
   Nếu chưa tắt: kiểm tra email, bấm link xác minh, rồi quay lại đăng nhập.
4. Vào thử trang **Vị trí kho**, thêm 1 vị trí mới — nếu lưu thành công và
   hiện ra trên danh sách, nghĩa là kết nối Supabase đã hoạt động đúng.

Nếu lỗi, xem phần **Xử lý sự cố thường gặp** ở cuối tài liệu.

---

## Bước 8 — Đẩy code lên GitHub

1. Vào [github.com](https://github.com), bấm **New repository**.
2. Đặt tên, ví dụ `wms-pro`. Chọn **Private** (khuyến nghị, vì là app nội bộ của bạn). Đừng tick "Add README" để tránh xung đột.
3. Bấm **Create repository**. GitHub sẽ hiện hướng dẫn — bạn chỉ cần các lệnh dưới đây.
4. Quay lại VS Code, trong Terminal, gõ lần lượt (thay `<URL_REPO_CUA_BAN>` bằng URL mà GitHub vừa cho bạn, dạng `https://github.com/ten-ban/wms-pro.git`):

```bash
git init
git add .
git commit -m "Khoi tao project WMS Pro tu Base44 sang Supabase"
git branch -M main
git remote add origin <URL_REPO_CUA_BAN>
git push -u origin main
```

5. Nếu được hỏi đăng nhập GitHub, làm theo hướng dẫn trên màn hình (thường
   sẽ mở trình duyệt để bạn xác nhận).
6. Sau khi `git push` chạy xong, refresh trang GitHub — bạn sẽ thấy toàn bộ
   code đã có trên đó. File `.env.local` sẽ **không xuất hiện** (đúng, vì
   nó bị `.gitignore` chặn — đây là điều nên xảy ra).

> **Lưu ý an toàn:** Tuyệt đối không bao giờ commit file `.env.local` hay
> dán API key vào code rồi push lên GitHub public.

## Bước 9 — Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com), đăng nhập bằng tài khoản GitHub của bạn (nếu chưa liên kết).
2. Bấm **Add New** → **Project**.
3. Tìm repo `wms-pro` vừa tạo, bấm **Import**.
4. Ở phần cấu hình:
   - **Framework Preset**: Vercel sẽ tự nhận diện là **Vite** — để mặc định.
   - **Build Command**: `npm run build` (mặc định, không cần đổi)
   - **Output Directory**: `dist` (mặc định, không cần đổi)
5. Mở rộng phần **Environment Variables**, thêm đúng 2 biến giống file
   `.env.local` của bạn:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` (chuỗi dài) |
6. Bấm **Deploy**. Đợi khoảng 1-2 phút.
7. Khi xong, Vercel cho bạn 1 đường link dạng `https://wms-pro-xxxx.vercel.app`
   — đây chính là app của bạn, đã chạy online, không cần Base44 nữa.

## Bước 10 — Cập nhật Redirect URL cho tính năng "Quên mật khẩu"

Để nút "Quên mật khẩu" gửi đúng link trỏ về app đã deploy (chứ không phải
`localhost`):

1. Quay lại Supabase Dashboard → **Authentication** → **URL Configuration**.
2. Ở mục **Site URL**, điền link Vercel của bạn, ví dụ:
   `https://wms-pro-xxxx.vercel.app`
3. Ở mục **Redirect URLs**, thêm cả 2 dòng (để chạy được cả khi test ở máy
   local lẫn khi đã deploy):
   ```
   http://localhost:5173/reset-password
   https://wms-pro-xxxx.vercel.app/reset-password
   ```
4. Lưu lại.

---

## Từ giờ về sau: mỗi khi bạn muốn sửa app

1. Sửa code trong VS Code (có thể nhờ AI hỗ trợ, hoặc tự sửa).
2. Test thử bằng `npm run dev` ở máy local trước.
3. Khi ưng ý, gõ trong Terminal:
   ```bash
   git add .
   git commit -m "Mo ta ngan gon thay doi"
   git push
   ```
4. Vercel sẽ **tự động phát hiện** code mới trên GitHub và tự deploy lại
   trong khoảng 1 phút — không cần làm gì thêm.

---

## Xử lý sự cố thường gặp

**Lỗi "Thiếu biến môi trường VITE_SUPABASE_URL..." khi chạy `npm run dev`**
→ Kiểm tra lại file `.env.local` có đúng tên (không phải `.env.local.txt`),
đúng nội dung, và bạn đã lưu file trước khi chạy `npm run dev` chưa. Nếu app
đang chạy rồi mới sửa `.env.local`, cần tắt (Ctrl+C trong Terminal) và chạy
lại `npm run dev`.

**Đăng ký xong không đăng nhập được, báo "Email not confirmed"**
→ Bạn chưa tắt "Confirm email" ở Bước 4, hoặc bạn chưa bấm vào link xác
minh trong email được gửi tới. Kiểm tra cả hộp thư Spam.

**Trên Vercel deploy bị lỗi (build failed)**
→ Vào tab **Deployments** trên Vercel, bấm vào lần deploy bị lỗi để xem log
chi tiết. Lỗi phổ biến nhất là quên thêm Environment Variables (Bước 9,
mục 5) — kiểm tra lại đúng tên biến `VITE_SUPABASE_URL` và
`VITE_SUPABASE_ANON_KEY` (phải bắt đầu bằng `VITE_`, nếu không Vite sẽ
không đọc được).

**Import Excel báo lỗi "Không thể đọc file"**
→ Kiểm tra file Excel/CSV của bạn có đúng tên cột như mô tả trong app
(dòng chữ nhỏ dưới ô upload), đặc biệt cột `name` (tên hàng) không được để
trống ở bất kỳ dòng nào bạn muốn import.

**Muốn xem dữ liệu trực tiếp trong Supabase (không qua app)**
→ Vào Supabase Dashboard → **Table Editor** → chọn bảng `goods`, `pallets`,
hoặc `locations` để xem/sửa dữ liệu thô.

**Muốn cho đồng nghiệp cùng dùng chung 1 kho (chung dữ liệu)**
→ Mặc định mỗi tài khoản đăng ký sẽ có dữ liệu kho riêng biệt (an toàn,
không nhìn thấy dữ liệu của nhau). Nếu muốn dùng chung, đọc phần ghi chú ở
cuối file `supabase_setup.sql` để đổi chính sách bảo mật.
