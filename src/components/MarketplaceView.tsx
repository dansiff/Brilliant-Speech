import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Sparkles, 
  Crown, 
  Play, 
  ChevronRight, 
  Search, 
  Filter, 
  Video, 
  Music, 
  CheckCircle2, 
  Clock,
  Star,
  Users,
  LayoutGrid,
  List as ListIcon,
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { MarketplaceItem, UserProfile } from '../types';

interface MarketplaceViewProps {
  user: UserProfile | null;
  items: MarketplaceItem[];
  isSubscribed: boolean;
  onPurchase: (item: MarketplaceItem) => Promise<void>;
  onSubscribe: () => Promise<void>;
  onPreview: (item: MarketplaceItem) => void;
  onEdit: (item: MarketplaceItem) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ 
  user, 
  items, 
  isSubscribed, 
  onPurchase, 
  onSubscribe,
  onPreview,
  onEdit
}) => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'All' || item.category === filter;
    const matchesSearch = item.exercise.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = ['All', 'Articulation', 'Vocabulary', 'Social Skills', 'Stories'];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Hero / Subscription CTA */}
      {!isSubscribed ? (
        <section className="relative overflow-hidden rounded-[48px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-primary p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl pointer-events-none">
            <Crown className="w-96 h-96 -rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Crown className="w-4 h-4 text-yellow-400" />
              Unlimited Access
            </div>
            <h2 className="text-5xl font-black mb-6 leading-[1.1] uppercase tracking-tight">
              One Subscription, <br/> 
              <span className="text-white/60">Every Adventure.</span>
            </h2>
            <p className="text-xl text-indigo-100 font-medium mb-10 max-w-lg">
              Get instant access to over 500+ premium community practices and all future releases.
              Perfect for therapists and power-users.
            </p>
            
            <div className="flex flex-wrap items-center gap-6">
              <button 
                onClick={onSubscribe}
                className="bg-white text-primary px-10 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                Go Unlimited for $14.99/mo
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-200" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Verified Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-200" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-emerald-50 border-2 border-emerald-100 rounded-[40px] p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Crown className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-emerald-900">Your Subscription is Active!</h3>
              <p className="text-emerald-700 font-medium italic">Enjoy total access to the entire marketplace library.</p>
            </div>
          </div>
          <div className="flex -space-x-3">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="w-12 h-12 rounded-full border-4 border-emerald-50 bg-slate-200 overflow-hidden">
                 <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
               </div>
             ))}
             <div className="w-12 h-12 rounded-full border-4 border-emerald-50 bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white">
               +10k
             </div>
          </div>
        </section>
      )}

      {/* Filters & Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shrink-0 ${
                filter === cat 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search adventures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-2xl p-3.5 pl-12 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group bg-white rounded-[40px] border-2 border-slate-100 overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full flex flex-col`}
          >
            {/* Media Preview Area */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
               <img 
                 src={item.exercise.imageUrl || "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=400"} 
                 alt={item.exercise.title} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                 <button 
                   onClick={() => onPreview(item)}
                   className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white"
                 >
                   <Play className="w-4 h-4 fill-current" />
                   Quick Preview
                 </button>
               </div>
               
               {/* Badge Overlays */}
               <div className="absolute top-4 left-4 flex flex-col gap-2">
                 {item.exercise.videoUrl && (
                   <div className="bg-rose-500 text-white p-2 rounded-xl shadow-lg" title="Includes Video">
                     <Video className="w-4 h-4" />
                   </div>
                 )}
                 {item.exercise.audioUrl && (
                    <div className="bg-amber-500 text-white p-2 rounded-xl shadow-lg" title="Includes Sound">
                      <Music className="w-4 h-4" />
                    </div>
                 )}
               </div>

               {item.isFeatured && (
                 <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 p-2 rounded-xl shadow-lg border border-yellow-200">
                   <Sparkles className="w-4 h-4" />
                 </div>
               )}
            </div>

            {/* Content Area */}
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-3 py-1 rounded-full">
                  {item.category}
                </span>
                <div className="flex items-center gap-2">
                  {/* Admin Edit Link */}
                  {(user?.uid === item.exercise.creatorId || user?.email === 'danielSand711@gmail.com' || user?.displayName === 'DanielEsme') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Practice"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                  {isSubscribed ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-lg font-black text-slate-900">${item.price}</span>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-black mb-2 uppercase tracking-tight text-slate-800 line-clamp-1">{item.exercise.title}</h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">{item.exercise.description}</p>
              
              <div className="mt-auto space-y-6">
                 <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                        <img src={`https://i.pravatar.cc/100?u=${item.exercise.creatorId}`} alt={item.creatorName} />
                     </div>
                     <span className="text-xs font-bold text-slate-400 italic">by {item.creatorName}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 text-slate-400">
                       <Clock className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold">15m</span>
                     </div>
                     <div className="flex items-center gap-1 text-yellow-400">
                       <Star className="w-3.5 h-3.5 fill-current" />
                       <span className="text-[10px] font-bold">4.9</span>
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => onPurchase(item)}
                     disabled={isSubscribed || user?.purchasedExerciseIds.includes(item.id)}
                     className={`flex-1 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                       isSubscribed || user?.purchasedExerciseIds.includes(item.id)
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                     }`}
                   >
                     {isSubscribed ? 'Included in Sub' : (user?.purchasedExerciseIds.includes(item.id) ? 'Already Owned' : (
                       <>
                         <ShoppingBag className="w-4 h-4" />
                         Unlock Adventure
                       </>
                     ))}
                   </button>
                   <button 
                     className="w-12 h-12 rounded-[20px] bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors"
                     title="Share"
                   >
                     <Users className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-32 text-center">
           <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-8">
             <Search className="w-12 h-12" />
           </div>
           <h3 className="text-3xl font-black text-slate-300 uppercase tracking-tight">No adventures found</h3>
           <p className="text-slate-400 font-medium mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};
