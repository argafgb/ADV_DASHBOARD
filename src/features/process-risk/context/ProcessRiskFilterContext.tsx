'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  isMonthSelectable as isCanonicalMonthSelectable,
  monthForTargetYear,
  normalizeMonthRange,
} from '../utils/month-filter';
import { PROCESS_RISK_CONFIG } from '../utils/constants';
import type { DataYear, MonthRange } from '../types';

export function isMonthSelectable(year: DataYear, monthIndex: number, today = new Date()): boolean {
  return isCanonicalMonthSelectable(year, monthIndex + 1, today);
}

export interface ProcessRiskFilterState {
  years: DataYear[];
  year: DataYear;
  setYear: (year: DataYear) => void;
  prev: DataYear | null;
  compare: boolean;
  month: string;
  monthRange: MonthRange;
  setMonth: (month: string) => void;
  filteredHref: (href: string) => string;
}

const ProcessRiskFilterContext = createContext<ProcessRiskFilterState | undefined>(undefined);

export const VALID_YEARS: DataYear[] = PROCESS_RISK_CONFIG.years.map(Number) as DataYear[];
export const DEFAULT_YEAR: DataYear = Number(PROCESS_RISK_CONFIG.years[0]) as DataYear;

export function previousYearOf(year: DataYear): DataYear | null {
  const years = PROCESS_RISK_CONFIG.years;
  const index = years.indexOf(String(year) as '2026' | '2025');
  return index < 0 || index + 1 >= years.length ? null : (Number(years[index + 1]) as DataYear);
}

export function normalizeYear(value: string | null): DataYear {
  const supported = (value ?? '')
    .split('-')
    .map(Number)
    .find((y): y is DataYear => VALID_YEARS.includes(y as DataYear));
  return supported ?? DEFAULT_YEAR;
}

export function resolveUrlFilters(search: string, today = new Date()) {
  const params = new URLSearchParams(search);
  const year = normalizeYear(params.get('year'));
  const monthParam = params.get('month');
  return {
    year,
    month: normalizeMonthRange(monthParam, year, today).value,
    monthWasExplicitlySelected: monthParam !== null,
  };
}

function readUrlFilters() {
  if (typeof window === 'undefined') {
    return {
      year: DEFAULT_YEAR,
      month: 'ALL',
      monthWasExplicitlySelected: false,
    };
  }
  return resolveUrlFilters(window.location.search);
}

export function ProcessRiskFilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [year, commitYear] = useState<DataYear>(DEFAULT_YEAR);
  const [month, commitMonth] = useState('ALL');
  const latestInteraction = useRef(0);
  const monthWasExplicitlySelected = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      monthWasExplicitlySelected.current =
        window.sessionStorage.getItem('process-risk-month-touched') === '1';
    }
  }, []);

  useEffect(() => {
    const syncFromUrl = (allowCanonicalization = true) => {
      const filters = readUrlFilters();
      commitYear(filters.year);
      commitMonth(filters.month);
      const params = new URLSearchParams(window.location.search);
      const canonical =
        params.get('year') === String(filters.year) && params.get('month') === filters.month;
      monthWasExplicitlySelected.current = filters.monthWasExplicitlySelected;
      if (canonical || !allowCanonicalization) return;
      params.set('year', String(filters.year));
      params.set('month', filters.month);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const interactionWhenScheduled = latestInteraction.current;
    const timer = window.setTimeout(() => {
      if (latestInteraction.current === interactionWhenScheduled) syncFromUrl(true);
    }, 0);
    const handlePopState = () => syncFromUrl(false);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router]);

  const updateUrl = useCallback(
    (key: 'year' | 'month', value: string) => {
      const params = new URLSearchParams(window.location.search);
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router],
  );

  const setYear = useCallback(
    (next: DataYear) => {
      latestInteraction.current += 1;
      commitYear(next);
      const nextMonth = monthForTargetYear(month, next, monthWasExplicitlySelected.current);
      if (nextMonth !== month) commitMonth(nextMonth);

      const params = new URLSearchParams(window.location.search);
      params.set('year', String(next));
      params.set('month', nextMonth);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [month, pathname, router],
  );

  const filteredHref = useCallback(
    (href: string) => {
      const [base, query = ''] = href.split('?');
      const params = new URLSearchParams(query);
      params.set('year', String(year));
      params.set('month', normalizeMonthRange(month, year).value);
      return `${base}?${params.toString()}`;
    },
    [month, year],
  );

  const value = useMemo(() => {
    const prev = previousYearOf(year);
    const monthRange = normalizeMonthRange(month, year);
    return {
      years: prev === null ? [year] : [year, prev],
      year,
      setYear,
      prev,
      compare: prev !== null,
      month: monthRange.value,
      monthRange,
      setMonth: (nextMonth: string) => {
        latestInteraction.current += 1;
        monthWasExplicitlySelected.current = true;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('process-risk-month-touched', '1');
        }
        const normalized = normalizeMonthRange(nextMonth, year).value;
        commitMonth(normalized);
        updateUrl('month', normalized);
      },
      filteredHref,
    };
  }, [year, setYear, month, updateUrl, filteredHref]);

  return (
    <ProcessRiskFilterContext.Provider value={value}>
      {children}
    </ProcessRiskFilterContext.Provider>
  );
}

export const FilterProvider = ProcessRiskFilterProvider;

export function useProcessRiskFilters(): ProcessRiskFilterState {
  const context = useContext(ProcessRiskFilterContext);
  if (!context) throw new Error('useProcessRiskFilters must be used within a ProcessRiskFilterProvider');
  return context;
}

export const useFilters = useProcessRiskFilters;
