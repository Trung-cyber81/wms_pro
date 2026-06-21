import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Scan, X, LogOut, Package, Box, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

export default function ScanExportModal({ open, onOpenChange, pallets, goods, onDone }) {
  const [scanInput, setScanInput] = useState('');
  const [scanned, setScanned] = useState([]);
  const [note, setNote] = useState('');
  const [exporting, setExporting] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (open) {
      setScanned([]);
      setNote('');
      setScanInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleScan = (e) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const code = scanInput.trim();
      // Find in pallets first, then goods by barcode or name
      const pallet = pallets.find(p =>
        p.status !== 'exported' && (p.barcode === code || p.name === code)
      );
      const good = !pallet && goods.find(g =>
        g.status !== 'exported' && (g.barcode === code || g.name === code)
      );

      const found = pallet
        ? { ...pallet, _entityType: 'pallet' }
        : good
          ? { ...good, _entityType: 'good' }
          : null;

      if (!found) {
        toast({ title: `Không tìm thấy: "${code}"`, variant: 'destructive' });
        setScanInput('');
        return;
      }

      if (scanned.find(s => s.id === found.id)) {
        toast({ title: 'Mục này đã được quét', variant: 'destructive' });
        setScanInput('');
        return;
      }

      setScanned(prev => [...prev, found]);
      setScanInput('');
      toast({ title: `✓ Quét thành công: ${found.name}` });
    }
  };

  const handleRemove = (id) => setScanned(prev => prev.filter(s => s.id !== id));

  const handleExport = async () => {
    if (scanned.length === 0) return;
    setExporting(true);
    const exportedDate = new Date().toISOString();

    for (const item of scanned) {
      if (item._entityType === 'pallet') {
        await base44.entities.Pallet.update(item.id, {
          status: 'exported', exported_date: exportedDate, exported_note: note
        });
      } else {
        await base44.entities.Good.update(item.id, {
          status: 'exported', exported_date: exportedDate, exported_note: note
        });
      }
    }

    toast({ title: `Xuất kho thành công ${scanned.length} mục` });
    setExporting(false);
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            Quét mã xuất kho
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Quét mã vạch / nhập tên Pallet hoặc Hàng</Label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={handleScan}
                placeholder="Quét hoặc gõ mã → Enter"
                className="font-mono"
                autoComplete="off"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Nhấn Enter sau mỗi lần quét. Hỗ trợ mã vạch và tên Pallet/Hàng.</p>
          </div>

          {scanned.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Đã quét ({scanned.length})
                </p>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setScanned([])}>
                  Xóa tất cả
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden max-h-48 overflow-y-auto">
                {scanned.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {item._entityType === 'pallet'
                        ? <Package className="w-3.5 h-3.5 text-violet-500" />
                        : <Box className="w-3.5 h-3.5 text-blue-500" />}
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {item._entityType === 'pallet' ? 'Pallet' : item.type}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => handleRemove(item.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ghi chú xuất kho</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="VD: Giao khách hàng ABC..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button
              disabled={scanned.length === 0 || exporting}
              onClick={handleExport}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              {exporting ? 'Đang xuất...' : `Xuất ${scanned.length} mục`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}