import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  Settings, 
  Code, 
  Plus, 
  Trash2, 
  Move, 
  ChevronRight, 
  ChevronDown,
  Maximize2,
  Minimize2,
  Save,
  Eye,
  Type,
  Square,
  Columns,
  Grid,
  Palette,
  MousePointer2,
  Copy,
  Check,
  X,
  Layers,
  Smartphone,
  Monitor,
  FileText,
  Image as ImageIcon,
  MoveHorizontal,
  LayoutGrid
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

// --- Types ---

type ComponentType = 'HEADING' | 'TEXT' | 'BUTTON' | 'CARD' | 'GRID' | 'SPACER' | 'IMAGE';

interface BuilderComponent {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: BuilderComponent[];
}

interface BuilderState {
  components: BuilderComponent[];
  selectedId: string | null;
  viewport: 'mobile' | 'desktop';
}

// --- Sortable Item Component ---

interface SortableItemProps {
  component: BuilderComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ component, isSelected, onSelect, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const renderComponent = () => {
    const { props } = component;
    switch (component.type) {
      case 'HEADING':
        return (
          <h2 className={cn(
            "font-black uppercase tracking-tight",
            props.size === 'sm' ? 'text-xl' : props.size === 'lg' ? 'text-4xl' : 'text-2xl',
            props.align === 'center' ? 'text-center' : props.align === 'right' ? 'text-right' : 'text-left',
            props.color || 'text-slate-900'
          )}>
            {props.text || 'New Heading'}
          </h2>
        );
      case 'TEXT':
        return (
          <p className={cn(
            "text-slate-600 leading-relaxed",
            props.size === 'xs' ? 'text-xs' : props.size === 'lg' ? 'text-lg' : 'text-sm',
            props.align === 'center' ? 'text-center' : props.align === 'right' ? 'text-right' : 'text-left'
          )}>
            {props.text || 'Enter your text here...'}
          </p>
        );
      case 'BUTTON':
        return (
          <div className={cn(
            "flex",
            props.align === 'center' ? 'justify-center' : props.align === 'right' ? 'justify-end' : 'justify-start'
          )}>
            <button className={cn(
              "px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all",
              props.variant === 'outline' ? 'border-2 border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]'
            )}>
              {props.text || 'Click Me'}
            </button>
          </div>
        );
      case 'CARD':
        return (
          <div className={cn(
            "p-6 rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm",
            props.padding || 'p-6'
          )}>
            <div className="space-y-2">
              <h3 className="font-bold text-lg">{props.title || 'Card Title'}</h3>
              <p className="text-sm text-slate-500">{props.description || 'Card description goes here.'}</p>
            </div>
          </div>
        );
      case 'SPACER':
        return <div style={{ height: `${props.height || 24}px` }} className="w-full bg-slate-50/50 border-y border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300 uppercase font-black">Spacer {props.height || 24}px</div>;
      case 'IMAGE':
        return (
          <div className={cn(
            "overflow-hidden rounded-3xl bg-slate-100 aspect-video flex items-center justify-center",
            props.ratio === 'square' ? 'aspect-square' : 'aspect-video'
          )}>
            {props.url ? (
              <img src={props.url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Palette className="w-8 h-8 text-slate-300" />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component.id);
      }}
      className={cn(
        "group relative p-2 mb-2 rounded-xl transition-all border-2 cursor-pointer",
        isSelected ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-transparent hover:border-slate-200"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-white border border-slate-200 rounded-md shadow-sm cursor-grab active:cursor-grabbing z-10"
      >
        <Move className="w-3 h-3 text-slate-400" />
      </div>

      {/* Action Buttons */}
      <div className="absolute -right-3 top-0 opacity-0 group-hover:opacity-100 flex flex-col gap-1 z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(component.id);
          }}
          className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="pointer-events-none">
        {renderComponent()}
      </div>
    </div>
  );
};

// --- Visual Builder Component ---

export const VisualBuilder: React.FC = () => {
  const [state, setState] = useState<BuilderState>({
    components: [
      { id: '1', type: 'HEADING', props: { text: 'Welcome to the Builder', size: 'lg', align: 'center' } },
      { id: '2', type: 'TEXT', props: { text: 'This is a robust drag-and-drop CMS for your speech therapy app. Start by adding components from the left.', align: 'center' } },
      { id: '3', type: 'SPACER', props: { height: 40 } },
      { id: '4', type: 'CARD', props: { title: 'AI Speech Scoring', description: 'Real-time feedback for your child.' } },
    ],
    selectedId: null,
    viewport: 'desktop'
  });

  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setState((prev) => {
        const oldIndex = prev.components.findIndex((c) => c.id === active.id);
        const newIndex = prev.components.findIndex((c) => c.id === over.id);
        return {
          ...prev,
          components: arrayMove(prev.components, oldIndex, newIndex),
        };
      });
    }
  };

  const addComponent = (type: ComponentType) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newComp: BuilderComponent = {
      id: newId,
      type,
      props: type === 'HEADING' ? { text: 'New Heading', size: 'md' } :
             type === 'TEXT' ? { text: 'New text content...' } :
             type === 'BUTTON' ? { text: 'Action Button', variant: 'solid' } :
             type === 'CARD' ? { title: 'New Card', description: 'Description' } :
             type === 'SPACER' ? { height: 24 } :
             type === 'IMAGE' ? { url: '', ratio: 'video' } : {}
    };
    setState(prev => ({
      ...prev,
      components: [...prev.components, newComp],
      selectedId: newId
    }));
    toast.success(`Added ${type.toLowerCase()}`);
  };

  const deleteComponent = (id: string) => {
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId
    }));
  };

  const updateProp = (id: string, key: string, value: any) => {
    setState(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === id ? { ...c, props: { ...c.props, [key]: value } } : c
      )
    }));
  };

  const selectedComponent = state.components.find(c => c.id === state.selectedId);

  const generateCode = () => {
    let code = `import React from 'react';\n\nexport const GeneratedLayout = () => {\n  return (\n    <div className="space-y-6 p-8 max-w-2xl mx-auto">\n`;
    
    state.components.forEach(c => {
      const { props } = c;
      switch (c.type) {
        case 'HEADING':
          const hSize = props.size === 'sm' ? 'text-xl' : props.size === 'lg' ? 'text-4xl' : 'text-2xl';
          const hAlign = props.align === 'center' ? 'text-center' : props.align === 'right' ? 'text-right' : 'text-left';
          code += `      <h2 className="font-black uppercase tracking-tight ${hSize} ${hAlign}">${props.text}</h2>\n`;
          break;
        case 'TEXT':
          const tAlign = props.align === 'center' ? 'text-center' : props.align === 'right' ? 'text-right' : 'text-left';
          code += `      <p className="text-slate-600 leading-relaxed ${tAlign}">${props.text}</p>\n`;
          break;
        case 'BUTTON':
          const bAlign = props.align === 'center' ? 'justify-center' : props.align === 'right' ? 'justify-end' : 'justify-start';
          const bVar = props.variant === 'outline' ? 'border-2 border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-primary text-white shadow-lg shadow-primary/20';
          code += `      <div className="flex ${bAlign}">\n        <button className="px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all ${bVar}">${props.text}</button>\n      </div>\n`;
          break;
        case 'CARD':
          code += `      <div className="p-6 rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm">\n        <h3 className="font-bold text-lg">${props.title}</h3>\n        <p className="text-sm text-slate-500">${props.description}</p>\n      </div>\n`;
          break;
        case 'SPACER':
          code += `      <div style={{ height: '${props.height}px' }} className="w-full" />\n`;
          break;
        case 'IMAGE':
          const iRatio = props.ratio === 'square' ? 'aspect-square' : 'aspect-video';
          code += `      <div className="overflow-hidden rounded-3xl bg-slate-100 ${iRatio}">\n        <img src="${props.url || 'https://picsum.photos/seed/builder/800/600'}" className="w-full h-full object-cover" />\n      </div>\n`;
          break;
      }
    });

    code += `    </div>\n  );\n};`;
    return code;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* --- Left Sidebar: Component Library --- */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-6 border-bottom border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Layout className="w-5 h-5" />
            </div>
            <h1 className="font-black uppercase tracking-tight text-lg">Builder</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Visual CMS v1.0</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-3 h-3" /> Basic Elements
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'HEADING', icon: Type, label: 'Heading' },
                { type: 'TEXT', icon: FileText, label: 'Text' },
                { type: 'BUTTON', icon: MousePointer2, label: 'Button' },
                { type: 'CARD', icon: Square, label: 'Card' },
                { type: 'IMAGE', icon: ImageIcon, label: 'Image' },
                { type: 'SPACER', icon: MoveHorizontal, label: 'Spacer' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => addComponent(item.type as ComponentType)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <item.icon className="w-5 h-5 text-slate-400 group-hover:text-primary mb-2" />
                  <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-primary">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
              <Grid className="w-3 h-3" /> Layouts
            </h3>
            <div className="space-y-2">
              <button disabled className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed">
                <Columns className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Two Columns</span>
              </button>
              <button disabled className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Bento Grid</span>
              </button>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setShowCode(true)}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Code className="w-4 h-4" /> Export Code
          </button>
        </div>
      </aside>

      {/* --- Main Canvas --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setState(prev => ({ ...prev, viewport: 'desktop' }))}
                className={cn("p-2 rounded-lg transition-all", state.viewport === 'desktop' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600")}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setState(prev => ({ ...prev, viewport: 'mobile' }))}
                className={cn("p-2 rounded-lg transition-all", state.viewport === 'mobile' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600")}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {state.components.length} Elements
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
              <Save className="w-4 h-4" /> Save Blueprint
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div 
          className="flex-1 overflow-y-auto p-12 flex justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]"
          onClick={() => setState(prev => ({ ...prev, selectedId: null }))}
        >
          <motion.div 
            layout
            className={cn(
              "bg-white shadow-2xl rounded-[3rem] min-h-[800px] transition-all duration-500 border-8 border-slate-900 overflow-hidden",
              state.viewport === 'desktop' ? "w-full max-w-4xl" : "w-[375px]"
            )}
          >
            <div className="p-8 min-h-full">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={state.components.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {state.components.map((component) => (
                    <SortableItem 
                      key={component.id} 
                      component={component} 
                      isSelected={state.selectedId === component.id}
                      onSelect={(id) => setState(prev => ({ ...prev, selectedId: id }))}
                      onDelete={deleteComponent}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {state.components.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
                  <Plus className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-sm opacity-50">Canvas is Empty</p>
                  <p className="text-xs">Drag elements here to start building</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* --- Right Sidebar: Properties --- */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" /> Properties
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedComponent ? (
            <div className="space-y-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Element Type</p>
                <p className="font-black text-primary uppercase text-sm">{selectedComponent.type}</p>
              </div>

              {/* Dynamic Property Controls */}
              <div className="space-y-6">
                {selectedComponent.type === 'HEADING' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Text Content</label>
                      <textarea 
                        value={selectedComponent.props.text}
                        onChange={(e) => updateProp(selectedComponent.id, 'text', e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Size</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['sm', 'md', 'lg'].map(s => (
                          <button 
                            key={s}
                            onClick={() => updateProp(selectedComponent.id, 'size', s)}
                            className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", selectedComponent.props.size === s ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedComponent.type === 'TEXT' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Body Text</label>
                    <textarea 
                      value={selectedComponent.props.text}
                      onChange={(e) => updateProp(selectedComponent.id, 'text', e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      rows={5}
                    />
                  </div>
                )}

                {selectedComponent.type === 'BUTTON' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Label</label>
                      <input 
                        type="text"
                        value={selectedComponent.props.text}
                        onChange={(e) => updateProp(selectedComponent.id, 'text', e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Variant</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['solid', 'outline'].map(v => (
                          <button 
                            key={v}
                            onClick={() => updateProp(selectedComponent.id, 'variant', v)}
                            className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", selectedComponent.props.variant === v ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedComponent.type === 'SPACER' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Height: {selectedComponent.props.height}px</label>
                    <input 
                      type="range"
                      min="8"
                      max="128"
                      step="8"
                      value={selectedComponent.props.height}
                      onChange={(e) => updateProp(selectedComponent.id, 'height', parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                {selectedComponent.type === 'IMAGE' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Image URL</label>
                    <input 
                      type="text"
                      placeholder="https://..."
                      value={selectedComponent.props.url}
                      onChange={(e) => updateProp(selectedComponent.id, 'url', e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                )}

                {/* Common Alignment Control */}
                {['HEADING', 'TEXT', 'BUTTON'].includes(selectedComponent.type) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Alignment</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {['left', 'center', 'right'].map(a => (
                        <button 
                          key={a}
                          onClick={() => updateProp(selectedComponent.id, 'align', a)}
                          className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", selectedComponent.props.align === a ? "bg-white shadow-sm text-primary" : "text-slate-400")}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 text-center">
              <MousePointer2 className="w-8 h-8 mb-4 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">No Element Selected</p>
              <p className="text-[10px] max-w-[140px]">Click an element on the canvas to edit its properties.</p>
            </div>
          )}
        </div>
      </aside>

      {/* --- Code Export Modal --- */}
      <AnimatePresence>
        {showCode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCode(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Generated Code</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">React + Tailwind CSS</p>
                </div>
                <button 
                  onClick={() => setShowCode(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-8 bg-slate-900">
                <pre className="text-indigo-300 font-mono text-sm leading-relaxed">
                  {generateCode()}
                </pre>
              </div>

              <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                <button 
                  onClick={() => setShowCode(false)}
                  className="px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
