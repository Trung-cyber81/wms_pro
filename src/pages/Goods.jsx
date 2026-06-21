import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Box, Layers, List, Scan, LogOut, FileDown, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';
import GoodsFilterBar from '@/components/good/GoodsFilterBar';
import EmptyState from '@/components/shared/EmptyState';
import GoodsTable from '@/components/good/GoodsTable';
import GoodFormModal from '@/components/good/GoodFormModal';
import ImportExcelModal from '@/components/good/ImportExcelModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ExportModal from '@/components/export/ExportModal';
import ScanExportModal from '@/components/export/ScanExportModal';
import BulkExportImportModal from '@/components/export/BulkExportImportModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportGoodsToCSV, downloadImportTemplate } from '@/lib/exportUtils';

export default function Goods() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    quy: 'all', thang: 'all', nam: 'all',
    sku: '', type: 'all', supplier: '',
    damageMin: '', damageMax: '',
    pallet: '', timeWarning: 'all',
  });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [groupBy, setGroupBy] = useState('none');

  // Export states
  const [selected, setSelected] = useState([]); // ids
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { data: allGoods = [], isLoading } = useQuery({
    queryKey: ['goods'],
    queryFn: () => base44.entities.Good.filter({ status: 'in_stock' }, '-created_date', 500),
  });
  const { data: pallets = [] } = useQuery({
    queryKey: ['pallets'],
    queryFn: () => base44.entities.Pallet.filter({ status: 'in_stock' }),
  });

  const filtered = useMemo(() => {
    return allGoods.filter(g => {
      const matchSearch = !search ||
        g.name?.toLowerCase().includes(search.toLowerCase()) ||
        g.pallet_name?.toLowerCase().includes(search.toLowerCase()) ||
        g.location_name?.toLowerCase().includes(search.toLowerCase());
      const matchQuy = filters.quy === 'all' || g.quy === Number(filters.quy);
      const matchThang = filters.thang === 'all' || g.thang === Number(filters.thang);
      const matchNam = filters.nam === 'all' || g.nam === Number(filters.nam);
      const matchSku = !filters.sku || g.sku?.toLowerCase().includes(filters.sku.toLowerCase());
      const matchType = filters.type === 'all' || g.type === filters.type;
      const matchSupplier = !filters.supplier || g.supplier?.toLowerCase().includes(filters.supplier.toLowerCase());
      const matchPallet = !filters.pallet || g.pallet_name === filters.pallet;
      const damage = g.damage_rate ?? null;
      const matchDamageMin = !filters.damageMin || (damage !== null && damage >= Number(filters.damageMin));
      const matchDamageMax = !filters.damageMax || (damage !== null && damage <= Number(filters.damageMax));
      const matchWarning =
        filters.timeWarning === 'all' ||
        (filters.timeWarning === 'warning' && g.time_warning) ||
        (filters.timeWarning === 'ok' && !g.time_warning);
      return matchSearch && matchQuy && matchThang && matchNam &&
        matchSku && matchType && matchSupplier && matchPallet &&
        matchDamageMin && matchDamageMax && matchWarning;
    });
  }, [allGoods, search, filters]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const map = {};
    filtered.forEach(g => {
      let key = '';
      if (groupBy === 'quarter') key = g.quy && g.nam ? `Q${g.quy}.${g.nam}` : 'Không xác định';
      else if (groupBy === 'month') key = g.thang && g.nam ? `Tháng ${g.thang}.${g.nam}` : 'Không xác định';
      else if (groupBy === 'location') key = g.location_name || 'Không xác định';
      else if (groupBy === 'pallet') key = g.pallet_name || 'Không xác định';
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return map;
  }, [filtered, groupBy]);

  const handleSave = async (data) => {
    setSaving(true);
    if (editing?.id) {
      await base44.entities.Good.update(editing.id, data);
      toast({ title: 'Cập nhật thành công', description: 'Dữ liệu hàng hóa đã được cập nhật.' });
    } else {
      await base44.entities.Good.create({ ...data, status: 'in_stock' });
      toast({ title: 'Thêm hàng hóa thành công' });
    }
    setSaving(false);
    setModalOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['goods'] });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await base44.entities.Good.delete(deleting.id);
    toast({ title: 'Đã xóa hàng hóa' });
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ['goods'] });
  };

  // Export selected goods
  const handleExportConfirm = async (note) => {
    setConfirming(true);
    const exportedDate = new Date().toISOString();
    for (const id of selected) {
      await base44.entities.Good.update(id, { status: 'exported', exported_date: exportedDate, exported_note: note });
    }
    toast({ title: `Xuất kho thành công ${selected.length} mục` });
    setConfirming(false);
    setSelected([]);
    setExportModalOpen(false);
    qc.invalidateQueries({ queryKey: ['goods'] });
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(g => g.id));
  };

  const selectedItems = allGoods.filter(g => selected.includes(g.id)).map(g => ({ ...g, _entityType: 'good' }));
  const warningCount = allGoods.filter(g => g.time_warning).length;

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['goods'] });
    qc.invalidateQueries({ queryKey: ['pallets'] });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Hàng hóa trong kho"
        description={`${allGoods.length} mục${warningCount > 0 ? ` · ${warningCount} cảnh báo` : ''}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={downloadImportTemplate}>
              <Download className="w-4 h-4 mr-1.5" /> Template nhập
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportGoodsToCSV(filtered)}>
              <FileDown className="w-4 h-4 mr-1.5" /> Xuất CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" /> Import nhập
            </Button>
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => setBulkExportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" /> Import xuất
            </Button>
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => setScanOpen(true)}>
              <Scan className="w-4 h-4 mr-1.5" /> Quét xuất kho
            </Button>
            {selected.length > 0 && (
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setExportModalOpen(true)}>
                <LogOut className="w-4 h-4 mr-1.5" /> Xuất {selected.length} mục
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> Thêm hàng
            </Button>
          </div>
        }
      />

      <div className="space-y-4 mb-6">
        <GoodsFilterBar filters={filters} onFilterChange={setFilters} searchValue={search} onSearchChange={setSearch} pallets={pallets} />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Gom nhóm:</span>
          <Tabs value={groupBy} onValueChange={setGroupBy}>
            <TabsList className="h-8">
              <TabsTrigger value="none" className="text-xs h-6 px-2.5"><List className="w-3 h-3 mr-1" /> Tất cả</TabsTrigger>
              <TabsTrigger value="quarter" className="text-xs h-6 px-2.5"><Layers className="w-3 h-3 mr-1" /> Theo Quý</TabsTrigger>
              <TabsTrigger value="month" className="text-xs h-6 px-2.5"><Layers className="w-3 h-3 mr-1" /> Theo Tháng</TabsTrigger>
              <TabsTrigger value="location" className="text-xs h-6 px-2.5">Theo Vị trí</TabsTrigger>
              <TabsTrigger value="pallet" className="text-xs h-6 px-2.5">Theo Pallet</TabsTrigger>
            </TabsList>
          </Tabs>
          <Badge variant="secondary" className="text-xs">{filtered.length} kết quả</Badge>
          {filtered.length > 0 && (
            <button onClick={toggleAll} className="text-xs text-primary underline underline-offset-2">
              {selected.length === filtered.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Box} title="Không có hàng hóa" description="Thêm hàng hóa hoặc import từ file Excel" actionLabel="Thêm hàng" onAction={() => { setEditing(null); setModalOpen(true); }} />
      ) : grouped ? (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h3 className="font-heading font-semibold text-sm">{key}</h3>
                <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
              </div>
              <GoodsTable goods={items} selected={selected} onToggleSelect={toggleSelect} onEdit={g => { setEditing(g); setModalOpen(true); }} onDelete={g => setDeleting(g)} />
            </div>
          ))}
        </div>
      ) : (
        <GoodsTable goods={filtered} selected={selected} onToggleSelect={toggleSelect} onEdit={g => { setEditing(g); setModalOpen(true); }} onDelete={g => setDeleting(g)} />
      )}

      <GoodFormModal open={modalOpen} onOpenChange={setModalOpen} good={editing} pallets={pallets} onSave={handleSave} saving={saving} />
      <ImportExcelModal open={importOpen} onOpenChange={setImportOpen} pallets={pallets} onImportDone={() => { qc.invalidateQueries({ queryKey: ['goods'] }); qc.invalidateQueries({ queryKey: ['pallets'] }); qc.invalidateQueries({ queryKey: ['locations'] }); }} />
      <ExportModal open={exportModalOpen} onOpenChange={setExportModalOpen} items={selectedItems} onConfirm={handleExportConfirm} confirming={confirming} />
      <ScanExportModal open={scanOpen} onOpenChange={setScanOpen} pallets={pallets} goods={allGoods} onDone={refreshAll} />
      <BulkExportImportModal open={bulkExportOpen} onOpenChange={setBulkExportOpen} pallets={pallets} goods={allGoods} onDone={refreshAll} />
      <ConfirmDialog open={!!deleting} onOpenChange={() => setDeleting(null)} title="Xóa hàng hóa" description={`Bạn có chắc muốn xóa "${deleting?.name}"?`} onConfirm={handleDelete} />
    </div>
  );
}