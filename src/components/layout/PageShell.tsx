import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';

export const PageShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
};
