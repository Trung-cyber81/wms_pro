import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, AlertTriangle, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { downloadExportTemplate } from '@/lib/exportUtils';

export default function BulkExportImportModal({ open, onOpenChange, pallets, goods, onDone }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rawRows.length) {
        toast({ title: 'File trống', variant: 'destructive' });
        return;
      }

      // Cột mong đợi: pallet_or_good_name, type (pallet/good), exported_note, exported_date
      const rows = rawRows.map(row => {
        const get = (key) => {
          const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key);
          return foundKey ? String(row[foundKey] || '').trim() : '';
        };
        return {
          pallet_or_good_name: get('pallet_or_good_name'),
          type: get('type'),
          exported_note: get('exported_note'),
          exported_date: get('exported_date'),
        };
      }).filter(r => r.pallet_or_good_name);

      if (!rows.length) {
        toast({ title: 'Không có dòng hợp lệ', description: 'Kiểm tra lại cột "pallet_or_good_name".', variant: 'destructive' });
        return;
      }

      const enriched = rows.map(row => {
        const nameLower = (row.pallet_or_good_name || '').toLowerCase().trim();
        const isPallet = (row.type || '').toLowerCase() === 'pallet';
        const found = isPallet
          ? pallets.find(p => p.name.toLowerCase() === nameLower && p.status !== 'exported')
          : goods.find(g => g.name.toLowerCase() === nameLower && g.status !== 'exported');
        return { ...row, _found: found, _notFound: !found };
      });
      setPreview(enriched);
    } catch (err) {
      console.error(err);
      toast({ title: 'Không đọc được file', description: 'Kiểm tra lại định dạng (.xlsx, .xls, .csv).', variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    const exportedDate = new Date().toISOString();
    let count = 0;

    try {
      for (const row of preview) {
        if (!row._found) continue;
        const isPallet = (row.type || '').toLowerCase() === 'pallet';
        const data = {
          status: 'exported',
          exported_date: row.exported_date || exportedDate,
          exported_note: row.exported_note || ''
        };
        if (isPallet) {
          await base44.entities.Pallet.update(row._found.id, data);
        } else {
          await base44.entities.Good.update(row._found.id, data);
        }
        count++;
      }

      toast({ title: `Xuất kho hàng loạt thành công ${count} mục` });
      setFile(null);
      setPreview(null);
      onDone();
      onOpenChange(false);
    } catch (err) {
      console.error('Bulk export error:', err);
      toast({
        title: 'Xuất kho thất bại',
        description: err?.message || 'Có lỗi xảy ra. Xem chi tiết ở Console (F12).',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const validRows = preview?.filter(r => !r._notFound) || [];
  const notFoundRows = preview?.filter(r => r._notFound) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-500" />
            Import xuất hàng hàng loạt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadExportTemplate} className="text-xs">
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Tải template xuất hàng (.csv)
            </Button>
          </div>

          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">{file ? file.name : 'Chọn file CSV/Excel'}</p>
            <p className="text-xs text-muted-foreground mt-1">Cột: pallet_or_good_name, type (pallet/good), exported_note, exported_date</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </div>

          {preview && (
            <>
              {notFoundRows.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">
                    {notFoundRows.length} dòng không tìm thấy trong kho (có thể đã xuất hoặc tên sai): {notFoundRows.map(r => r.pallet_or_good_name).join(', ')}
                  </p>
                </div>
              )}
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Tên</th>
                      <th className="p-2 text-left">Loại</th>
                      <th className="p-2 text-left">Ghi chú</th>
                      <th className="p-2 text-center">Tìm thấy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${row._notFound ? 'bg-destructive/5' : ''}`}>
                        <td className="p-2 font-medium">{row.pallet_or_good_name}</td>
                        <td className="p-2">{row.type}</td>
                        <td className="p-2 text-muted-foreground">{row.exported_note}</td>
                        <td className="p-2 text-center">
                          {row._notFound
                            ? <AlertTriangle className="w-3.5 h-3.5 text-destructive mx-auto" />
                            : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            onClick={handleImport}
            disabled={!preview || importing || validRows.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {importing ? 'Đang xuất...' : `Xuất ${validRows.length} mục`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}