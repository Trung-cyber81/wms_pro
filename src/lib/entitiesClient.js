import { supabase } from '@/lib/supabaseClient';

/**
 * Adapter giả lập API của base44.entities.X để các trang (Dashboard, Goods,
 * Pallets, Locations...) KHÔNG cần sửa code khi đổi sang Supabase.
 *
 * Hỗ trợ:
 *  - list()                          -> SELECT * FROM table ORDER BY created_date DESC
 *  - filter(query, sort, limit)      -> SELECT * FROM table WHERE query... ORDER BY sort LIMIT limit
 *  - create(data)                    -> INSERT, trả về row vừa tạo
 *  - update(id, data)                -> UPDATE theo id, trả về row sau khi update
 *  - delete(id)                      -> DELETE theo id
 *
 * Tên bảng trong Supabase được quy ước là tên entity viết thường + "s":
 *   Good -> goods, Pallet -> pallets, Location -> locations
 */
function createEntityClient(tableName) {
  return {
    async list(sort = '-created_date') {
      return this.filter({}, sort);
    },

    async filter(query = {}, sort = '-created_date', limit = null) {
      let q = supabase.from(tableName).select('*');

      // Áp các điều kiện lọc dạng { field: value }
      Object.entries(query || {}).forEach(([key, value]) => {
        q = q.eq(key, value);
      });

      // Sắp xếp: chuỗi bắt đầu bằng "-" nghĩa là DESC, ngược lại ASC
      if (sort) {
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.slice(1) : sort;
        q = q.order(field, { ascending: !isDesc });
      }

      if (limit) {
        q = q.limit(limit);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(tableName)
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}

export const entities = {
  Good: createEntityClient('goods'),
  Pallet: createEntityClient('pallets'),
  Location: createEntityClient('locations'),
};
