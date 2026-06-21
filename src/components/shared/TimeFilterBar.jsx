import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { QUARTERS, MONTHS, YEARS } from '@/lib/timeUtils';

export default function TimeFilterBar({ filters, onFilterChange, searchValue, onSearchChange }) {
  const clearFilters = () => {
    onFilterChange({ quy: 'all', thang: 'all', nam: 'all' });
    if (onSearchChange) onSearchChange('');
  };

  const hasActiveFilter = filters.quy !== 'all' || filters.thang !== 'all' || filters.nam !== 'all' || searchValue;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm..."
          value={searchValue || ''}
          onChange={e => onSearchChange?.(e.target.value)}
          className="pl-9 h-9 bg-background"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />

        <Select value={String(filters.quy)} onValueChange={v => onFilterChange({ ...filters, quy: v })}>
          <SelectTrigger className="w-[100px] h-9 text-xs">
            <SelectValue placeholder="Quý" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Quý</SelectItem>
            {QUARTERS.map(q => (
              <SelectItem key={q.value} value={String(q.value)}>{q.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(filters.thang)} onValueChange={v => onFilterChange({ ...filters, thang: v })}>
          <SelectTrigger className="w-[120px] h-9 text-xs">
            <SelectValue placeholder="Tháng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Tháng</SelectItem>
            {MONTHS.map(m => (
              <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(filters.nam)} onValueChange={v => onFilterChange({ ...filters, nam: v })}>
          <SelectTrigger className="w-[100px] h-9 text-xs">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Năm</SelectItem>
            {YEARS.map(y => (
              <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs text-muted-foreground">
            <X className="w-3.5 h-3.5 mr-1" />
            Xóa lọc
          </Button>
        )}
      </div>
    </div>
  );
}