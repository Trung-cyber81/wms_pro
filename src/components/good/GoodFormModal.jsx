import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QUARTERS, MONTHS, YEARS } from '@/lib/timeUtils';
import { AlertTriangle } from 'lucide-react';

const EMPTY_FORM = {
  sku: '', name: '', type: 'Box', pallet_id: '', quantity: 1,
  order_id: '', supplier: '', damage_rate: '', weight_kg: '',
  received_date: '', notes: '',
  quy: '', thang: '', nam: '',
};

export default function GoodFormModal({ open, onOpenChange, good, pallets, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (good) {
      setForm({
        sku: good.sku || '',
        name: good.name || '',
        type: good.type || 'Box',
        pallet_id: good.pallet_id || '',
        quantity: good.quantity || 1,
        order_id: good.order_id || '',
        supplier: good.supplier || '',
        damage_rate: good.damage_rate != null ? String(good.damage_rate) : '',
        weight_kg: good.weight_kg != null ? String(good.weight_kg) : '',
        received_date: good.received_date ? good.received_date.substring(0, 10) : '',
        notes: good.notes || '',
        quy: good.quy ? String(good.quy) : '',
        thang: good.thang ? String(good.thang) : '',
        nam: good.nam ? String(good.nam) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [good, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const pallet = pallets?.find(p => p.id === form.pallet_id);
    onSave({
      ...form,
      quantity: Number(form.quantity) || 0,
      damage_rate: form.damage_rate !== '' ? Number(form.damage_rate) : null,
      weight_kg: form.weight_kg !== '' ? Number(form.weight_kg) : null,
      received_date: form.received_date || null,
      quy: form.quy ? Number(form.quy) : null,
      thang: form.thang ? Number(form.thang) : null,
      nam: form.nam ? Number(form.nam) : null,
      pallet_name: pallet?.name || '',
      location_name: pallet?.location_name || '',
      time_warning: false,
      raw_time_text: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {good?.id ? 'Chỉnh sửa hàng hóa' : 'Thêm hàng hóa'}
          </DialogTitle>
        </DialogHeader>

        {good?.time_warning && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-destructive">Dữ liệu thời gian không hợp lệ</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Giá trị gốc: "<span className="font-mono">{good.raw_time_text}</span>". Vui lòng chọn lại đúng Quý/Tháng/Năm.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nhận dạng hàng */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thông tin hàng hóa</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Mã hàng (SKU)</Label>
                <Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="VD: SKU-001" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Mã đơn hàng</Label>
                <Input value={form.order_id} onChange={e => set('order_id', e.target.value)} placeholder="VD: PO-2026-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tên hàng hóa *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Tivi Samsung 55 inch" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Loại hàng *</Label>
                <Select value={form.type} onValueChange={v => set('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Bulky">Bulky</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nhà cung cấp</Label>
                <Input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="VD: Công ty ABC" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ngày nhập kho</Label>
                <Input type="date" value={form.received_date} onChange={e => set('received_date', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Số liệu */}
          <section className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số liệu & Chất lượng</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Số lượng</Label>
                <Input type="number" min={0} value={form.quantity} onChange={e => set('quantity', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tỷ lệ hư hỏng (%)</Label>
                <Input type="number" min={0} max={100} step={0.1} value={form.damage_rate} onChange={e => set('damage_rate', e.target.value)} placeholder="VD: 2.5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Trọng lượng (kg)</Label>
                <Input type="number" min={0} step={0.01} value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="VD: 15.5" />
              </div>
            </div>
          </section>

          {/* Vị trí kho */}
          <section className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vị trí kho</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pallet</Label>
              <Select value={form.pallet_id} onValueChange={v => set('pallet_id', v)}>
                <SelectTrigger><SelectValue placeholder="Chọn Pallet" /></SelectTrigger>
                <SelectContent>
                  {pallets?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}{p.location_name ? ` (${p.location_name})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Thời gian */}
          <section className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thời gian nhập kho</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Quý</Label>
                <Select value={form.quy} onValueChange={v => set('quy', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Bỏ trống —</SelectItem>
                    {QUARTERS.map(q => <SelectItem key={q.value} value={String(q.value)}>{q.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tháng</Label>
                <Select value={form.thang} onValueChange={v => set('thang', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Bỏ trống —</SelectItem>
                    {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Năm</Label>
                <Select value={form.nam} onValueChange={v => set('nam', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Bỏ trống —</SelectItem>
                    {YEARS.map(y => <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Ghi chú */}
          <section className="space-y-1.5 border-t border-border pt-4">
            <Label className="text-xs font-medium">Ghi chú nội bộ</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Ghi chú thêm về hàng hóa..." rows={2} />
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : (good?.id ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}