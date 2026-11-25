import React from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface PricingModuleProps {
  isMember: boolean;
  memberPrice: number;
  nonMemberPrice: number;
  onUpgradeClick?: () => void;
}

export const PricingModule: React.FC<PricingModuleProps> = ({
  isMember,
  memberPrice,
  nonMemberPrice,
  onUpgradeClick,
}) => {
  const savings = nonMemberPrice - memberPrice;

  return (
    <div id="pricing-module-container" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
          Session Token Pricing
        </h4>
        {isMember && (
          <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 rounded-full">
            <Sparkles className="w-3 h-3" />
            Member Priority Rate
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Member Pricing Tier */}
        <div id="tier-member-price" className={`p-4 rounded-xl border-2 transition-all ${
          isMember 
            ? 'border-emerald-500 bg-emerald-50/20' 
            : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
        }`}>
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">
            Member Rate
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">${memberPrice}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">/Session</span>
          </div>
          {isMember && (
            <p className="text-[10px] text-emerald-600 font-bold mt-2">
              ✓ Active on your profile
            </p>
          )}
        </div>

        {/* Non-Member Pricing Tier */}
        <div id="tier-non-member-price" className={`p-4 rounded-xl border-2 transition-all ${
          !isMember 
            ? 'border-slate-300 bg-slate-50/50' 
            : 'border-slate-100 opacity-60'
        }`}>
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">
            Standard Rate
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">${nonMemberPrice}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">/Session</span>
          </div>
          {!isMember && (
            <p className="text-[10px] text-slate-500 font-bold mt-2">
              Save ${savings} by subscribing
            </p>
          )}
        </div>
      </div>

      {!isMember ? (
        <div id="pricing-signup-card" className="bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/80 shadow-sm text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Unlock Member pricing
              </h5>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                Subscribing to Bilingual &amp; Brilliant Premium saves you <strong className="text-slate-900">${savings} per session</strong>, gets you unlimited AI story credits, and full access to speech clinical exercises.
              </p>
              
              <ul className="mt-3 space-y-1 text-[11px] text-slate-600 font-bold">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Save ${savings} on every live clinical teletherapy session
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Free 1-on-1 monthly intake review with specialists
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Priority callback &amp; scheduling slots
                </li>
              </ul>

              {onUpgradeClick && (
                <button
                  id="primary-upgrade-promo-btn"
                  onClick={onUpgradeClick}
                  className="mt-4 w-full py-2.5 px-4 bg-primary text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  Join Premium &amp; Save
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div id="active-benefit-badge" className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[11px] text-emerald-800 font-bold">
            Member discounts of <strong className="text-emerald-950">${savings}</strong> are automatically active on this booking!
          </p>
        </div>
      )}
    </div>
  );
};
