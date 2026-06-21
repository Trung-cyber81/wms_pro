import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileDown, Package, Box, Calendar, TrendingUp, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { downloadCSV } from '@/lib/exportUtils';

const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d; }
};

const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
};

export default function ExportHistory() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('goods');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: goods = [] } = useQuery({
    queryKey: ['export-history-goods'],
    queryFn: () => base44.entities.Good.filter({ status: 'exported' }, '-exported_date', 1000),
  });
  const { data: pallets = [] } = useQuery({
    queryKey: ['export-history-pallets'],
    queryFn: () => base44.entities.Pallet.filter({ status: 'exported' }, '-exported_date', 500),
  });

  const filterByDate = (items) => {
    return items.filter(item => {
      if (!item.exported_date) return true;
      const d = new Date(item.exported_date);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  };

  const filteredGoods = useMemo(() => {
    const byDate = filterByDate(goods);
    if (!search) return byDate;
    const s = search.toLowerCase();
    return byDate.filter(g =>
      g.name?.toLowerCase().includes(s) ||
      g.sku?.toLowerCase().includes(s) ||
      g.order_id?.toLowerCase().includes(s) ||
      g.pallet_name?.toLowerCase().includes(s) ||
      g.supplier?.toLowerCase().includes(s) ||
      g.exported_note?.toLowerCase().includes(s)
    );
  }, [goods, search, dateFrom, dateTo]);

  const filteredPallets = useMemo(() => {
    const byDate = filterByDate(pallets);
    if (!search) return byDate;
    const s = search.toLowerCase();
    return byDate.filter(p =>
      p.name?.toLowerCase().includes(s) ||
      p.location_name?.toLowerCase().includes(s) ||
      p.exported_note?.toLowerCase().includes(s) ||
      p.barcode?.toLowerCase().includes(s)
    );
  }, [pallets, search, dateFrom, dateTo]);

  // Stats
  const totalExportedQty = goods.reduce((s, g) => s + (g.quantity || 0), 0);
  const uniqueOrders = [...new Set(goods.map(g => g.order_id).filter(Boolean))];
  const uniqueDates = [...new Set(goods.map(g => g.exported_date ? formatDate(g.exported_date) : null).filter(Boolean))];

  const handleExportCSV = () => {
    if (tab === 'goods') {
      const rows = filteredGoods.map(g => ({
        'Mã hàng (SKU)': g.sku || '',
        'Tên hàng': g.name || '',
        'Loại': g.type || '',
        'Mã đơn hàng': g.order_id || '',
        'Nhà cung cấp': g.supplier || '',
        'Số lượng': g.quantity ?? 0,
        'Tỷ lệ HH (%)': g.damage_rate != null ? g.damage_rate : '',
        'Trọng lượng (kg)': g.weight_kg != null ? g.weight_kg : '',
        'Pallet': g.pallet_name || '',
        'Vị trí': g.location_name || '',
        'Ngày xuất': formatDate(g.exported_date),
        'Ghi chú xuất': g.exported_note || '',
      }));
      downloadCSV(rows, 'lich_su_xuat_hang_hoa.csv');
    } else {
      const rows = filteredPallets.map(p => ({
        'Mã Pallet': p.name || '',
        'Mã vạch': p.barcode || '',
        'Vị trí cũ': p.location_name || '',
        'Ngày xuất': formatDate(p.exported_date),
        'Ghi chú xuất': p.exported_note || '',
      }));
      downloadCSV(rows, 'lich_su_xuat_pallet.csv');
    }
  };

  const stats = [
    { label: 'Hàng đã xuất', value: goods.length, icon: Box, color: 'text-blue-600' },
    { label: 'Pallet đã xuất', value: pallets.length, icon: Package, color: 'text-amber-600' },
    { label: 'Tổng SL xuất', value: totalExportedQty, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Đơn hàng xuất', value: uniqueOrders.length, icon: Hash, color: 'text-purple-600' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Lịch sử xuất hàng"
        description="Theo dõi chi tiết toàn bộ hàng hóa và pallet đã xuất kho"
        actions={
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <FileDown className="w-4 h-4 mr-1.5" /> Xuất CSV
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold font-mono">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setTab('goods')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'goods' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Box className="w-3.5 h-3.5 inline mr-1.5" />Hàng hóa ({filteredGoods.length})
          </button>
          <button
            onClick={() => setTab('pallets')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'pallets' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Package className="w-3.5 h-3.5 inline mr-1.5" />Pallet ({filteredPallets.length})
          </button>
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm tên, mã hàng, mã ĐH, nhà CC..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-[140px] text-xs" />
          </div>
          <span className="text-muted-foreground text-xs">→</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-[140px] text-xs" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>Xóa lọc</Button>
          )}
        </div>
      </div>

      {/* Goods Tab */}
      {tab === 'goods' && (
        filteredGoods.length === 0 ? (
          <EmptyState icon={Box} title="Không có dữ liệu" description="Chưa có hàng hóa nào được xuất kho hoặc không khớp bộ lọc" />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider w-8">#</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Mã hàng</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Tên hàng</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Loại</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Mã đơn hàng</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Nhà CC</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Pallet</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Vị trí</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">SL</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">HH%</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ngày xuất</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ghi chú xuất</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoods.map((g, i) => (
                    <TableRow key={g.id} className="hover:bg-accent/50">
                      <TableCell className="text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{g.sku || '—'}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[160px]">
                        <span className="truncate block" title={g.name}>{g.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[11px] ${g.type === 'Bulky' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                          {g.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {g.order_id ? (
                          <Badge variant="outline" className="text-[11px] font-mono">{g.order_id}</Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{g.supplier || '—'}</TableCell>
                      <TableCell className="text-sm">{g.pallet_name || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{g.location_name || '—'}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{g.quantity ?? 0}</TableCell>
                      <TableCell className="text-right">
                        {g.damage_rate != null ? (
                          <Badge variant="outline" className={`text-[11px] ${g.damage_rate > 5 ? 'border-destructive text-destructive' : g.damage_rate > 0 ? 'border-orange-400 text-orange-600' : ''}`}>
                            {g.damage_rate}%
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{formatDateTime(g.exported_date)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate" title={g.exported_note}>{g.exported_note || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )
      )}

      {/* Pallets Tab */}
      {tab === 'pallets' && (
        filteredPallets.length === 0 ? (
          <EmptyState icon={Package} title="Không có dữ liệu" description="Chưa có pallet nào được xuất kho hoặc không khớp bộ lọc" />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider w-8">#</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Mã Pallet</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Mã vạch</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Vị trí cũ</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ngày xuất</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ghi chú xuất</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPallets.map((p, i) => (
                    <TableRow key={p.id} className="hover:bg-accent/50">
                      <TableCell className="text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.barcode || '—'}</TableCell>
                      <TableCell className="text-sm">{p.location_name || '—'}</TableCell>
                      <TableCell className="text-xs font-medium">{formatDateTime(p.exported_date)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={p.exported_note}>{p.exported_note || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )
      )}
    </div>
  );
}