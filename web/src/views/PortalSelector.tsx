import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PackageSearch,
  Wallet,
  ArrowRight,
  Ship,
  BarChart3,
  Globe,
  Calculator,
  FileText,
  Scale
} from 'lucide-react';

interface PortalSelectorProps {
  onSelectPortal: (portal: 'shipper' | 'finance') => void;
}

export default function PortalSelector({ onSelectPortal }: PortalSelectorProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="font-semibold text-slate-900 text-sm tracking-tight">
          TradeFlow
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Globe size={14} />
            {i18n.language === 'en' ? 'አማርኛ' : 'English'}
          </button>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="text-xs font-medium text-slate-700">
            Dani
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-6">
          {/* Title Section */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {t('portal_selector_title')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('portal_selector_subtitle')}
            </p>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shipper Portal Card */}
            <button
              onClick={() => onSelectPortal('shipper')}
              className="text-left bg-white border border-slate-200 rounded-md p-5 hover:border-slate-400 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white">
                  <Ship size={16} />
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </div>

              <h2 className="text-sm font-semibold text-slate-900 mb-1">
                {t('shipper_portal_title')}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {t('shipper_portal_desc')}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { icon: PackageSearch, label: t('bids') },
                  { icon: BarChart3, label: t('operations') },
                  { icon: Globe, label: 'AM / EN' },
                ].map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 rounded px-2 py-0.5"
                  >
                    <tag.icon size={11} />
                    {tag.label}
                  </span>
                ))}
              </div>
            </button>

            {/* Financial Dashboard Card */}
            <button
              onClick={() => onSelectPortal('finance')}
              className="text-left bg-white border border-slate-200 rounded-md p-5 hover:border-slate-400 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white">
                  <Wallet size={16} />
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </div>

              <h2 className="text-sm font-semibold text-slate-900 mb-1">
                {t('finance_portal_title')}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {t('finance_portal_desc')}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { icon: Calculator, label: t('spot_pricing') },
                  { icon: FileText, label: t('ledger') },
                  { icon: Scale, label: t('disputes') },
                ].map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 rounded px-2 py-0.5"
                  >
                    <tag.icon size={11} />
                    {tag.label}
                  </span>
                ))}
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-[11px] text-slate-400">
            Djibouti–Ethiopia Corridor • Freight Matching & Corridor Telematics
          </div>
        </div>
      </div>
    </div>
  );
}
