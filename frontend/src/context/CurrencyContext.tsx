'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CURRENCIES, Currency, convertCurrency, formatPrice } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  format: (amountRWF: number) => string;
  convert: (amountRWF: number) => number;
  currencies: Currency[];
  getCurrency: () => Currency;
  canChangeCurrency: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<string>('RWF');
  const [changeAllowed, setChangeAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/settings')
      .then(({ data }) => {
        if (active) setChangeAllowed(data?.settings?.allow_currency_change === 'true');
      })
      .catch(() => {
        if (active) setChangeAllowed(false);
      });
    return () => { active = false; };
  }, []);

  const canChangeCurrency = changeAllowed || user?.role === 'admin';

  useEffect(() => {
    if (!canChangeCurrency) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyState('RWF');
      return;
    }
    const saved = localStorage.getItem('nmo_currency');
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      setCurrencyState(saved);
    }
  }, [canChangeCurrency]);

  const setCurrency = (c: string) => {
    if (!canChangeCurrency) return;
    setCurrencyState(c);
    localStorage.setItem('nmo_currency', c);
  };

  const getCurrency = () => CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        format: (amountRWF: number) => formatPrice(amountRWF, currency),
        convert: (amountRWF: number) => convertCurrency(amountRWF, currency),
        currencies: CURRENCIES,
        getCurrency,
        canChangeCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
