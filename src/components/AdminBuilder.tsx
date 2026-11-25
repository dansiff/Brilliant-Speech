import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Volume2, 
  Video, 
  Image as ImageIcon, 
  Save, 
  Play,
  Upload,
  Sparkles,
  ChevronRight,
  Settings,
  Type,
  Mic,
  Eye,
  Lock,
  Globe,
  Loader2
} from 'lucide-react';
import { Exercise, ExerciseType, Language, Difficulty, CustomExercise } from '../types';
import { toast } from 'sonner';

interface AdminBuilderProps {
  userId: string;
  initialExercise?: CustomExercise | null;
  onSave: (exercise: Partial<CustomExercise>) => Promise<void>;
  onClose: () => void;
}

interface BuilderStep {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'prompt';
  content: string;
  mediaUrl?: string;
  recordingId?: string; // Reference to custom recording
}

export const AdminBuilder: React.FC<AdminBuilderProps> = ({ userId, initialExercise, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'steps' | 'media' | 'preview'>('info');
  const [title, setTitle] = useState(initialExercise?.title || '');
  const [description, setDescription] = useState(initialExercise?.description || '');
  const [category, setCategory] = useState(initialExercise?.category || 'Custom');
  const [price, setPrice] = useState(initialExercise?.price || 0);
  const [isPublished, setIsPublished] = useState(initialExercise?.isPublished || false);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialExercise?.difficulty || Difficulty.EASY);
  const [type, setType] = useState<ExerciseType>(initialExercise?.type || ExerciseType.ARTICULATION);
  
  const [mainAudioUrl, setMainAudioUrl] = useState(initialExercise?.audioUrl || '');
  const [mainVideoUrl, setMainVideoUrl] = useState(initialExercise?.videoUrl || '');

  const [steps, setSteps] = useState<BuilderStep[]>(
    initialExercise?.steps ? initialExercise.steps as BuilderStep[] : [
      { id: '1', type: 'text', content: 'Say the target word clearly.' }
    ]
  );
  
  const [isRecordingMedia, setIsRecordingMedia] = useState(false);
  const [recorderType, setRecorderType] = useState<'audio' | 'video' | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      
      setRecorderType(type);
      setIsRecordingMedia(true);
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: type === 'audio' ? 'audio/webm' : 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      
      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Could not access camera/microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingMedia) {
      mediaRecorderRef.current.stop();
      setIsRecordingMedia(false);
    }
  };

  const useRecording = (stepId?: string) => {
    if (!recordedUrl) return;
    
    if (stepId) {
      handleUpdateStep(stepId, { mediaUrl: recordedUrl });
    } else {
      if (recorderType === 'audio') setMainAudioUrl(recordedUrl);
      if (recorderType === 'video') setMainVideoUrl(recordedUrl);
    }
    
    setRecordedUrl(null);
    setRecordingBlob(null);
    setRecorderType(null);
    toast.success('Recording applied to exercise!');
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddStep = (stepType: BuilderStep['type']) => {
    const newStep: BuilderStep = {
      id: Math.random().toString(36).substr(2, 9),
      type: stepType,
      content: stepType === 'text' ? 'New instruction...' : '',
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleUpdateStep = (id: string, updates: Partial<BuilderStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Drag and Drop handlers
  const onDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const item = newSteps.splice(draggedIndex, 1)[0];
    newSteps.splice(index, 0, item);
    setSteps(newSteps);
    setDraggedIndex(index);
  };

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleGenerateAISteps = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      // In a real app, this would call Gemini. For now, we simulate robust AI generation.
      const simulatedSteps: BuilderStep[] = [
        { id: Math.random().toString(36).substr(2, 9), type: 'text', content: `Introduction to ${aiPrompt}: Welcome to our practice!` },
        { id: Math.random().toString(36).substr(2, 9), type: 'text', content: `First step of ${aiPrompt}: Listen carefully and try to repeat.` },
        { id: Math.random().toString(36).substr(2, 9), type: 'audio', content: 'Target sound recording placeholder', mediaUrl: '' },
      ];
      setSteps([...steps, ...simulatedSteps]);
      toast.success(`Generated 3 steps for ${aiPrompt}!`);
      setAiPrompt('');
    } catch (err) {
      toast.error('AI generation failed');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      toast.error('Title is required');
      return;
    }

    const customEx: Partial<CustomExercise> = {
      ...(initialExercise || {}),
      title,
      description,
      category,
      price,
      isPublished,
      language: Language.ENGLISH,
      difficulty,
      type,
      creatorId: userId,
      imageUrl: steps.find(s => s.type === 'image')?.mediaUrl || initialExercise?.imageUrl || '',
      audioUrl: mainAudioUrl || steps.find(s => s.type === 'audio')?.mediaUrl || '',
      videoUrl: mainVideoUrl || steps.find(s => s.type === 'video')?.mediaUrl || '',
      isPremium: price > 0,
      steps: steps as any,
    };

    await onSave(customEx);
    toast.success('Exercise saved to marketplace!');
    onClose();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 lg:p-8 bg-slate-100/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Exercise Builder</h2>
              <p className="text-sm text-slate-400 font-medium italic">Create custom speech adventures</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Save className="w-5 h-5" />
              Save & Publish
            </button>
          </div>
        </div>

        {/* Builder Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Nav */}
          <div className="w-20 lg:w-64 border-r border-slate-100 p-4 space-y-2">
            {[
              { id: 'info', name: 'General Info', icon: Settings },
              { id: 'steps', name: 'Instruction Steps', icon: Type },
              { id: 'media', name: 'Media Master', icon: Volume2 },
              { id: 'preview', name: 'Preview', icon: Eye }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden lg:inline font-bold uppercase text-xs tracking-widest">{tab.name}</span>
                {activeTab === tab.id && <ChevronRight className="hidden lg:block ml-auto w-4 h-4" />}
              </button>
            ))}

            <div className="pt-8 px-2">
              <h3 className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-4 px-2">Marketplace</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400">STATUS</span>
                    <div 
                      onClick={() => setIsPublished(!isPublished)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isPublished ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isPublished ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Currently {isPublished ? 'Live' : 'Draft'}</p>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">Pricing</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black">$</span>
                    <input 
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="bg-transparent font-black text-xl w-full focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 bg-slate-50/50 overflow-y-auto p-8 no-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Exercise Title</label>
                    <input 
                      type="text"
                      placeholder="e.g., Magical 'S' Island Adventure"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xl font-bold focus:border-primary focus:ring-0 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                    <textarea 
                      placeholder="What will children learn in this session?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 h-32 focus:border-primary focus:ring-0 transition-all outline-none resize-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none"
                      >
                        <option>Articulation</option>
                        <option>Vocabulary</option>
                        <option>Social Skills</option>
                        <option>Animal Fun</option>
                        <option>Stories</option>
                        <option>Games</option>
                        <option>Bilingual</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Difficulty</label>
                      <select 
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none"
                      >
                        <option value={Difficulty.EASY}>Easy Peasy</option>
                        <option value={Difficulty.MEDIUM}>Getting Better</option>
                        <option value={Difficulty.HARD}>Expert Speaker</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'steps' && (
                <motion.div
                  key="steps"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-3xl mx-auto space-y-6"
                >
                  {/* Step Toolbar */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-0 z-10 space-y-4">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                      <button onClick={() => handleAddStep('text')} className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-indigo-50 text-indigo-600 transition-all active:scale-95 shrink-0">
                        <Type className="w-5 h-5" />
                        <span className="font-bold text-xs uppercase tracking-widest">Add Text</span>
                      </button>
                      <button onClick={() => handleAddStep('image')} className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-emerald-50 text-emerald-600 transition-all active:scale-95 shrink-0">
                        <ImageIcon className="w-5 h-5" />
                        <span className="font-bold text-xs uppercase tracking-widest">Add Image</span>
                      </button>
                      <button onClick={() => handleAddStep('audio')} className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-amber-50 text-amber-600 transition-all active:scale-95 shrink-0">
                        <Mic className="w-5 h-5" />
                        <span className="font-bold text-xs uppercase tracking-widest">Add Audio</span>
                      </button>
                      <button onClick={() => handleAddStep('video')} className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-rose-50 text-rose-600 transition-all active:scale-95 shrink-0">
                        <Video className="w-5 h-5" />
                        <span className="font-bold text-xs uppercase tracking-widest">Add Video</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                      <div className="flex-1 relative">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-pulse" />
                        <input 
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="AI: Help me generate steps for 'S' sound practice..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-xs font-medium border-2 border-transparent focus:border-primary/20 outline-none transition-all"
                        />
                      </div>
                      <button
                        onClick={handleGenerateAISteps}
                        disabled={isGeneratingAI || !aiPrompt.trim()}
                        className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        layout
                        draggable
                        onDragStart={() => onDragStart(index)}
                        onDragOver={(e) => onDragOver(e, index)}
                        className={`bg-white rounded-3xl p-6 border-2 shadow-sm flex items-start gap-4 group transition-all ${
                          draggedIndex === index ? 'opacity-50 ring-2 ring-primary border-primary' : 'border-white'
                        }`}
                      >
                        <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-400 mt-2">
                          <GripVertical className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                {index + 1}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {step.type} component
                              </span>
                            </div>
                            <button 
                              onClick={() => handleRemoveStep(step.id)}
                              className="text-slate-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {step.type === 'text' && (
                            <textarea 
                              value={step.content}
                              onChange={(e) => handleUpdateStep(step.id, { content: e.target.value })}
                              className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium border-none focus:ring-0 resize-none h-24"
                            />
                          )}

                          {(step.type === 'image' || step.type === 'audio' || step.type === 'video') && (
                            <div className="space-y-4">
                              <input 
                                type="text"
                                placeholder={`Enter ${step.type} URL or paste media link`}
                                value={step.mediaUrl || ''}
                                onChange={(e) => handleUpdateStep(step.id, { mediaUrl: e.target.value })}
                                className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium border-none focus:ring-0"
                              />
                              <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 group-hover:border-primary/20 transition-colors">
                                {step.type === 'image' && <ImageIcon className="w-8 h-8 mb-2" />}
                                {step.type === 'audio' && <Volume2 className="w-8 h-8 mb-2" />}
                                {step.type === 'video' && <Video className="w-8 h-8 mb-2" />}
                                <p className="text-xs font-bold uppercase tracking-widest">Simulation: Click to "Upload"</p>
                              </div>
                              
                              <div className="flex gap-2">
                                {(step.type === 'audio' || step.type === 'video') && (
                                  <button 
                                    onClick={() => startRecording(step.type as any)}
                                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Mic className="w-4 h-4" />
                                    Record {step.type}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {steps.length === 0 && (
                    <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                      <Plus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <h4 className="font-black text-slate-400 uppercase">Start building!</h4>
                      <p className="text-sm text-slate-300 mt-2">Add your first step from the toolbar above.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'media' && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto space-y-8"
                >
                  <div className="p-8 bg-white border-2 border-slate-100 rounded-[40px] shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Volume2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Main Audio Link</h3>
                        <p className="text-xs text-slate-400 font-medium italic">Used for the overall demonstration</p>
                      </div>
                    </div>
                    <input 
                      type="text"
                      placeholder="Paste .mp3 or high-quality audio URL"
                      value={mainAudioUrl}
                      onChange={(e) => setMainAudioUrl(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-amber-400 outline-none"
                    />
                    <div className="mt-4 p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                      <Mic className="w-8 h-8 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">DRAG & DROP RECORDING HERE</p>
                    </div>
                    <button 
                      onClick={() => startRecording('audio')}
                      className="mt-4 w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Mic className="w-5 h-5" />
                      Start Audio Recording
                    </button>
                  </div>

                  <div className="p-8 bg-white border-2 border-slate-100 rounded-[40px] shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Video className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Walkthrough Video</h3>
                        <p className="text-xs text-slate-400 font-medium italic">Appears in Store and during Practice</p>
                      </div>
                    </div>
                    <input 
                      type="text"
                      placeholder="Paste .mp4, YouTube, or Vimeo link"
                      value={mainVideoUrl}
                      onChange={(e) => setMainVideoUrl(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-rose-400 outline-none"
                    />
                    <div className="mt-4 p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                      <Video className="w-8 h-8 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">DRAG & DROP VIDEO CLIP</p>
                    </div>
                    <button 
                      onClick={() => startRecording('video')}
                      className="mt-4 w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Video className="w-5 h-5" />
                      Start Video Recording
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-8 border-slate-900 border-opacity-5 relative aspect-[16/10]">
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/80 to-transparent z-10 flex items-center justify-between px-8">
                       <span className="text-[10px] font-black uppercase tracking-widest">Exercise Preview</span>
                       <div className="flex gap-1">
                         <div className="w-2 h-2 rounded-full bg-red-400" />
                         <div className="w-2 h-2 rounded-full bg-yellow-400" />
                         <div className="w-2 h-2 rounded-full bg-green-400" />
                       </div>
                    </div>
                    
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
                        <Sparkles className="w-12 h-12" />
                      </div>
                      <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">{title || 'Your Title Here'}</h2>
                      <p className="text-slate-400 font-medium max-w-md mx-auto">{description || 'Your description will appear here when you create it.'}</p>
                      
                      <div className="mt-8 flex gap-4">
                        <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
                          {category}
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest">
                          {difficulty}
                        </div>
                      </div>

                      <button className="mt-12 bg-primary text-white px-12 py-4 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-primary/30">
                        Start Session
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Recording Overlay */}
      <AnimatePresence>
        {isRecordingMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col items-center justify-center p-8"
          >
            <div className="w-full max-w-xl text-center">
              <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-8 mx-auto animate-pulse">
                {recorderType === 'audio' ? <Mic className="w-10 h-10 text-white" /> : <Video className="w-10 h-10 text-white" />}
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Recording {recorderType}...</h3>
              <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-12">System Live • Do not close</p>
              
              {recorderType === 'video' && (
                <div className="aspect-video w-full bg-black rounded-3xl mb-12 overflow-hidden border-2 border-white/20">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                </div>
              )}

              <button 
                onClick={stopRecording}
                className="bg-white text-slate-900 px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Stop & Process
              </button>
            </div>
          </motion.div>
        )}

        {recordedUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] bg-slate-900/90 flex flex-col items-center justify-center p-8"
          >
            <div className="bg-white rounded-[40px] w-full max-w-2xl p-12 text-center shadow-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Review Recording</h3>
              
              <div className="mb-8 w-full">
                {recorderType === 'audio' ? (
                  <audio src={recordedUrl} controls className="w-full" />
                ) : (
                  <video src={recordedUrl} controls className="w-full rounded-2xl" />
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setRecordedUrl(null)}
                  className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={() => useRecording()}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Use Recording
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
