"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomRadio } from "./CustomRadio";
import type { RegionMetadata } from "../types/access.types";
import { Search, Globe, Building2, MapPin, X } from "lucide-react";

export type ScopeMode = "All sites" | "Region" | "Site";

export interface ScopeEditorValue {
  all: boolean;
  departments: ("IT Support" | "DCT Support")[];
  branches: string[];
  regions: string[];
}

interface ScopeEditorProps {
  value: ScopeEditorValue;
  onChange: (value: ScopeEditorValue) => void;
  availableBranches: string[];
  availableRegions: RegionMetadata[];
  disabled?: boolean;
  allowAllSites?: boolean;
  initialMode?: ScopeMode;
  lockedLocation?: boolean;
}

export function ScopeEditor({
  value,
  onChange,
  availableBranches,
  availableRegions,
  disabled = false,
  allowAllSites = true,
  initialMode = "Site",
  lockedLocation = false,
}: ScopeEditorProps) {
  const [branchSearch, setBranchSearch] = React.useState("");
  const [emptyMode, setEmptyMode] = React.useState<ScopeMode>(initialMode);

  // Determine current scope mode
  const currentMode: ScopeMode = React.useMemo(() => {
    if (value.all) return "All sites";
    if (value.regions.length > 0 && value.branches.length === 0) return "Region";
    return value.branches.length > 0 ? "Site" : emptyMode;
  }, [value.all, value.regions.length, value.branches.length, emptyMode]);

  const filteredBranches = React.useMemo(() => {
    if (!branchSearch.trim()) return availableBranches.slice(0, 45);
    const q = branchSearch.trim().toUpperCase();
    return availableBranches.filter((b) => b.includes(q)).slice(0, 50);
  }, [availableBranches, branchSearch]);

  const setMode = (mode: ScopeMode) => {
    setEmptyMode(mode);
    if (mode === "All sites") {
      onChange({
        ...value,
        all: true,
        branches: [],
        regions: [],
      });
    } else if (mode === "Region") {
      onChange({
        ...value,
        all: false,
        branches: [],
        regions: value.regions,
      });
    } else {
      onChange({
        ...value,
        all: false,
        regions: [],
        branches: value.branches,
      });
    }
  };

  const toggleBranch = (branch: string, checked: boolean) => {
    const b = branch.toUpperCase().trim();
    const next = checked
      ? [...value.branches, b]
      : value.branches.filter((x) => x !== b);
    onChange({
      ...value,
      branches: next,
    });
  };

  const removeBranch = (branch: string) => {
    if (disabled) return;
    onChange({
      ...value,
      branches: value.branches.filter((b) => b !== branch),
    });
  };

  const toggleRegion = (regionCode: string, checked: boolean) => {
    const r = regionCode.toUpperCase().trim();
    const next = checked
      ? [...value.regions, r]
      : value.regions.filter((x) => x !== r);
    onChange({
      ...value,
      regions: next,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-2xs">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Cakupan Data Wilayah &amp; Cabang (Data Scope)
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Membatasi data sesuai region atau cabang yang ditetapkan untuk akun pengguna.
        </p>
      </div>

      {/* 3 Scope Type Radios matching Standalone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {(
          [
            { id: "All sites", label: "All sites" },
            { id: "Region", label: "Region" },
            { id: "Site", label: "Site (Cabang)" },
          ] as const
        ).map((item) => {
          const isSelected = currentMode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled || lockedLocation || (item.id === "All sites" && !allowAllSites)}
              onClick={() => setMode(item.id)}
              className={`flex items-center gap-2.5 h-10 px-3.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-2xs"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              } ${disabled ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
            >
              <CustomRadio checked={isSelected} disabled={disabled} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scope dynamic hint text matching standalone ed.scopeText */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {currentMode === "All sites"
          ? "Melihat seluruh region dan site. Site baru otomatis ikut."
          : currentMode === "Region"
            ? "Seluruh site di region terpilih. Bawaan untuk Regional Head."
            : "Hanya site/cabang yang dipilih. Bawaan untuk Branch Manager."}
      </p>
      {!value.all && value.branches.length === 0 && value.regions.length === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
          Pilih minimal satu Region atau Site agar cakupan data dapat disimpan.
        </p>
      )}
      {lockedLocation && (
        <p className="text-xs text-blue-700 dark:text-blue-300">Wilayah otomatis mengikuti cabang karyawan pada direktori.</p>
      )}
      {currentMode === "Region" && availableRegions.length === 0 && (
        <p className="text-xs text-zinc-500">Mapping region belum tersedia. Muat ulang atau pilih Site.</p>
      )}

      {/* Mode details */}
      {currentMode !== "All sites" && (
        <div className="space-y-5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {/* Region Mode */}
          {currentMode === "Region" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Pilih Region ({value.regions.length} dipilih)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {availableRegions.map((region) => {
                  const checked = value.regions.includes(region.code.toUpperCase());
                  return (
                    <div
                      key={region.code}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
                        checked
                          ? "border-blue-500 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30"
                      }`}
                    >
                      <Checkbox
                        id={`scope-region-${region.code}`}
                        checked={checked}
                        disabled={disabled || lockedLocation || !region.isActive}
                        onCheckedChange={(c) => toggleRegion(region.code, !!c)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <Label
                          htmlFor={`scope-region-${region.code}`}
                          className="text-xs font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer"
                        >
                          {region.name}
                        </Label>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                          {region.branches.length > 0
                            ? region.branches.join(", ")
                            : "Tidak ada cabang"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Site Mode */}
          {currentMode === "Site" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <Building2 className="h-3.5 w-3.5" />
                  Pilih Site / Cabang ({value.branches.length} dipilih)
                </div>
                {value.branches.length > 0 && !disabled && !lockedLocation && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, branches: [] })}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Reset pilihan
                  </button>
                )}
              </div>

              {/* Selected Branch Pills */}
              {value.branches.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border border-zinc-200 rounded-md bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                  {value.branches.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 bg-white border border-zinc-200 text-zinc-800 px-2 py-0.5 rounded text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-2xs"
                    >
                      {b}
                      {!disabled && !lockedLocation && (
                        <button
                          type="button"
                          onClick={() => removeBranch(b)}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Branch Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder="Cari nama cabang/site (cth: SEMARANG, MERUYA, BALIKPAPAN)..."
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  disabled={disabled || lockedLocation}
                  className="pl-8 text-xs h-9"
                />
              </div>

              {/* Branch Selection List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-2.5 border border-zinc-200 rounded-md dark:border-zinc-800">
                {filteredBranches.map((branch) => {
                  const checked = value.branches.includes(branch);
                  return (
                    <label
                      key={branch}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer text-xs transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled || lockedLocation}
                        onCheckedChange={(c) => toggleBranch(branch, !!c)}
                      />
                      <span className="truncate font-medium">{branch}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
