// File này trước đây khởi tạo SDK của Base44. Giờ đã thay bằng Supabase,
// nhưng vẫn export ra một object tên "base44" có cùng hình dạng
// ({ entities, auth }) để toàn bộ các trang khác KHÔNG cần sửa lại
// các lệnh gọi base44.entities.X.* và base44.auth.*
import { entities } from '@/lib/entitiesClient';
import { auth } from '@/lib/authClient';

export const base44 = {
  entities,
  auth,
};
