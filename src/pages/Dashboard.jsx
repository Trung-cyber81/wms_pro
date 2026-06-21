import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MapPin, Package, Box, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';

function StatCard({ icon: Icon, label, value, color, delay, to }) {
  return (
    <Link to={to}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold font-heading mt-2 text-foreground">{value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

function QuarterSummaryCard({ goods }) {
  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();

  const quarterData = [1, 2, 3, 4].map(q => {
    const items = goods.filter(g => g.quy === q && g.nam === currentYear);
    const totalQty = items.reduce((s, g) => s + (g.quantity || 0), 0);
    return { quarter: q, count: items.length, totalQty };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Thống kê theo Quý — {currentYear}</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quarterData.map(d => (
              <div
                key={d.quarter}
                className={`rounded-lg p-3 text-center transition-all ${
                  d.quarter === currentQuarter
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-muted'
                }`}
              >
                <p className={`text-xs font-medium ${d.quarter === currentQuarter ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  Q{d.quarter}
                </p>
                <p className="text-xl font-bold font-heading mt-1">{d.count}</p>
                <p className={`text-[10px] mt-0.5 ${d.quarter === currentQuarter ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {d.totalQty} đơn vị
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });
  const { data: pallets = [] } = useQuery({
    queryKey: ['pallets'],
    queryFn: () => base44.entities.Pallet.list(),
  });
  const { data: goods = [] } = useQuery({
    queryKey: ['goods'],
    queryFn: () => base44.entities.Good.list(),
  });

  const warningGoods = goods.filter(g => g.time_warning);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Tổng quan kho hàng"
        description="Quản lý vị trí, pallet và hàng hóa trong kho"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MapPin} label="Vị trí" value={locations.length} color="bg-blue-500" delay={0} to="/locations" />
        <StatCard icon={Package} label="Pallet" value={pallets.length} color="bg-violet-500" delay={0.05} to="/pallets" />
        <StatCard icon={Box} label="Hàng hóa" value={goods.length} color="bg-emerald-500" delay={0.1} to="/goods" />
        <StatCard icon={AlertTriangle} label="Cảnh báo" value={warningGoods.length} color={warningGoods.length > 0 ? "bg-red-500" : "bg-gray-400"} delay={0.15} to="/goods" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <QuarterSummaryCard goods={goods} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/60 h-full">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-sm mb-4">Hàng hóa gần đây</h3>
              {goods.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Chưa có hàng hóa nào</p>
              ) : (
                <div className="space-y-2">
                  {goods.slice(0, 6).map(g => (
                    <div key={g.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${g.type === 'Bulky' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                          {g.type === 'Bulky' ? <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Box className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{g.name}</p>
                          <p className="text-[11px] text-muted-foreground">{g.pallet_name || '—'} · {g.location_name || '—'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-muted-foreground">
                          x{g.quantity || 0}
                        </span>
                        {g.time_warning && <AlertTriangle className="w-3 h-3 text-destructive ml-2 inline" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}