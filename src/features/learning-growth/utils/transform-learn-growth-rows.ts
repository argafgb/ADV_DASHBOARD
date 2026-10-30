import { UNCATEGORIZED_LABEL } from "./dashboard-config";
import type { Certification, TrainingSession, VendorName, DashboardData } from "../types/dashboard.types";

export interface LearnGrowthSourceRow {
  id: string;
  program: string;
  rencana_kerja: string;
  tanggal: string;
  narasumber: string | null;
  category_kerja: string | null;
  peserta: string | null;
  exp_sertifikat: string | null;
}

function normalizeProgram(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("id-ID");
}

function normalizeCategory(value: string | null): string {
  const trimmed = value?.trim();
  return trimmed || UNCATEGORIZED_LABEL;
}

function normalizeVendor(value: string | null): VendorName | null {
  if (!value) return null;
  const normalized = value.trim().toLocaleLowerCase("id-ID");
  if (normalized === "myskill") return "MySkill";
  if (normalized === "id networkers" || normalized === "idn") return "ID Networkers";
  return null;
}

function splitParticipants(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((participant) => participant.trim().toLocaleUpperCase("id-ID"))
    .filter(Boolean);
}

function cleanCertificationName(title: string): string {
  return title.replace(/\.\s*berlaku sampai.*$/i, "").trim();
}

function isCertificationBearingExternalRow(row: LearnGrowthSourceRow, vendor: VendorName | null) {
  if (vendor !== "ID Networkers") return false;
  const title = row.rencana_kerja.trim().toLocaleLowerCase("id-ID");
  return (
    title.includes("mtcna") ||
    title.includes("fortigate firewall security") ||
    title === "development & operations"
  );
}

/** Transform source rows while preserving certification facets linked to external sessions. */
export function transformLearnGrowthRows(
  rows: readonly LearnGrowthSourceRow[],
): Pick<DashboardData, "trainings" | "certifications"> {
  const trainings: TrainingSession[] = [];
  const certifications: Certification[] = [];

  for (const row of rows) {
    const program = normalizeProgram(row.program);
    const person = row.narasumber?.trim() || "Tidak tercatat";
    const category = normalizeCategory(row.category_kerja);
    const vendor = normalizeVendor(row.narasumber);

    if (program === "CERTIFICATION") {
      certifications.push({
        id: row.id,
        name: cleanCertificationName(row.rencana_kerja),
        issueDate: row.tanggal,
        validUntil: row.exp_sertifikat,
        person,
        category,
        vendor,
        linkedSessionId: null,
      });
      continue;
    }

    const type = program === "TRAINING INTERNAL" ? "internal" : "external";
    trainings.push({
      id: row.id,
      title: row.rencana_kerja,
      date: row.tanggal,
      type,
      category,
      person,
      participants: splitParticipants(row.peserta),
      vendor: type === "external" ? vendor : null,
    });

    if (type === "external" && isCertificationBearingExternalRow(row, vendor)) {
      certifications.push({
        id: `CERT-${row.id}`,
        name: cleanCertificationName(row.rencana_kerja),
        issueDate: row.tanggal,
        validUntil: row.exp_sertifikat,
        person: row.peserta?.trim() || "Tidak tercatat",
        category,
        vendor,
        linkedSessionId: row.id,
      });
    }
  }

  return { trainings, certifications };
}
