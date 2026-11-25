import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Search, 
  MoreVertical, 
  DollarSign, 
  Star,
  ExternalLink
} from 'lucide-react';
import { MarketplaceItem } from '../../types';

interface MarketplaceManagerProps {
  items: MarketplaceItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onToggleFeatured: (item: MarketplaceItem) => void;
}

export const CMSMarketplaceManager: React.FC<MarketplaceManagerProps> = ({ 
  items, 
  searchQuery, 
  setSearchQuery,
  onToggleFeatured
}) => {
  const filteredItems = items.filter(i => 
    i.exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.creatorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search items or creators..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
            />
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredItems.map((item) => (
            <motion.div 
              layout
              key={item.id} 
              className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden group hover:border-emerald-500/30 transition-all flex flex-col"
            >
              <div className="h-44 bg-slate-800 relative">
                <img src={item.exercise.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 right-4 z-10">
                   <button 
                     onClick={() => onToggleFeatured(item)}
                     className={`p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all ${item.isFeatured ? 'bg-amber-400 text-slate-900 border-transparent' : 'bg-slate-900/80 text-slate-400 border border-slate-700 hover:text-white'}`}
                   >
                      <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-current' : ''}`} />
                   </button>
                </div>
                <div className="absolute bottom-4 left-4">
                   <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                     <DollarSign className="w-3 h-3 text-emerald-400" />
                     <span className="text-xs font-black text-white">{item.price}</span>
                   </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                 <div className="flex-1">
                   <h4 className="font-black text-lg text-white mb-1 group-hover:text-emerald-400 transition-colors uppercase tracking-tight italic">{item.exercise.title}</h4>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     CREATOR: <span className="text-slate-300">{item.creatorName}</span>
                   </p>
                 </div>
                 
                 <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">124 Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-600 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-600 hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                 </div>
              </div>
            </motion.div>
         ))}

         {filteredItems.length === 0 && (
           <div className="col-span-full py-20 text-center">
             <ShoppingBag className="w-12 h-12 text-slate-800 mx-auto mb-4" />
             <p className="text-sm font-black text-slate-700 uppercase tracking-widest text-balance max-w-xs mx-auto">Marketplace inventory filter yielded no results</p>
           </div>
         )}
       </div>
    </div>
  );
};
