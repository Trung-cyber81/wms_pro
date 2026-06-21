import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, AlertTriangle, Package, Box } from 'lucide-react';
import { formatTimeDisplay } from '@/lib/timeUtils';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoodsTable({ goods, onEdit, onDelete, selected = [], onToggleSelect }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {onToggleSelect && <TableHead className="w-8 px-2" />}
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider w-7 px-1">#</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 w-24">Mã hàng</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 min-w-[140px] max-w-[180px]">Tên hàng</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 w-20">Loại</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 w-20">Mã ĐH</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 min-w-[110px] max-w-[140px]">Nhà CC</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 min-w-[110px]">Pallet / Vị trí</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 text-right w-12">SL</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 text-right w-14">HH%</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 w-28">Thời gian</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider px-2 text-right w-16">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {goods.map((g, i) => {
                const isSelected = selected.includes(g.id);
                return (
                  <motion.tr
                    key={g.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b border-border transition-colors ${
                      isSelected
                        ? 'bg-orange-50/80 dark:bg-orange-900/10'
                        : g.time_warning
                          ? 'bg-destructive/5 hover:bg-destructive/10'
                          : 'hover:bg-accent/50'
                    }`}
                  >
                    {onToggleSelect && (
                      <TableCell className="w-8 px-2 py-1.5">
                        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(g.id)} />
                      </TableCell>
                    )}
                    <TableCell className="text-[10px] text-muted-foreground font-mono px-1 py-1.5">{i + 1}</TableCell>
                    <TableCell className="px-2 py-1.5">
                      <span className="text-[11px] font-mono text-muted-foreground">{g.sku || '—'}</span>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 max-w-[180px]">
                      <span className="text-xs font-medium truncate block" title={g.name}>{g.name}</span>
                      {g.notes && <span className="text-[10px] text-muted-foreground truncate block">{g.notes}</span>}
                    </TableCell>
                    <TableCell className="px-2 py-1.5">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${g.type === 'Bulky' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {g.type === 'Bulky' ? <Package className="w-2.5 h-2.5 mr-0.5" /> : <Box className="w-2.5 h-2.5 mr-0.5" />}
                        {g.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 py-1.5">
                      <span className="text-[11px] font-mono text-muted-foreground">{g.order_id || '—'}</span>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground px-2 py-1.5 max-w-[140px]">
                      <span className="truncate block" title={g.supplier}>{g.supplier || '—'}</span>
                    </TableCell>
                    <TableCell className="px-2 py-1.5">
                      <div className="text-xs font-medium truncate" title={g.pallet_name}>{g.pallet_name || '—'}</div>
                      {g.location_name && <div className="text-[10px] text-muted-foreground truncate">{g.location_name}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono px-2 py-1.5">{g.quantity ?? 0}</TableCell>
                    <TableCell className="text-right px-2 py-1.5">
                      {g.damage_rate != null ? (() => {
                        const pct = g.damage_rate > 0 && g.damage_rate < 1 ? +(g.damage_rate * 100).toFixed(1) : g.damage_rate;
                        return (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${pct > 5 ? 'border-destructive text-destructive' : pct > 0 ? 'border-orange-400 text-orange-600' : ''}`}>
                            {pct}%
                          </Badge>
                        );
                      })() : <span className="text-[11px] text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        {g.time_warning && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                        <span className={`text-[11px] font-mono ${g.time_warning ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          {formatTimeDisplay(g)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-2 py-1.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(g)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(g)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}