import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onClose: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-2xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-black uppercase tracking-widest text-slate-800">Privacy Policy</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <section>
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-4">Protecting Your Flow</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Last Updated: May 2026. This policy describes how SpeechFlow AI ("we," "us," or "our") collects, uses, and shares your information when you use our mobile application.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100">
              <Lock className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-indigo-900 mb-2">Secure Storage</h3>
              <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">
                All speech recordings and personal results are encrypted and stored securely using Google Firebase infrastructure.
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
              <Eye className="w-8 h-8 text-slate-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2">Data Minimalim</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                We only collect what's necessary to track your progress and provide AI feedback. We never sell your data to third parties.
              </p>
            </div>
          </div>

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                1. Information Collection
              </h2>
              <div className="space-y-4 text-slate-600 text-sm font-medium leading-relaxed">
                <p>
                  <strong>Personal Data:</strong> When you sign in, we collect your email address and name to sync your progress across devices.
                </p>
                <p>
                  <strong>Audio Data:</strong> We process your voice input to provide real-time feedback. Recordings are kept private and used only for your personal progress history.
                </p>
                <p>
                  <strong>Usage Data:</strong> We collect anonymous statistics on which exercises are most popular to improve our curriculum.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                2. Data Permissions
              </h2>
              <div className="space-y-4 text-slate-600 text-sm font-medium leading-relaxed">
                <p>Our app requires Microphone access specifically for speech analysis features. You can revoke this permission at any time in system settings.</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                3. Your Rights
              </h2>
              <div className="space-y-4 text-slate-600 text-sm font-medium leading-relaxed">
                <p>You have the right to access, correct, or delete your personal data. You can delete your account and all associated data directly from the Settings menu.</p>
              </div>
            </div>
          </section>

          <footer className="pt-12 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">SpeechFlow AI &copy; 2026</p>
            <button 
              onClick={onClose}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all"
            >
              Understand & Return
            </button>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};
