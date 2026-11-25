import { 
  Settings, 
  Database, 
  Shield, 
  Zap, 
  Lock, 
  Server,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export const CMSSettingsManager: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Platform Toggles</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Maintenance Mode', desc: 'Displays maintenance overlay to all users', active: false },
              { label: 'New User Registration', desc: 'Allow new user signups via Google', active: true },
              { label: 'Marketplace Submissions', desc: 'Allow creators to list new items', active: true },
              { label: 'AI Generation Features', desc: 'Global toggle for Gemini API features', active: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">{s.label}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{s.desc}</p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${s.active ? 'bg-primary' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${s.active ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Database Ops</h3>
          </div>

          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase text-slate-200">Revalidate Indices</span>
              </div>
              <Lock className="w-3.5 h-3.5 text-slate-700" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-rose-500/50 transition-all">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-black uppercase text-slate-200">Wipe Cache</span>
              </div>
              <Lock className="w-3.5 h-3.5 text-slate-700" />
            </button>

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Instance Info</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-medium">Region: us-east1</p>
                <p className="text-[10px] text-slate-400 font-medium">Tier: Enterprise Firestore</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500">v1.2</div>
            <div>
              <p className="text-sm font-black text-white uppercase italic">Security Shield v4.0</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Last Audit: 4h ago • All systems nominal</p>
            </div>
         </div>
         <button 
          onClick={() => toast.success('Security audit reports exported to admin email')}
          className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
         >
           Export Audit Logs
         </button>
      </div>
    </div>
  );
};
