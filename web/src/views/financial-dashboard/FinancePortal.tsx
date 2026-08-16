import React, { useState, useEffect } from 'react';
import FinanceSidebar from './FinanceSidebar';
import FinanceHeader from './FinanceHeader';
import OverviewTab from './OverviewTab';
import SpotPricingCalculator from './SpotPricingCalculator';
import SettlementCenter from './SettlementCenter';
import TransactionLedger from './TransactionLedger';
import DisputeResolution from './DisputeResolution';

type FinanceSubTab = 'overview' | 'spot_pricing' | 'settlements' | 'ledger' | 'disputes';

const FINANCE_TAB_PATHS: Record<string, FinanceSubTab> = {
  '/finance': 'overview',
  '/finance/overview': 'overview',
  '/finance/spot-pricing': 'spot_pricing',
  '/finance/pricing': 'spot_pricing',
  '/finance/settlements': 'settlements',
  '/finance/payouts': 'settlements',
  '/finance/ledger': 'ledger',
  '/finance/transactions': 'ledger',
  '/finance/disputes': 'disputes',
};

const TAB_TO_SLUG: Record<string, string> = {
  overview: 'overview',
  spot_pricing: 'spot-pricing',
  settlements: 'settlements',
  ledger: 'ledger',
  disputes: 'disputes',
};

interface FinancePortalProps {
  onSwitchPortal: () => void;
}

export default function FinancePortal({ onSwitchPortal }: FinancePortalProps) {
  const getSubTabFromPath = (): FinanceSubTab => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/finance';
    return FINANCE_TAB_PATHS[path] || 'overview';
  };

  const [activeSubTab, setActiveSubTabState] = useState<FinanceSubTab>(getSubTabFromPath);
  const [currency, setCurrency] = useState<'ETB' | 'USD' | 'DJF'>('ETB');

  // Exchange rates relative to base ETB
  const FX_RATES = {
    USD: 125.0,
    DJF: 0.70,
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

  useEffect(() => {
    const handlePopState = () => {
      setActiveSubTabState(getSubTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveSubTab = (tab: string) => {
    const typedTab = tab as FinanceSubTab;
    setActiveSubTabState(typedTab);
    const slug = TAB_TO_SLUG[typedTab] || typedTab;
    const newPath = `/finance/${slug}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ subTab: typedTab }, '', newPath);
    }
  };

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'overview':
        return (
          <OverviewTab
            currency={currency}
            rates={FX_RATES}
            formatMoney={formatMoney}
            onNavigateTab={(tab: string) => setActiveSubTab(tab)}
          />
        );
      case 'spot_pricing':
        return <SpotPricingCalculator currency={currency} formatMoney={formatMoney} />;
      case 'settlements':
        return <SettlementCenter currency={currency} formatMoney={formatMoney} />;
      case 'ledger':
        return <TransactionLedger currency={currency} rates={FX_RATES} formatMoney={formatMoney} />;
      case 'disputes':
        return <DisputeResolution currency={currency} formatMoney={formatMoney} />;
      default:
        return (
          <OverviewTab
            currency={currency}
            rates={FX_RATES}
            formatMoney={formatMoney}
            onNavigateTab={(tab: string) => setActiveSubTab(tab)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <FinanceSidebar
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        currency={currency}
        setCurrency={setCurrency}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <FinanceHeader
          onSwitchPortal={onSwitchPortal}
          currency={currency}
          formatMoney={formatMoney}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-[1320px] mx-auto space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Financial & Settlement Management
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-currency escrow balances, carrier payout settlement, and rate calculations.
                </p>
              </div>
            </div>

            {/* Active Tab View */}
            <div className="pt-1">
              {renderSubTab()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
