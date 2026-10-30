'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { replaceDashboardData, useDashboardData } from '../data/workplans';
import type { ProcessRiskDashboardData } from '../types';
import { ProcessRiskRouteSkeleton } from '../components/skeletons/ProcessRiskSkeleton';

export function ProcessRiskDataProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: ProcessRiskDashboardData;
}) {
  const [ready, setReady] = useState(() => {
    if (initialData) {
      replaceDashboardData(initialData);
      return true;
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const response = await fetch('/api/process-risk/dashboard-data', { cache: 'no-store' });
      if (!response.ok) throw new Error('Layanan data sedang tidak tersedia.');
      const data = (await response.json()) as ProcessRiskDashboardData;
      replaceDashboardData(data);
      setReady(true);
      setError(null);
    } catch {
      // If we already have data from initialData or previous fetch, don't break the UI
      setReady((prev) => {
        if (!prev) setError('Koneksi ke database Process & Risk belum tersedia.');
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      replaceDashboardData(initialData);
    }
    const interval = window.setInterval(() => void refreshData(), 60_000);
    const refreshOnFocus = () => void refreshData();
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [initialData, refreshData]);

  if (!ready) {
    return error ? (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
        <button
          type="button"
          onClick={() => void refreshData()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      </div>
    ) : (
      <ProcessRiskRouteSkeleton />
    );
  }

  return children;
}

export const DashboardDataProvider = ProcessRiskDataProvider;
