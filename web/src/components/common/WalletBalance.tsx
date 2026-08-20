import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WalletBalance() {
  const { t } = useTranslation();

  return (
    <Card className="mb-6">
      <CardContent className="pt-6 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{t('escrow_wallet_balance')}</p>
          <h2 className="text-3xl font-bold text-slate-900">ETB 2,450,000.00</h2>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <span className="mr-2">+</span> Top Up
        </Button>
      </CardContent>
    </Card>
  );
}
