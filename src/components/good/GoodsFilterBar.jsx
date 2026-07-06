import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { QUARTERS, MONTHS, YEARS } from '@/lib/timeUtils';

const DEFAULT_FILTERS = {
  quy: 'all',
  thang: 'all',
  nam: 'all',
  sku: '',
  type: 'all',
  supplier: '',
  damageMin: '',
  damageMax: '',
  pallet: '',
  timeWarning: 'all',
  order_id: '',
};

export default function GoodsFilterBar({ filters, onFilterChange, searchValue, onSearchChange, pallets = [] }) {
  const [expanded, setExpanded] = useState(false);

  const clearAll = () => {
    onFilterChange({ ...DEFAULT_FILTERS });
    onSearchChange?.('');
  };

  const activeCount = [
    searchValue,
    filters.quy !== 'all' && filters.quy,
    filters.thang !== 'all' && filters.thang,
    filters.nam !== 'all' && filters.nam,
    filters.sku,
    filters.order_id,
    filters.type !== 'all' && filters.type,
    filters.supplier,
    filters.damageMin,
    filters.damageMax,
    filters.pallet,
    filters.timeWarning !== 'all' && filters.timeWarning,
  ].filter(Boolean).length;

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-3">
      {/* Row 1: Search + toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm tên hàng, mã ĐH, pallet, vị trí..."
            value={searchValue || ''}
            onChange={e => onSearchChange?.(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 shrink-0"
          onClick={() => setExpanded(v => !v)}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Lọc nâng cao
          {activeCount > 0 && (
            <Badge className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
              {activeCount}
            </Badge>
          )}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs text-muted-foreground shrink-0">
            <X className="w-3.5 h-3.5 mr-1" /> Xóa lọc
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 pt-1 border-t border-border">

          {/* SKU */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Mã hàng (SKU)</label>
            <Input
              placeholder="Nhập mã..."
              value={filters.sku || ''}
              onChange={e => onFilterChange({ ...filters, sku: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* Mã ĐH */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Mã ĐH</label>
            <Input
              placeholder="Nhập mã đơn hàng..."
              value={filters.order_id || ''}
              onChange={e => onFilterChange({ ...filters, order_id: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* Loại hàng */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Loại hàng</label>
            <Select value={filters.type || 'all'} onValueChange={v => onFilterChange({ ...filters, type: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="Box">Box</SelectItem>
                <SelectItem value="Bulky">Bulky</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nhà cung cấp */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Nhà cung cấp</label>
            <Input
              placeholder="Tên nhà CC..."
              value={filters.supplier || ''}
              onChange={e => onFilterChange({ ...filters, supplier: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* Pallet */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pallet</label>
            <Select value={filters.pallet || 'all'} onValueChange={v => onFilterChange({ ...filters, pallet: v === 'all' ? '' : v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Pallet</SelectItem>
                {pallets.map(p => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tỷ lệ hư hỏng */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Hư hỏng (%)</label>
            <div className="flex items-center gap-1">
              <Input
                placeholder="Từ"
                type="number"
                min="0"
                max="100"
                value={filters.damageMin || ''}
                onChange={e => onFilterChange({ ...filters, damageMin: e.target.value })}
                className="h-8 text-xs w-full"
              />
              <span className="text-[10px] text-muted-foreground shrink-0">–</span>
              <Input
                placeholder="Đến"
                type="number"
                min="0"
                max="100"
                value={filters.damageMax || ''}
                onChange={e => onFilterChange({ ...filters, damageMax: e.target.value })}
                className="h-8 text-xs w-full"
              />
            </div>
          </div>

          {/* Cảnh báo thời gian */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Thời gian</label>
            <Select value={filters.timeWarning || 'all'} onValueChange={v => onFilterChange({ ...filters, timeWarning: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="warning">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-destructive" /> Có cảnh báo</span>
                </SelectItem>
                <SelectItem value="ok">Không cảnh báo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quý */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Quý</label>
            <Select value={String(filters.quy)} onValueChange={v => onFilterChange({ ...filters, quy: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả Quý" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Quý</SelectItem>
                {QUARTERS.map(q => (
                  <SelectItem key={q.value} value={String(q.value)}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tháng */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tháng</label>
            <Select value={String(filters.thang)} onValueChange={v => onFilterChange({ ...filters, thang: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả Tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Tháng</SelectItem>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Năm */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Năm</label>
            <Select value={String(filters.nam)} onValueChange={v => onFilterChange({ ...filters, nam: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Năm</SelectItem>
                {YEARS.map(y => (
                  <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      )}
    </div>
  );
}
