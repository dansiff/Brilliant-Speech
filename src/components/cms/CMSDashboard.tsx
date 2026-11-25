import { motion } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  FileText, 
  CreditCard,
  Cloud,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface DashboardStats {
  totalExercises: number;
  totalMarketplace: number;
  totalUsers: number;
  premiumUsers: number;
  totalRevenue: number;
}

interface DashboardProps {
  stats: DashboardStats;
}

export const CMSDashboard: React.FC<DashboardProps> = ({ stats }) => {
  const cards = [
    { label: 'Total Content', value: stats.totalExercises, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/5' },
    { label: 'Platform Users', value: stats.totalUsers, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/5' },
    { label: 'Market Items', value: stats.totalMarketplace, icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
    { label: 'Market Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-400/5' },
  ];

  return (
    <div className="space-y-8">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-slate-900 border border-slate-800 p-6 rounded-[32px] relative overflow-hidden group hover:border-${stat.color.split('-')[1]}-500/30 transition-all`}
          >
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[8px] font-black underline uppercase underline-offset-2">+12%</span>
              </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat.bg.replace('5', '10')} rounded-full blur-3xl group-hover:bg-primary/20 transition-all`} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Logs / Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Operational Stream</h3>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:underline">
              Clear Logs <Activity className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
             {[
               { icon: Cloud, text: 'Automated Firestore sync completed', time: '2m ago', type: 'success' },
               { icon: CreditCard, text: 'New marketplace purchase: Advanced Syntax Pack', time: '14m ago', type: 'info' },
               { icon: Users, text: 'New premium user registered: user_9821', time: '1h ago', type: 'info' },
               { icon: Clock, text: 'System backup routine initiated', time: '3h ago', type: 'warning' },
             ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 group hover:border-slate-700 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${log.type === 'success' ? 'bg-emerald-500/5 text-emerald-500' : 'bg-slate-800 text-slate-400'} flex items-center justify-center`}>
                    <log.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-200">{log.text}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase mt-0.5 tracking-widest">{log.time}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-white transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
             ))}
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 flex flex-col h-full">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-8">Node Metrics</h3>
            
            <div className="space-y-6">
              {[
                { label: 'DB Latency', val: '24ms', perc: 85, color: 'bg-emerald-500' },
                { label: 'IO Throughput', val: '1.2GB/s', perc: 60, color: 'bg-primary' },
                { label: 'Uptime', val: '99.98%', perc: 99, color: 'bg-blue-400' },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{m.label}</span>
                    <span className="text-white">{m.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.perc}%` }}
                      className={`h-full ${m.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 group">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Status: Operational</h4>
                <p className="text-[10px] text-emerald-500/60 font-medium">All cloud regions are responding normally. Backups active.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
