import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { FileDown, Box, Package, MapPin, AlertTriangle, TrendingUp, Weight } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { downloadCSV } from '@/lib/exportUtils';

export default function InventoryReport() {
  const { data: goods = [], isLoading: loadingGoods } = useQuery({
    queryKey: ['inventory-goods'],
    queryFn: () => base44.entities.Good.filter({ status: 'in_stock' }, '-created_date', 1000),
  });
  const { data: pallets = [], isLoading: loadingPallets } = useQuery({
    queryKey: ['inventory-pallets'],
    queryFn: () => base44.entities.Pallet.filter({ status: 'in_stock' }),
  });
  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['inventory-locations'],
    queryFn: () => base44.entities.Location.list(),
  });
  const { data: exportedGoods = [] } = useQuery({
    queryKey: ['inventory-exported-goods'],
    queryFn: () => base44.entities.Good.filter({ status: 'exported' }, '-exported_date', 1000),
  });
  const { data: exportedPallets = [] } = useQuery({
    queryKey: ['inventory-exported-pallets'],
    queryFn: () => base44.entities.Pallet.filter({ status: 'exported' }),
  });

  const isLoading = loadingGoods || loadingPallets || loadingLocations;

  const totalQty = goods.reduce((s, g) => s + (g.quantity || 0), 0);
  const totalWeight = goods.reduce((s, g) => s + (g.weight_kg || 0) * (g.quantity || 0), 0);
  const damagedGoods = goods.filter(g => g.damage_rate > 0);
  const avgDamage = damagedGoods.length > 0 ? (damagedGoods.reduce((s, g) => s + g.damage_rate, 0) / damagedGoods.length).toFixed(1) : 0;

  const downloadInventoryGoods = () => {
    const rows = goods.map(g => ({
      'Mã hàng (SKU)': g.sku || '',
      'Tên hàng': g.name || '',
      'Loại': g.type || '',
      'Mã đơn hàng': g.order_id || '',
      'Nhà cung cấp': g.supplier || '',
      'Số lượng': g.quantity ?? 0,
      'Tỷ lệ HH (%)': g.damage_rate != null ? g.damage_rate : '',
      'Trọng lượng (kg)': g.weight_kg != null ? g.weight_kg : '',
      'Ngày nhập kho': g.received_date || '',
      'Pallet': g.pallet_name || '',
      'Vị trí': g.location_name || '',
      'Quý': g.quy || '',
      'Tháng': g.thang || '',
      'Năm': g.nam || '',
      'Ghi chú': g.notes || '',
    }));
    downloadCSV(rows, `ton_kho_hang_hoa_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadInventoryPallets = () => {
    const rows = pallets.map(p => {
      const palletGoods = goods.filter(g => g.pallet_id === p.id);
      return {
        'Mã Pallet': p.name || '',
        'Vị trí': p.location_name || '',
        'Mã vạch': p.barcode || '',
        'Số hàng hóa': palletGoods.length,
        'Tổng SL': palletGoods.reduce((s, g) => s + (g.quantity || 0), 0),
        'Ghi chú': p.notes || '',
      };
    });
    downloadCSV(rows, `ton_kho_pallet_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadInventoryLocations = () => {
    const rows = locations.map(l => {
      const locPallets = pallets.filter(p => p.location_id === l.id || p.location_name === l.name);
      const locGoods = goods.filter(g => g.location_name === l.name);
      return {
        'Vị trí': l.name || '',
        'Mã vị trí': l.code || '',
        'Mô tả': l.description || '',
        'Số Pallet': locPallets.length,
        'Số hàng hóa': locGoods.length,
        'Tổng SL hàng': locGoods.reduce((s, g) => s + (g.quantity || 0), 0),
      };
    });
    downloadCSV(rows, `ton_kho_vi_tri_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadFullReport = () => {
    const rows = goods.map(g => ({
      'Mã hàng (SKU)': g.sku || '',
      'Tên hàng': g.name || '',
      'Loại': g.type || '',
      'Mã đơn hàng': g.order_id || '',
      'Nhà cung cấp': g.supplier || '',
      'Số lượng': g.quantity ?? 0,
      'Tỷ lệ HH (%)': g.damage_rate != null ? g.damage_rate : '',
      'Trọng lượng (kg)': g.weight_kg != null ? g.weight_kg : '',
      'Ngày nhập kho': g.received_date || '',
      'Pallet': g.pallet_name || '',
      'Vị trí': g.location_name || '',
      'Quý': g.quy || '',
      'Tháng': g.thang || '',
      'Năm': g.nam || '',
      'Mã vạch': g.barcode || '',
      'Ghi chú': g.notes || '',
      'Trạng thái': 'Trong kho',
    }));

    // Also add exported goods
    exportedGoods.forEach(g => {
      rows.push({
        'Mã hàng (SKU)': g.sku || '',
        'Tên hàng': g.name || '',
        'Loại': g.type || '',
        'Mã đơn hàng': g.order_id || '',
        'Nhà cung cấp': g.supplier || '',
        'Số lượng': g.quantity ?? 0,
        'Tỷ lệ HH (%)': g.damage_rate != null ? g.damage_rate : '',
        'Trọng lượng (kg)': g.weight_kg != null ? g.weight_kg : '',
        'Ngày nhập kho': g.received_date || '',
        'Pallet': g.pallet_name || '',
        'Vị trí': g.location_name || '',
        'Quý': g.quy || '',
        'Tháng': g.thang || '',
        'Năm': g.nam || '',
        'Mã vạch': g.barcode || '',
        'Ghi chú': g.notes || '',
        'Trạng thái': 'Đã xuất kho',
      });
    });

    downloadCSV(rows, `bao_cao_tong_hop_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const stats = [
    { label: 'Hàng trong kho', value: goods.length, sub: `${totalQty} đơn vị`, icon: Box, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Pallet đang dùng', value: pallets.length, sub: `${locations.length} vị trí`, icon: Package, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Tổng trọng lượng', value: `${totalWeight.toFixed(1)} kg`, sub: `${goods.length} mặt hàng`, icon: Weight, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Hàng hư hỏng', value: damagedGoods.length, sub: `TB ${avgDamage}%`, icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  ];

  const downloads = [
    { label: 'Tồn kho hàng hóa', desc: `${goods.length} mặt hàng đang trong kho`, onClick: downloadInventoryGoods, icon: Box, color: 'border-blue-200 dark:border-blue-800' },
    { label: 'Tồn kho Pallet', desc: `${pallets.length} pallet với chi tiết hàng chứa`, onClick: downloadInventoryPallets, icon: Package, color: 'border-amber-200 dark:border-amber-800' },
    { label: 'Tồn kho theo Vị trí', desc: `${locations.length} vị trí với thống kê hàng`, onClick: downloadInventoryLocations, icon: MapPin, color: 'border-green-200 dark:border-green-800' },
    { label: 'Báo cáo tổng hợp', desc: `Toàn bộ ${goods.length + exportedGoods.length} hàng (trong kho + đã xuất)`, onClick: downloadFullReport, icon: TrendingUp, color: 'border-purple-200 dark:border-purple-800' },
  ];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Tải tồn kho" description="Tổng quan và tải báo cáo tồn kho dạng CSV" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold font-mono">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Downloads */}
      <h2 className="font-heading font-semibold text-sm mb-4 uppercase tracking-wide text-muted-foreground">Tải xuống báo cáo</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {downloads.map((d, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <Card className={`${d.color} hover:shadow-md transition-shadow cursor-pointer`} onClick={d.onClick}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <d.icon className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{d.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                </div>
                <FileDown className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}