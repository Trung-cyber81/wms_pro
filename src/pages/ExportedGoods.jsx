import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RotateCcw, FileDown, Package, Box } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { exportGoodsToCSV, exportPalletsToCSV } from '@/lib/exportUtils';

export default function ExportedGoods() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [restoring, setRestoring] = useState(null);
  const [tab, setTab] = useState('goods'); // 'goods' | 'pallets'

  const { data: goods = [] } = useQuery({
    queryKey: ['goods-exported'],
    queryFn: () => base44.entities.Good.filter({ status: 'exported' }, '-exported_date', 500),
  });
  const { data: pallets = [] } = useQuery({
    queryKey: ['pallets-exported'],
    queryFn: () => base44.entities.Pallet.filter({ status: 'exported' }, '-exported_date', 200),
  });

  const filteredGoods = useMemo(() =>
    goods.filter(g =>
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.pallet_name?.toLowerCase().includes(search.toLowerCase()) ||
      g.location_name?.toLowerCase().includes(search.toLowerCase())
    ), [goods, search]);

  const filteredPallets = useMemo(() =>
    pallets.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.location_name?.toLowerCase().includes(search.toLowerCase())
    ), [pallets, search]);

  const handleRestore = async () => {
    if (!restoring) return;
    const isPallet = restoring._entityType === 'pallet';
    if (isPallet) {
      await base44.entities.Pallet.update(restoring.id, {
        status: 'in_stock', exported_date: null, exported_note: null
      });
      qc.invalidateQueries({ queryKey: ['pallets-exported'] });
      qc.invalidateQueries({ queryKey: ['pallets'] });
    } else {
      await base44.entities.Good.update(restoring.id, {
        status: 'in_stock', exported_date: null, exported_note: null
      });
      qc.invalidateQueries({ queryKey: ['goods-exported'] });
      qc.invalidateQueries({ queryKey: ['goods'] });
    }
    toast({ title: `Đã hoàn trả "${restoring.name}" về kho` });
    setRestoring(null);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Đã xuất kho"
        description={`${goods.length} hàng hóa · ${pallets.length} pallet đã xuất`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportGoodsToCSV(goods, 'da_xuat_kho_hang.csv')}>
              <FileDown className="w-4 h-4 mr-1.5" /> Xuất CSV hàng
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportPalletsToCSV(pallets, 'da_xuat_kho_pallet.csv')}>
              <FileDown className="w-4 h-4 mr-1.5" /> Xuất CSV pallet
            </Button>
          </div>
        }
      />

      {/* Tab */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        <button
          onClick={() => setTab('goods')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'goods' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Box className="w-3.5 h-3.5 inline mr-1.5" />Hàng hóa ({goods.length})
        </button>
        <button
          onClick={() => setTab('pallets')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'pallets' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Package className="w-3.5 h-3.5 inline mr-1.5" />Pallet ({pallets.length})
        </button>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      {tab === 'goods' && (
        filteredGoods.length === 0 ? (
          <EmptyState icon={Box} title="Chưa có hàng hóa xuất kho" description="Hàng được xuất sẽ xuất hiện ở đây" />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Tên hàng</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Loại</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Pallet</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Vị trí</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">SL</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ngày xuất</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ghi chú</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Hoàn trả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoods.map(g => (
                    <TableRow key={g.id} className="hover:bg-accent/50">
                      <TableCell className="text-sm font-medium">{g.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[11px] ${g.type === 'Bulky' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                          {g.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{g.pallet_name || '—'}</TableCell>
                      <TableCell className="text-sm">{g.location_name || '—'}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{g.quantity || 0}</TableCell>
                      <TableCell className="text-sm">{formatDate(g.exported_date)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{g.exported_note || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setRestoring({ ...g, _entityType: 'good' })}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Hoàn trả
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )
      )}

      {tab === 'pallets' && (
        filteredPallets.length === 0 ? (
          <EmptyState icon={Package} title="Chưa có pallet xuất kho" description="Pallet được xuất sẽ xuất hiện ở đây" />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Mã Pallet</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Vị trí cũ</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ngày xuất</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ghi chú</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Hoàn trả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPallets.map(p => (
                    <TableRow key={p.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm">{p.location_name || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.exported_date)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{p.exported_note || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setRestoring({ ...p, _entityType: 'pallet' })}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Hoàn trả
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )
      )}

      <ConfirmDialog
        open={!!restoring}
        onOpenChange={() => setRestoring(null)}
        title="Hoàn trả về kho"
        description={`Chuyển "${restoring?.name}" từ danh sách đã xuất về lại kho hoạt động?`}
        onConfirm={handleRestore}
      />
    </div>
  );
}