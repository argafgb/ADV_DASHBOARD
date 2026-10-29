"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Trophy } from "lucide-react";

interface EmployeeInfo {
  name: string;
  badge: string;
  code?: string;
}

function ChampionAvatar({ name, code }: { name: string; code?: string }) {
  const [imgError, setImgError] = useState(false);

  // Gunakan code jika ada, atau fallback ke name agar bisa lookup ke foto spesimen / lokal
  const identifier = code?.trim() || name?.trim();
  const avatarUrl = identifier ? `/api/avatar/${encodeURIComponent(identifier)}` : null;

  if (avatarUrl && !imgError) {
    return (
      <div className="mx-auto mt-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 shadow-sm">
        <Image
          src={avatarUrl}
          alt={name}
          width={96}
          height={96}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-850 dark:bg-zinc-900">
      <Image
        src="/profile-nft.webp"
        alt={`Foto karyawan terbaik ${name}`}
        width={96}
        height={96}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export default function EmployeeOfMonthCard({
  currentMonthLabel,
  year,
  employees,
}: {
  currentMonthLabel: string;
  year: string;
  employees: Record<string, EmployeeInfo>;
}) {
  const employeeList = Object.entries(employees).filter(([, emp]) => !!emp);

  return (
    <div className="flex flex-wrap justify-center gap-6 py-3">
      {employeeList.length === 0 ? (
        <div className="w-105 max-w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 p-8 text-center shadow-md">
          <Trophy
            className="mx-auto text-zinc-300 dark:text-zinc-700"
            size={42}
          />
          <h2 className="mt-4 text-base font-black text-slate-950 dark:text-zinc-50 font-display">
            Karyawan Terbaik - {currentMonthLabel} {year}
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Employee of The Month
          </p>
          <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full border border-zinc-200 bg-white shadow-inner dark:border-zinc-800 dark:bg-zinc-900">
            <Image
              src="/profile-nft.webp"
              alt="Placeholder karyawan terbaik"
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-4 text-base font-bold text-zinc-400 dark:text-zinc-500">
            Belum ditentukan
          </div>
        </div>
      ) : (
        employeeList.map(([deptName, emp]) => (
          <div
            key={deptName}
            className="w-105 max-w-full rounded-2xl border border-blue-100 bg-blue-50/40 dark:border-blue-900/20 dark:bg-blue-955/10 p-8 text-center shadow-md"
          >
            <Trophy
              className="mx-auto text-amber-500 animate-bounce"
              size={42}
            />
            <h2 className="mt-4 text-base font-black text-slate-950 dark:text-zinc-50 font-display">
              Karyawan Terbaik - {currentMonthLabel} {year}
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
              {deptName}
            </p>

            <ChampionAvatar key={emp.code?.trim() || emp.name} name={emp.name} code={emp.code} />

            <div
              className="mt-4 text-lg font-black text-slate-950 dark:text-white truncate"
              title={emp.name}
            >
              {emp.name}
            </div>

            <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-955/20 px-4 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 select-none shadow-xs">
              <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
              {emp.badge}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
