import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function LocationFormModal({ open, onOpenChange, location, onSave, saving }) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    if (location) {
      setForm({ name: location.name || '', code: location.code || '', description: location.description || '' });
    } else {
      setForm({ name: '', code: '', description: '' });
    }
  }, [location, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {location?.id ? 'Chỉnh sửa Vị trí' : 'Thêm Vị trí mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tên vị trí *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Kệ A1" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Mã vị trí</Label>
            <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: LOC-A1" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Mô tả</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ghi chú..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : (location?.id ? 'Cập nhật' : 'Thêm mới')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}