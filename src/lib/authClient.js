import { supabase } from '@/lib/supabaseClient';

/**
 * Adapter giả lập API của base44.auth để các trang Login/Register/...
 * dùng Supabase Auth (email + password) ở phía sau.
 *
 * Lưu ý: bản này KHÔNG còn login bằng Google và KHÔNG còn OTP 6 số kiểu
 * base44 — Supabase xác minh email bằng link gửi qua email (magic link
 * dạng "confirm signup"), đơn giản và đủ dùng cho ứng dụng nội bộ.
 */
export const auth = {
  async me() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    return data.user;
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async resetPasswordRequest(email) {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return true;
  },

  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
