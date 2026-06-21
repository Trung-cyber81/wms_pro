import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import LocationFormModal from '@/components/locations/LocationFormModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function Locations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const filtered = locations.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    setSaving(true);
    if (editing?.id) {
      await base44.entities.Location.update(editing.id, data);
      toast({ title: 'Cập nhật thành công' });
    } else {
      await base44.entities.Location.create(data);
      toast({ title: 'Thêm vị trí thành công' });
    }
    setSaving(false);
    setModalOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ['locations'] });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await base44.entities.Location.delete(deleting.id);
    toast({ title: 'Đã xóa vị trí' });
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ['locations'] });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Vị trí kho"
        description={`${locations.length} vị trí`}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Thêm vị trí
          </Button>
        }
      />

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm vị trí..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={MapPin}
          title="Chưa có vị trí nào"
          description="Thêm vị trí kho để bắt đầu quản lý"
          actionLabel="Thêm vị trí"
          onAction={() => { setEditing(null); setModalOpen(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((loc, i) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="group hover:shadow-md transition-all duration-200 border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{loc.name}</h3>
                          {loc.code && <p className="text-xs text-muted-foreground font-mono mt-0.5">{loc.code}</p>}
                          {loc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{loc.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(loc); setModalOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(loc)}>
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

      <LocationFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        location={editing}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Xóa vị trí"
        description={`Bạn có chắc muốn xóa vị trí "${deleting?.name}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}