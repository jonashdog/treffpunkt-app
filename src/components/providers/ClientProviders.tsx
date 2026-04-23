'use client';

import { I18nProvider } from '@/components/providers/I18nProvider';
import Header from '@/components/shared/Header';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Header />
      <main className="flex-1">{children}</main>
    </I18nProvider>
  );
}
