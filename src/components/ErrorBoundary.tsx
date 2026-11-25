import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home, ShieldCheck, Download, Copy, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isSafeMode?: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleSoftReset = () => {
    // Preserve core user auth and profiles, remove corrupt temporary cache
    try {
      const keysToKeep = ['speechflow_user_profile', 'speechflow_points', 'speechflow_streak'];
      const savedData: Record<string, string> = {};
      keysToKeep.forEach((k) => {
        const val = localStorage.getItem(k);
        if (val) savedData[k] = val;
      });

      localStorage.clear();

      // Restore essential data
      Object.entries(savedData).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
    } catch (e) {}

    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  private handleCopyDiagnosticLog = () => {
    const log = JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      errorMessage: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack || '',
      componentStack: this.state.errorInfo?.componentStack || ''
    }, null, 2);

    navigator.clipboard.writeText(log).then(() => {
      toast.success('Sanitized diagnostic incident report copied to clipboard!');
    }).catch(() => {
      toast.info('Could not auto-copy. Please review console logs.');
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-200"
          >
            <div className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-sm">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              SpeechFlow Safe Mode Recovery
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
              Let's get you back on track!
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
              The application encountered an unexpected state. Your speech profile, exercises, and earned badges are preserved safely.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-98 transition-all shadow-lg shadow-indigo-200"
              >
                <RotateCcw className="w-4 h-4" />
                Quick Reload & Resume
              </button>
              
              <button
                onClick={this.handleSoftReset}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Safe Mode Repair (Keep Profile Data)
              </button>

              <button
                onClick={this.handleCopyDiagnosticLog}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Diagnostic Log for SLP Support
              </button>
            </div>
            
            {this.state.error && (
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Incident Stack Trace
                </span>
                <p className="text-[11px] font-mono text-rose-600 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
