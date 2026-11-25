import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  MoreVertical, 
  Shield, 
  ShieldAlert, 
  Calendar,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { UserProfile } from '../../types';

interface UserManagerProps {
  users: UserProfile[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onUpdateStatus?: (userId: string, isPremium: boolean) => void;
}

export const CMSUserManager: React.FC<UserManagerProps> = ({ 
  users, 
  searchQuery, 
  setSearchQuery,
}) => {
  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium: {users.filter(u => u.isPremium).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard: {users.filter(u => !u.isPremium).length}</span>
            </div>
          </div>
       </div>

       <div className="overflow-hidden bg-slate-900 border border-slate-800 rounded-[32px]">
         <table className="w-full text-left border-collapse">
           <thead>
             <tr className="border-b border-slate-800">
               <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Details</th>
               <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Access</th>
               <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Add-ons</th>
               <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-800">
             {filteredUsers.map((u) => (
               <motion.tr 
                key={u.uid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-slate-950/50 transition-colors"
               >
                 <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                       {u.photoURL ? (
                         <img src={u.photoURL} className="w-full h-full object-cover" />
                       ) : (
                         <UserIcon className="w-5 h-5 text-slate-500" />
                       )}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-white leading-tight">{u.displayName || 'Anonymous User'}</p>
                       <p className="text-[10px] font-medium text-slate-500">{u.email}</p>
                     </div>
                   </div>
                 </td>
                 <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {u.isPremium ? (
                         <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                           <Shield className="w-3 h-3" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Premium</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5 bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ring-1 ring-slate-700/50">
                           <UserIcon className="w-3 h-3" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Free Tier</span>
                         </div>
                       )}
                    </div>
                 </td>
                 <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {u.isAutismAddonActive && (
                        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full ring-1 ring-blue-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase">Autism Pack</span>
                        </div>
                      )}
                      {!u.isAutismAddonActive && (
                         <span className="text-[10px] text-slate-700 font-bold uppercase">—</span>
                      )}
                    </div>
                 </td>
                 <td className="px-6 py-4 text-right">
                   <button className="p-2 text-slate-600 hover:text-white transition-colors">
                     <MoreVertical className="w-4 h-4" />
                   </button>
                 </td>
               </motion.tr>
             ))}
           </tbody>
         </table>
         
         {filteredUsers.length === 0 && (
           <div className="py-20 text-center">
             <Search className="w-8 h-8 text-slate-800 mx-auto mb-4" />
             <p className="text-xs font-black text-slate-700 uppercase tracking-widest">No users found</p>
           </div>
         )}
       </div>
    </div>
  );
};
