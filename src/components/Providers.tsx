'use client';

import React from 'react';
import { BatchProvider } from '@/context/BatchContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <BatchProvider>{children}</BatchProvider>;
}
