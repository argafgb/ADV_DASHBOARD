"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import type { RawProject } from "../types/types";
import {
  normalizeProjectRows,
  type DynamicProjectRow,
} from "../utils/project-normalization";

interface UploadOverrideContextType {
  /** Baris hasil unggahan JSON, atau null saat dashboard memakai data server. */
  uploadedProjects: RawProject[] | null;
  processUploadedFile: (file: File) => void;
  triggerAlert: (message: string) => void;
}

const UploadOverrideContext = createContext<
  UploadOverrideContextType | undefined
>(undefined);

/**
 * Penyimpan data JSON kustom yang diunggah pengguna.
 *
 * Diletakkan di layout supaya hasil unggahan tetap berlaku saat pengguna
 * berpindah halaman, sama seperti sebelum data utama dipindah ke server.
 * Provider ini hanya menyimpan baris mentah; perhitungannya dilakukan di
 * `ProjectDataProvider` dengan fungsi yang sama dengan yang dipakai server.
 */
export function UploadOverrideProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [uploadedProjects, setUploadedProjects] = useState<RawProject[] | null>(
    null,
  );
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const triggerAlert = useCallback((msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage(null);
    }, 4500);
  }, []);

  const processUploadedFile = useCallback(
    (file: File) => {
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        triggerAlert(
          "Format file tidak valid. Silakan unggah file dengan format .json",
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed: unknown = JSON.parse(text);

          if (!Array.isArray(parsed)) {
            throw new Error(
              "Struktur data tidak valid. File JSON harus berupa Array of Objects.",
            );
          }

          if (parsed.length === 0) {
            throw new Error(
              "Array JSON kosong! Unggah file yang memiliki catatan project valid.",
            );
          }

          // Run validation on critical fields of first object as quick sanity check
          const sample = parsed[0];
          if (!sample || typeof sample !== "object") {
            throw new Error("Elemen di dalam array bukan merupakan objek.");
          }

          const sanitizedFullData = normalizeProjectRows(
            parsed as DynamicProjectRow[],
          );
          setUploadedProjects(sanitizedFullData);
          triggerAlert(
            `${sanitizedFullData.length} data berhasil dimuat dan diselaraskan.`,
          );
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          triggerAlert(`Gagal mengurai JSON: ${message}`);
        }
      };
      reader.onerror = () => {
        triggerAlert("Gagal membaca file dari penyimpanan lokal Anda.");
      };
      reader.readAsText(file);
    },
    [triggerAlert],
  );

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <UploadOverrideContext.Provider
      value={{ uploadedProjects, processUploadedFile, triggerAlert }}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleFileDrop}
        className="relative"
      >
        {/* Immersive Fullscreen Drag Over Overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-blue-600/90 flex flex-col items-center justify-center text-white backdrop-blur-md p-10 pointer-events-none transition-all duration-300">
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-center">
              Lepas file JSON kustom Anda di sini
            </h2>
            <p className="text-white/80 text-sm font-medium mt-2 max-w-sm text-center leading-relaxed">
              Metrik, bagan, leaderboard, dan audit project akan langsung
              mengkalibrasi ulang seketika!
            </p>
          </div>
        )}

        {/* Floating System Alerts */}
        {alertMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-5 right-5 z-40 bg-gray-950 text-white rounded-xl shadow-2xl p-4 border border-white/10 max-w-sm select-none"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-xs font-bold font-sans text-white/95 leading-snug">
                  System Notification
                </p>
                <p className="text-[11px] text-white/70 font-medium leading-relaxed mt-0.5">
                  {alertMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                aria-label="Tutup notifikasi"
                className="text-white/40 hover:text-white cursor-pointer ml-1"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </UploadOverrideContext.Provider>
  );
}

export function useUploadOverride() {
  const context = useContext(UploadOverrideContext);

  if (!context) {
    throw new Error(
      "useUploadOverride must be used within an UploadOverrideProvider",
    );
  }

  return context;
}
