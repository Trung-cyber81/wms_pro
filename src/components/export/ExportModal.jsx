import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, AlertTriangle } from 'lucide-react';

export default function ExportModal({ open, onOpenChange, items, onConfirm, confirming }) {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm(note);
    setNote('');
  };

  const pallets = items.filter(i => i._entityType === 'pallet');
  const goods = items.filter(i => i._entityType !== 'pallet');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <LogOut className="w-5 h-5 text-orange-500" />
            Xác nhận xuất kho
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
            <p className="font-medium text-orange-800 dark:text-orange-300">
              Sắp xuất kho {items.length} mục:
            </p>
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {pallets.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-orange-600 dark:text-orange-400">Pallet ({pallets.length})</p>
                  {pallets.map(p => (
                    <p key={p.id} className="text-xs text-orange-700 dark:text-orange-300 ml-2">• {p.name}</p>
                  ))}
                </div>
              )}
              {goods.length > 0 && (
                <div className="mt-1">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-orange-600 dark:text-orange-400">Hàng hóa ({goods.length})</p>
                  {goods.map(g => (
                    <p key={g.id} className="text-xs text-orange-700 dark:text-orange-300 ml-2">• {g.name} ({g.type})</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">Các mục này sẽ được chuyển sang danh sách <strong>Đã xuất kho</strong> và không còn trong kho hoạt động.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ghi chú xuất kho</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="VD: Giao khách hàng ABC, đơn hàng #001..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {confirming ? 'Đang xuất...' : `Xuất ${items.length} mục`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}