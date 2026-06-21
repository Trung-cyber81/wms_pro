import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Pencil, Trash2, Package, MapPin, LogOut, Scan, FileDown, Upload } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import PalletFormModal from '@/components/pallets/PalletFormModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ExportModal from '@/components/export/ExportModal';
import ScanExportModal from '@/components/export/ScanExportModal';
import BulkExportImportModal from '@/components/export/BulkExportImportModal';
import { exportPalletsToCSV } from '@/lib/exportUtils';

export default function Pallets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { data: pallets = [] } = useQuery({
    queryKey: ['pallets'],
    queryFn: () => base44.entities.Pallet.filter({ status: 'in_stock' }),
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });
  const { data: allGoods = [] } = useQuery({
    queryKey: ['goods'],
    queryFn: () => base44.entities.Good.filter({ status: 'in_stock' }),
  });

  const filtered = pallets.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.location_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    setSaving(true);
    if (editing?.id) {
      await base44.entities.Pallet.update(editing.id, data);
      toast({ title: 'Cập nhật Pallet thành công' });
    } else {
      await base44.entities.Pallet.create({ ...data, status: 'in_stock' });
      toast({ title: 'Thêm Pallet thành công' });
    }
    setSaving(false);
    setModalOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['pallets'] });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await base44.entities.Pallet.delete(deleting.id);
    toast({ title: 'Đã xóa Pallet' });
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ['pallets'] });
  };

  const handleExportConfirm = async (note) => {
    setConfirming(true);
    const exportedDate = new Date().toISOString();
    for (const id of selected) {
      await base44.entities.Pallet.update(id, { status: 'exported', exported_date: exportedDate, exported_note: note });
    }
    toast({ title: `Xuất kho thành công ${selected.length} pallet` });
    setConfirming(false);
    setSelected([]);
    setExportModalOpen(false);
    qc.invalidateQueries({ queryKey: ['pallets'] });
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedItems = pallets.filter(p => selected.includes(p.id)).map(p => ({ ...p, _entityType: 'pallet' }));

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['pallets'] });
    qc.invalidateQueries({ queryKey: ['goods'] });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Quản lý Pallet"
        description={`${pallets.length} pallet trong kho`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => exportPalletsToCSV(filtered)}>
              <FileDown className="w-4 h-4 mr-1.5" /> Xuất CSV
            </Button>
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => setBulkExportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" /> Import xuất
            </Button>
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => setScanOpen(true)}>
              <Scan className="w-4 h-4 mr-1.5" /> Quét xuất kho
            </Button>
            {selected.length > 0 && (
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setExportModalOpen(true)}>
                <LogOut className="w-4 h-4 mr-1.5" /> Xuất {selected.length} pallet
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> Thêm Pallet
            </Button>
          </div>
        }
      />

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm pallet..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Chưa có Pallet nào" description="Thêm pallet để bắt đầu quản lý" actionLabel="Thêm Pallet" onAction={() => { setEditing(null); setModalOpen(true); }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((pallet, i) => (
              <motion.div
                key={pallet.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`group transition-all duration-200 border-border/60 ${selected.includes(pallet.id) ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-900/10 shadow-md' : 'hover:shadow-md'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selected.includes(pallet.id)}
                            onCheckedChange={() => toggleSelect(pallet.id)}
                            className="mt-0.5"
                          />
                          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{pallet.name}</h3>
                          {pallet.location_name && (
                            <Badge variant="secondary" className="text-[10px] mt-1 gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {pallet.location_name}
                            </Badge>
                          )}
                          {pallet.notes && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{pallet.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(pallet); setModalOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(pallet)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PalletFormModal open={modalOpen} onOpenChange={setModalOpen} pallet={editing} locations={locations} onSave={handleSave} saving={saving} />
      <ExportModal open={exportModalOpen} onOpenChange={setExportModalOpen} items={selectedItems} onConfirm={handleExportConfirm} confirming={confirming} />
      <ScanExportModal open={scanOpen} onOpenChange={setScanOpen} pallets={pallets} goods={allGoods} onDone={refreshAll} />
      <BulkExportImportModal open={bulkExportOpen} onOpenChange={setBulkExportOpen} pallets={pallets} goods={allGoods} onDone={refreshAll} />
      <ConfirmDialog open={!!deleting} onOpenChange={() => setDeleting(null)} title="Xóa Pallet" description={`Bạn có chắc muốn xóa pallet "${deleting?.name}"?`} onConfirm={handleDelete} />
    </div>
  );
}