import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import OverviewTab from './OverviewTab';
import SpotPricingCalculator from './SpotPricingCalculator';
import SettlementCenter from './SettlementCenter';
import TransactionLedger from './TransactionLedger';
import DisputeResolution from './DisputeResolution';


const SUB_TAB_PATHS: Record<string, 'overview' | 'spot_pricing' | 'settlements' | 'ledger' | 'disputes'> = {
  overview: 'overview',
  'spot-pricing': 'spot_pricing',
  pricing: 'spot_pricing',
  settlements: 'settlements',
  payouts: 'settlements',
  ledger: 'ledger',
  transactions: 'ledger',
  disputes: 'disputes',
};

const TAB_ID_TO_SLUG: Record<string, string> = {
  overview: 'overview',
  spot_pricing: 'spot-pricing',
  settlements: 'settlements',
  ledger: 'ledger',
  disputes: 'disputes',
};

export default function FinancialDashboard() {
  const { t } = useTranslation();

  const getSubTabFromPath = (): 'overview' | 'spot_pricing' | 'settlements' | 'ledger' | 'disputes' => {
    const parts = window.location.pathname.toLowerCase().split('/').filter(Boolean);
    const subPart = parts[1] || parts[0];
    return SUB_TAB_PATHS[subPart] || 'overview';
  };

  const [activeSubTab, setActiveSubTabState] = useState<'overview' | 'spot_pricing' | 'settlements' | 'ledger' | 'disputes'>(() => {
    return getSubTabFromPath();
  });
  
  const [currency, setCurrency] = useState<'ETB' | 'USD' | 'DJF'>('ETB');

  // Exchange rates relative to base ETB
  const FX_RATES = {
    USD: 125.0,
    DJF: 0.70
  };

  // Sync with browser Back/Forward navigation
  useEffect(() => {
    const handlePop = () => {
      setActiveSubTabState(getSubTabFromPath());
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleSubTabChange = (tabId: 'overview' | 'spot_pricing' | 'settlements' | 'ledger' | 'disputes') => {
    setActiveSubTabState(tabId);
    const slug = TAB_ID_TO_SLUG[tabId] || tabId;
    const newPath = `/finance/${slug}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ subTab: tabId }, '', newPath);
    }
  };

  const formatMoney = (amountInETB: number): string => {
    if (currency === 'USD') {
      const usdAmount = amountInETB / FX_RATES.USD;
      return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'DJF') {
      const djfAmount = amountInETB / FX_RATES.DJF;
      return `${Math.round(djfAmount).toLocaleString('en-US')} DJF`;
    }
    return `ETB ${amountInETB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="max-w-[1320px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">
            Financial & Settlement Management
          </h1>
          <p className="text-xs text-[#8F8F8F] mt-0.5">
            Multi-currency escrow balances, carrier payout settlement, and rate calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8F8F8F] font-medium">Currency:</span>
          <div className="inline-flex border border-[#2E2E2E] rounded-md bg-[#181818] p-0.5">
            {(['ETB', 'USD', 'DJF'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrency(curr)}
                className={`text-xs font-mono px-2.5 py-1 rounded transition-colors ${
                  currency === curr
                    ? 'bg-[#232323] text-[#3ECF8E] font-semibold border border-[#3ECF8E]/20 shadow-sm'
                    : 'text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#2A2A2A]'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Tab View */}
      <div className="pt-1">
        {activeSubTab === 'overview' && (
          <OverviewTab
            currency={currency}
            rates={FX_RATES}
            formatMoney={formatMoney}
            onNavigateTab={(tab: string) => handleSubTabChange(tab as any)}
          />
        )}

        {activeSubTab === 'spot_pricing' && (
          <SpotPricingCalculator
            currency={currency}
            formatMoney={formatMoney}
          />
        )}

        {activeSubTab === 'settlements' && (
          <SettlementCenter
            currency={currency}
            formatMoney={formatMoney}
          />
        )}

        {activeSubTab === 'ledger' && (
          <TransactionLedger
            currency={currency}
            rates={FX_RATES}
            formatMoney={formatMoney}
          />
        )}

        {activeSubTab === 'disputes' && (
          <DisputeResolution
            currency={currency}
            formatMoney={formatMoney}
          />
        )}
      </div>
    </div>
  );
}
