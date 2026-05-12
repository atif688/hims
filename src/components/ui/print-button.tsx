'use client';

import { Printer } from 'lucide-react';

export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-secondary">
      <Printer className="w-4 h-4" /> {label}
    </button>
  );
}
