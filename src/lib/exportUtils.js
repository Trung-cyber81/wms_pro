/**
 * Utility: download data as CSV
 */
export function downloadCSV(rows, filename) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] == null ? '' : String(row[h]);
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Template: Import nhập hàng (goods in)
 */
export function downloadImportTemplate() {
  const rows = [
    {
      sku: 'SKU-001',
      location: 'Kệ A1',
      pallet: 'PLT-001',
      type: 'Box',
      name: 'Linh kiện điện tử A',
      quantity: 50,
      time: 'Q1.2026',
      order_id: 'PO-2026-001',
      supplier: 'Công ty ABC',
      damage_rate: 1.5,
      weight_kg: 0.3,
      received_date: '2026-06-18',
      notes: ''
    },
    {
      sku: 'SKU-002',
      location: 'Khu Bulky',
      pallet: 'PLT-BLK-01',
      type: 'Bulky',
      name: 'Tivi Samsung 55 inch',
      quantity: 10,
      time: 'Tháng 3/2026',
      order_id: 'PO-2026-002',
      supplier: 'Samsung VN',
      damage_rate: 0,
      weight_kg: 18.5,
      received_date: '2026-06-18',
      notes: 'Hàng mới 100%'
    },
    {
      sku: 'SKU-003',
      location: 'Kệ B1',
      pallet: 'PLT-004',
      type: 'Box',
      name: 'Tai nghe Bluetooth',
      quantity: 80,
      time: '4/2026',
      order_id: '',
      supplier: '',
      damage_rate: '',
      weight_kg: 0.15,
      received_date: '',
      notes: ''
    },
  ];
  downloadCSV(rows, 'template_import_nhap_hang.csv');
}

/**
 * Template: Import xuất hàng hàng loạt
 */
export function downloadExportTemplate() {
  const rows = [
    {
      pallet_or_good_name: 'PLT-001',
      type: 'pallet',
      exported_note: 'Giao khách hàng ABC',
      exported_date: '2026-06-18'
    },
    {
      pallet_or_good_name: 'Tivi Samsung 55 inch',
      type: 'good',
      exported_note: 'Xuất theo đơn #001',
      exported_date: '2026-06-18'
    },
    {
      pallet_or_good_name: 'PLT-002',
      type: 'pallet',
      exported_note: '',
      exported_date: '2026-06-18'
    },
  ];
  downloadCSV(rows, 'template_import_xuat_hang.csv');
}

/**
 * Export danh sách hàng hiện tại ra CSV
 */
export function exportGoodsToCSV(goods, filename = 'danh_sach_hang_hoa.csv') {
  const rows = goods.map(g => ({
    'Mã hàng (SKU)': g.sku || '',
    'Tên hàng': g.name || '',
    'Loại': g.type || '',
    'Mã đơn hàng': g.order_id || '',
    'Nhà cung cấp': g.supplier || '',
    'Số lượng': g.quantity ?? 0,
    'Tỷ lệ hư hỏng (%)': g.damage_rate != null ? g.damage_rate : '',
    'Trọng lượng (kg)': g.weight_kg != null ? g.weight_kg : '',
    'Ngày nhập kho': g.received_date || '',
    'Vị trí': g.location_name || '',
    'Pallet': g.pallet_name || '',
    'Quý': g.quy || '',
    'Tháng': g.thang || '',
    'Năm': g.nam || '',
    'Mã vạch': g.barcode || '',
    'Ghi chú': g.notes || '',
    'Trạng thái': g.status === 'exported' ? 'Đã xuất kho' : 'Trong kho',
    'Ngày xuất': g.exported_date || '',
    'Ghi chú xuất': g.exported_note || '',
  }));
  downloadCSV(rows, filename);
}

/**
 * Export danh sách pallet ra CSV
 */
export function exportPalletsToCSV(pallets, filename = 'danh_sach_pallet.csv') {
  const rows = pallets.map(p => ({
    'Mã Pallet': p.name || '',
    'Vị trí': p.location_name || '',
    'Mã vạch': p.barcode || '',
    'Trạng thái': p.status === 'exported' ? 'Đã xuất kho' : 'Trong kho',
    'Ngày xuất': p.exported_date || '',
    'Ghi chú xuất': p.exported_note || '',
    'Ghi chú': p.notes || '',
  }));
  downloadCSV(rows, filename);
}