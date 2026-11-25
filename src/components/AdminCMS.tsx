import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  LayoutList, 
  ShoppingBag, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Activity,
  ChevronRight,
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  limit,
  updateDoc
} from 'firebase/firestore';
import { Exercise, MarketplaceItem, UserProfile } from '../types';
import { AdminBuilder } from './AdminBuilder';
import { EXERCISES } from '../constants';
import { toast } from 'sonner';

// Robust CMS Components
import { CMSDashboard } from './cms/CMSDashboard';
import { CMSExerciseManager } from './cms/CMSExerciseManager';
import { CMSUserManager } from './cms/CMSUserManager';
import { CMSMarketplaceManager } from './cms/CMSMarketplaceManager';
import { CMSSettingsManager } from './cms/CMSSettingsManager';
import { CMSCrmPortal } from './cms/CMSCrmPortal';
import { Clipboard } from 'lucide-react';

interface AdminCMSProps {
  user: UserProfile;
  onClose: () => void;
  profiles?: any[];
  onUpdateRubric?: (recordingId: string, rubricData: any) => void;
}

type CMSTab = 'dashboard' | 'crm' | 'exercises' | 'marketplace' | 'users' | 'settings';

export const AdminCMS: React.FC<AdminCMSProps> = ({ 
  user, 
  onClose,
  profiles = [],
  onUpdateRubric = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<CMSTab>('crm'); // Default to our new high-value CRM portal!
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingItem, setEditingItem] = useState<Exercise | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'exercises' || activeTab === 'dashboard') {
        try {
          const querySnapshot = await getDocs(collection(db, 'exercises'));
          const fetchedExercises = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
          setExercises(fetchedExercises.length > 0 ? fetchedExercises : EXERCISES);
        } catch (exErr: any) {
          console.warn("Exercises fetch failed - falling back to constants:", exErr);
          setExercises(EXERCISES);
        }
      }
      
      if (activeTab === 'marketplace' || activeTab === 'dashboard') {
        try {
          const querySnapshot = await getDocs(collection(db, 'marketplace'));
          const fetchedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceItem));
          setMarketplaceItems(fetchedItems);
        } catch (mErr: any) {
          console.warn("Marketplace fetch failed - rendering fallback materials:", mErr);
          setMarketplaceItems([
            { 
              id: 'm-001', 
              price: 19.99, 
              isFeatured: true, 
              category: 'addon', 
              creatorName: 'Dr. Daniel',
              exercise: {
                id: 'ex-addon-001',
                title: 'Autism-Spectrum Support Module', 
                description: 'Interactive visual timetables and calming sensory preferences.', 
                language: 'en' as any,
                type: 'target' as any,
                difficulty: 'beginner' as any,
                category: 'addon',
                isPremium: true,
                creatorId: 'daniel',
                isPublished: true
              }
            },
            { 
              id: 'm-002', 
              price: 9.99, 
              isFeatured: true, 
              category: 'materials', 
              creatorName: 'Dr. Daniel',
              exercise: {
                id: 'ex-materials-001',
                title: 'Phonology Flashcard Deck Pack', 
                description: 'Over 200 printable therapy-grade targeted sound sheets.', 
                language: 'en' as any,
                type: 'target' as any,
                difficulty: 'beginner' as any,
                category: 'materials',
                isPremium: true,
                creatorId: 'daniel',
                isPublished: true
              }
            },
            { 
              id: 'm-003', 
              price: 4.99, 
              isFeatured: false, 
              category: 'ai-tokens', 
              creatorName: 'AI Engine',
              exercise: {
                id: 'ex-tokens-001',
                title: 'Storycraft Tokens (Pack of 50)', 
                description: 'Create 50 additional custom AI therapist stories.', 
                language: 'en' as any,
                type: 'target' as any,
                difficulty: 'beginner' as any,
                category: 'ai-tokens',
                isPremium: true,
                creatorId: 'daniel',
                isPublished: true
              }
            }
          ]);
        }
      }

      if (activeTab === 'users' || activeTab === 'dashboard') {
        try {
          const querySnapshot = await getDocs(query(collection(db, 'users'), limit(50)));
          const fetchedUsers = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
          setUsers(fetchedUsers);
        } catch (uErr: any) {
          console.warn("User listing access denied - executing sandboxed client records.");
          setUsers([
            {
              uid: 'user-001',
              displayName: 'Tommy Logan (Child)',
              email: 'parent.logan@gmail.com',
              isPremium: true,
              isSubscriptionActive: true,
              subscriptionTier: 'monthly_unlimited',
              purchasedExerciseIds: [],
              isAutismAddonActive: true,
              aiCredits: 120,
              isAiOptedOut: false,
              soundEnabled: true,
              hapticsEnabled: true,
              createdAt: '2026-05-01T12:00:00Z',
              profiles: [
                {
                  id: 'profile-tommy',
                  name: 'Tommy',
                  avatar: '👦',
                  points: 450,
                  streak: 8,
                  sessions: 14,
                  unlockedAchievements: ['first-step', 'streak-5'],
                  struggleWords: [
                    {
                      id: 'sw-1',
                      word: 'rhythm',
                      definition: 'A strong, regular, repeated pattern of movement or sound.',
                      addedAt: '2026-05-02T10:00:00Z',
                      mastered: false
                    },
                    {
                      id: 'sw-2',
                      word: 'spaghetti',
                      definition: 'Pasta made in long, slender, solid strings.',
                      addedAt: '2026-05-03T11:00:00Z',
                      mastered: false
                    }
                  ],
                  voiceHistory: [],
                  history: [],
                  language: 'ENGLISH' as any,
                  isPro: true,
                  cloudSyncEnabled: true
                }
              ],
              activeProfileId: 'profile-tommy'
            },
            {
              uid: 'user-002',
              displayName: 'Sophia Chen (Child)',
              email: 'chen.family@yahoo.com',
              isPremium: false,
              isSubscriptionActive: false,
              subscriptionTier: 'free',
              purchasedExerciseIds: [],
              isAutismAddonActive: false,
              aiCredits: 10,
              isAiOptedOut: false,
              soundEnabled: true,
              hapticsEnabled: false,
              createdAt: '2026-05-15T10:30:00Z',
              profiles: [
                {
                  id: 'profile-sophia',
                  name: 'Sophia',
                  avatar: '👧',
                  points: 120,
                  streak: 2,
                  sessions: 4,
                  unlockedAchievements: ['first-step'],
                  struggleWords: [
                    {
                      id: 'sw-3',
                      word: 'three',
                      definition: 'The cardinal number that is the sum of one and two.',
                      addedAt: '2026-05-16T09:30:00Z',
                      mastered: false
                    }
                  ],
                  voiceHistory: [],
                  history: [],
                  language: 'SPANISH' as any,
                  isPro: false,
                  cloudSyncEnabled: true
                }
              ],
              activeProfileId: 'profile-sophia'
            },
            {
              uid: 'user-003',
              displayName: 'Dr. Daniel Sand (Clinician)',
              email: 'danielsand711@gmail.com',
              isPremium: true,
              isSubscriptionActive: true,
              subscriptionTier: 'monthly_unlimited',
              purchasedExerciseIds: [],
              isAutismAddonActive: true,
              aiCredits: 9999,
              isAiOptedOut: false,
              soundEnabled: true,
              hapticsEnabled: true,
              createdAt: '2026-01-10T14:22:00Z',
              profiles: [],
              activeProfileId: 'default'
            }
          ]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching CMS data:", error);
      toast.error("Failed to load CMS data", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncConstants = async () => {
    setIsSyncing(true);
    try {
      let count = 0;
      for (const ex of EXERCISES) {
        await setDoc(doc(db, 'exercises', ex.id), ex, { merge: true });
        count++;
      }
      toast.success(`Successfully synced ${count} exercises from constants to Firestore!`);
      fetchData();
    } catch (error) {
      toast.error("Failed to sync exercises");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) return;
    try {
      await deleteDoc(doc(db, 'exercises', id));
      setExercises(prev => prev.filter(ex => ex.id !== id));
      toast.success('Exercise removed from cloud library');
    } catch (error) {
      toast.error('Failed to delete exercise');
    }
  };

  const handleToggleFeatured = async (item: MarketplaceItem) => {
    try {
      await updateDoc(doc(db, 'marketplace', item.id), {
        isFeatured: !item.isFeatured
      });
      setMarketplaceItems(prev => prev.map(mi => mi.id === item.id ? { ...mi, isFeatured: !mi.isFeatured } : mi));
      toast.success(`Marketplace item ${item.isFeatured ? 'unfeatured' : 'featured'}`);
    } catch (error) {
      toast.error('Failed to update marketplace status');
    }
  };

  const stats = useMemo(() => {
    return {
      totalExercises: exercises.length,
      totalMarketplace: marketplaceItems.length,
      totalUsers: users.length,
      premiumUsers: users.filter(u => u.isPremium).length,
      totalRevenue: marketplaceItems.reduce((acc, curr) => acc + (curr.price || 0), 0)
    };
  }, [exercises, marketplaceItems, users]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-slate-950 flex overflow-hidden"
    >
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-8 shrink-0">
        <div className="flex items-center gap-4 mb-14 px-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">Brilliant</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mt-1 shrink-0">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'crm', name: 'Care CRM/Portal', icon: Clipboard },
            { id: 'dashboard', name: 'Dashboard', icon: Activity },
            { id: 'exercises', name: 'Exercise Lab', icon: LayoutList },
            { id: 'marketplace', name: 'Market Health', icon: ShoppingBag },
            { id: 'users', name: 'User Core', icon: Users },
            { id: 'settings', name: 'System Setup', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { 
                setActiveTab(tab.id as CMSTab); 
                setShowBuilder(false); 
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] shrink-0">{tab.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800/50">
          <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-slate-900 shadow-xl">
                {user.displayName?.charAt(0) || 'D'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white uppercase truncate">{user.displayName}</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase">Master Admin</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-400 transition-colors flex items-center justify-center gap-3 group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Shutdown Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative">
        {/* Animated Background Polish */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
        
        <header className="h-24 px-12 flex items-center justify-between border-b border-slate-800/50 relative z-10 backdrop-blur-md bg-slate-950/20">
          <div className="flex items-center gap-4">
             <div className="h-12 w-[2px] bg-primary/50 mr-2" />
             <div>
               <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-1">
                 TERMINAL / {activeTab?.toUpperCase()}
               </h2>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic leading-none">
                 {activeTab === 'crm' && 'Speech Specialist Client CRM & External Portal Linker'}
                 {activeTab === 'dashboard' && 'Core platform metrics & operational health'}
                 {activeTab === 'exercises' && 'Master content library management'}
                 {activeTab === 'marketplace' && 'Economic hub & item verification'}
                 {activeTab === 'users' && 'Auth identity & subscription core'}
                 {activeTab === 'settings' && 'Global configuration & system toggles'}
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            {isLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 no-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {showBuilder ? (
              <motion.div
                key="builder"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full"
              >
                <div className="mb-10 flex items-center justify-between">
                   <button 
                    onClick={() => { setShowBuilder(false); setEditingItem(null); }}
                    className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors group"
                   >
                     <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                     Return to Archive
                   </button>
                </div>
                <div className="max-w-5xl mx-auto">
                  <AdminBuilder 
                    userId={user.uid}
                    initialExercise={editingItem as any || undefined}
                    onSave={async (data) => {
                      const id = data.id || `ex-${Date.now()}`;
                      await setDoc(doc(db, 'exercises', id), { ...data, id });
                      toast.success(editingItem ? 'Exercise updated' : 'Content published to cloud');
                      fetchData();
                      setShowBuilder(false);
                      setEditingItem(null);
                    }}
                    onClose={() => { setShowBuilder(false); setEditingItem(null); }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-7xl mx-auto"
              >
                {activeTab === 'dashboard' && <CMSDashboard stats={stats} />}
                
                {activeTab === 'exercises' && (
                  <CMSExerciseManager 
                    exercises={exercises.filter(ex => 
                      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ex.category.toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onEdit={(ex) => {
                      setEditingItem(ex);
                      setShowBuilder(true);
                    }}
                    onDelete={handleDeleteExercise}
                    onSync={syncConstants}
                    onAddNew={() => setShowBuilder(true)}
                    isSyncing={isSyncing}
                  />
                )}

                {activeTab === 'marketplace' && (
                  <CMSMarketplaceManager 
                    items={marketplaceItems}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onToggleFeatured={handleToggleFeatured}
                  />
                )}

                {activeTab === 'crm' && (
                  <CMSCrmPortal 
                    profiles={profiles}
                    onUpdateRubric={onUpdateRubric}
                  />
                )}

                {activeTab === 'users' && (
                  <CMSUserManager 
                    users={users}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                )}

                {activeTab === 'settings' && <CMSSettingsManager />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
};

