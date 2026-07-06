'use client';

import { useEffect } from 'react';
import { MERCHANDISE_CART_STORAGE_KEY } from '@/lib/merchandise';

export function MerchandiseCheckoutSuccessReset() {
  useEffect(() => {
    window.localStorage.removeItem(MERCHANDISE_CART_STORAGE_KEY);
  }, []);

  return null;
}