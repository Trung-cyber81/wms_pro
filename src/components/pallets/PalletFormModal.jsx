import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PalletFormModal({ open, onOpenChange, pallet, locations, onSave, saving }) {
  const [form, setForm] = useState({ name: '', location_id: '', notes: '' });

  useEffect(() => {
    if (pallet) {
      setForm({ name: pallet.name || '', location_id: pallet.location_id || '', notes: pallet.notes || '' });
    } else {
      setForm({ name: '', location_id: '', notes: '' });
    }
  }, [pallet, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const loc = locations?.find(l => l.id === form.location_id);
    onSave({ ...form, location_name: loc?.name || '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {pallet?.id ? 'Chỉnh sửa Pallet' : 'Thêm Pallet mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tên / Mã Pallet *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: PLT-001" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Vị trí</Label>
            <Select value={form.location_id} onValueChange={v => setForm({ ...form, location_id: v })}>
              <SelectTrigger><SelectValue placeholder="Chọn vị trí" /></SelectTrigger>
              <SelectContent>
                {locations?.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name} {l.code ? `(${l.code})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ghi chú</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ghi chú..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : (pallet?.id ? 'Cập nhật' : 'Thêm mới')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}