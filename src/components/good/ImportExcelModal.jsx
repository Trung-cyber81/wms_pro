import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { parseTimeString } from '@/lib/timeUtils';
import { toast } from '@/components/ui/use-toast';

export default function ImportExcelModal({ open, onOpenChange, pallets, onImportDone }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  // Excel lưu ngày tháng dưới dạng số serial (vd: 46194 = một ngày nào đó
  // trong năm 2026), không phải chuỗi "2026-06-18". Hàm này nhận diện cả 2
  // trường hợp và luôn trả về chuỗi ngày ISO ("YYYY-MM-DD") hoặc null.
  const normalizeExcelDate = (value) => {
    if (value === '' || value == null) return null;

    // Trường hợp 1: số serial của Excel (vd: 46194)
    if (typeof value === 'number') {
      const parsedDate = XLSX.SSF.parse_date_code(value);
      if (!parsedDate) return null;
      const yyyy = String(parsedDate.y).padStart(4, '0');
      const mm = String(parsedDate.m).padStart(2, '0');
      const dd = String(parsedDate.d).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    // Trường hợp 2: chuỗi ngày người dùng gõ tay (vd: "2026-06-18", "18/06/2026")
    const str = String(value).trim();
    if (!str) return null;

    // dd/mm/yyyy hoặc dd-mm-yyyy
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // yyyy-mm-dd (đã đúng chuẩn ISO)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }

    // Không nhận diện được định dạng -> bỏ qua, không gửi giá trị rác lên DB
    return null;
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      // defval: '' đảm bảo các ô trống không bị bỏ qua hoàn toàn
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rawRows.length) {
        toast({ title: 'File trống', description: 'Không tìm thấy dữ liệu trong file.', variant: 'destructive' });
        return;
      }

      // Cột mong đợi: sku, location, pallet, type, name, quantity, time,
      // order_id, supplier, damage_rate, weight_kg, received_date, notes
      const rows = rawRows.map(row => {
        const get = (key) => {
          // Cho phép cột viết hoa/thường khác nhau trong file Excel
          const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key);
          return foundKey ? row[foundKey] : '';
        };

        const timeRaw = String(get('time') || '').trim();
        const parsed = parseTimeString(timeRaw);

        return {
          sku: String(get('sku') || '').trim(),
          location: String(get('location') || '').trim(),
          pallet: String(get('pallet') || '').trim(),
          type: String(get('type') || '').trim() === 'Bulky' ? 'Bulky' : 'Box',
          name: String(get('name') || '').trim(),
          quantity: Number(get('quantity')) || 0,
          order_id: String(get('order_id') || '').trim(),
          supplier: String(get('supplier') || '').trim(),
          damage_rate: get('damage_rate') !== '' ? Number(get('damage_rate')) : null,
          weight_kg: get('weight_kg') !== '' ? Number(get('weight_kg')) : null,
          received_date: normalizeExcelDate(get('received_date')),
          notes: String(get('notes') || '').trim(),
          quy: parsed.quy,
          thang: parsed.thang,
          nam: parsed.nam,
          time_warning: parsed.warning,
          raw_time_text: parsed.warning ? timeRaw : null,
        };
      }).filter(row => row.name); // bỏ dòng trống không có tên hàng

      if (!rows.length) {
        toast({ title: 'Không có dòng hợp lệ', description: 'Kiểm tra lại cột "name" trong file.', variant: 'destructive' });
        return;
      }

      setPreview(rows);
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi', description: 'Không thể đọc file. Kiểm tra lại định dạng (.xlsx, .xls, .csv).', variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);

    try {
      // --- 1. Auto-create missing Locations ---
      const existingLocations = await base44.entities.Location.list();
      const locationMap = {}; // name (lowercase) -> entity
      existingLocations.forEach(l => { locationMap[l.name.toLowerCase()] = l; });

      const uniqueLocations = [...new Set(preview.map(r => (r.location || '').trim()).filter(Boolean))];
      for (const locName of uniqueLocations) {
        if (!locationMap[locName.toLowerCase()]) {
          const created = await base44.entities.Location.create({ name: locName });
          locationMap[locName.toLowerCase()] = created;
        }
      }

      // --- 2. Auto-create missing Pallets ---
      const existingPallets = await base44.entities.Pallet.list();
      const palletMap = {}; // name (lowercase) -> entity
      existingPallets.forEach(p => { palletMap[p.name.toLowerCase()] = p; });

      const uniquePallets = [...new Set(preview.map(r => (r.pallet || '').trim()).filter(Boolean))];
      for (const pName of uniquePallets) {
        if (!palletMap[pName.toLowerCase()]) {
          // Find location for this pallet from any row that references it
          const refRow = preview.find(r => (r.pallet || '').trim().toLowerCase() === pName.toLowerCase());
          const locName = (refRow?.location || '').trim();
          const loc = locName ? locationMap[locName.toLowerCase()] : null;
          const created = await base44.entities.Pallet.create({
            name: pName,
            location_id: loc?.id || null,
            location_name: loc?.name || locName || null,
            status: 'in_stock',
          });
          palletMap[pName.toLowerCase()] = created;
        }
      }

      // --- 3. Create Goods with proper links ---
      let successCount = 0;
      let warningCount = 0;

      for (const row of preview) {
        const pKey = (row.pallet || '').trim().toLowerCase();
        const matchPallet = pKey ? palletMap[pKey] : null;
        const locName = matchPallet?.location_name || (row.location || '').trim();

        const data = {
          sku: row.sku || '',
          name: row.name || 'Không tên',
          type: row.type === 'Bulky' ? 'Bulky' : 'Box',
          order_id: row.order_id || '',
          supplier: row.supplier || '',
          damage_rate: row.damage_rate != null ? Number(row.damage_rate) : null,
          weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
          received_date: row.received_date || null,
          notes: row.notes || '',
          pallet_id: matchPallet?.id || null,
          pallet_name: matchPallet?.name || null,
          location_name: locName || null,
          quantity: row.quantity || 0,
          quy: row.quy,
          thang: row.thang,
          nam: row.nam,
          time_warning: row.time_warning || false,
          raw_time_text: row.raw_time_text || null,
          status: 'in_stock',
        };

        await base44.entities.Good.create(data);
        successCount++;
        if (row.time_warning) warningCount++;
      }

      setFile(null);
      setPreview(null);
      onOpenChange(false);
      onImportDone();

      const newLocs = uniqueLocations.filter(l => !existingLocations.some(e => e.name.toLowerCase() === l.toLowerCase())).length;
      const newPals = uniquePallets.filter(p => !existingPallets.some(e => e.name.toLowerCase() === p.toLowerCase())).length;
      const extra = [newLocs > 0 && `${newLocs} vị trí`, newPals > 0 && `${newPals} pallet`].filter(Boolean).join(', ');

      toast({
        title: `Import thành công ${successCount} dòng`,
        description: (extra ? `Tự động tạo: ${extra}. ` : '') +
          (warningCount > 0 ? `${warningCount} dòng có cảnh báo thời gian.` : 'Tất cả dữ liệu đã được nhập đúng.'),
      });
    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: 'Import thất bại',
        description: err?.message || 'Có lỗi xảy ra khi import dữ liệu. Xem chi tiết ở Console (F12).',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const warningRows = preview?.filter(r => r.time_warning) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import từ Excel / CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">{file ? file.name : 'Chọn file Excel/CSV'}</p>
            <p className="text-xs text-muted-foreground mt-1">Cột: sku, location, pallet, type, name, quantity, time, order_id, supplier, damage_rate, weight_kg, notes</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          </div>

          {preview && (
            <>
              {warningRows.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">{warningRows.length} dòng có dữ liệu thời gian không hợp lệ</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Các dòng này sẽ được import với cảnh báo. Bạn có thể chỉnh sửa sau.</p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border overflow-x-auto max-h-[45vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Mã hàng</th>
                      <th className="p-2 text-left">Tên hàng</th>
                      <th className="p-2 text-left">Loại</th>
                      <th className="p-2 text-left">Mã ĐH</th>
                      <th className="p-2 text-left">Nhà CC</th>
                      <th className="p-2 text-left">Pallet</th>
                      <th className="p-2 text-right">SL</th>
                      <th className="p-2 text-right">HH%</th>
                      <th className="p-2 text-left">Thời gian</th>
                      <th className="p-2 text-center">OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${row.time_warning ? 'bg-destructive/5' : ''}`}>
                        <td className="p-2 font-mono text-xs">{row.sku || '—'}</td>
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.type}</td>
                        <td className="p-2 font-mono text-xs">{row.order_id || '—'}</td>
                        <td className="p-2 text-xs">{row.supplier || '—'}</td>
                        <td className="p-2">{row.pallet}</td>
                        <td className="p-2 text-right font-mono">{row.quantity}</td>
                        <td className="p-2 text-right font-mono">{row.damage_rate != null ? `${row.damage_rate}%` : '—'}</td>
                        <td className="p-2 font-mono">
                          {row.time_warning ? (
                            <span className="text-destructive">{row.raw_time_text}</span>
                          ) : (
                            <span>{row.quy ? `Q${row.quy}` : ''}{row.thang ? `.T${row.thang}` : ''}{row.nam ? `.${row.nam}` : ''}</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {row.time_warning ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive mx-auto" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3 mt-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleImport} disabled={!preview || importing}>
            {importing ? 'Đang import...' : `Import ${preview?.length || 0} dòng`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}