import type {
  RatingDistributionRow,
  RootCauseDetailTicket,
  RootCauseItem,
} from "../types/rootCause.types";

export const dctRootCauses: RootCauseItem[] = [
  {
    rank: 1,
    name: "HUMAN ERROR",
    tickets: 415,
    growth: 4.3,
    color: "violet",
    iconKey: "human",
    department: "DCT Support",
    children: [
      {
        name: "BPD",
        tickets: 116,
        children: [
          { name: "KONEKSI", tickets: 42 },
          { name: "CONFIG", tickets: 31 },
          { name: "STOCK OPNAME", tickets: 26 },
          { name: "VALIDASI DELIVE...", tickets: 17 },
        ],
      },
      {
        name: "Finance",
        tickets: 91,
        children: [
          { name: "REPORT GENERIC", tickets: 32 },
          { name: "VALIDASI DELIVE...", tickets: 24 },
          { name: "CONFIG", tickets: 19 },
          { name: "KONEKSI", tickets: 16 },
        ],
      },
      {
        name: "Vault / Cash Center",
        tickets: 78,
        children: [
          { name: "SEAL PUTUS", tickets: 26 },
          { name: "MONITORING END...", tickets: 22 },
          { name: "REPORT GENERIC", tickets: 17 },
          { name: "VALIDASI DELIVE...", tickets: 13 },
        ],
      },
      {
        name: "Fleet & Transportation",
        tickets: 65,
        children: [
          { name: "SETTING DESK", tickets: 24 },
          { name: "STOCK OPNAME", tickets: 18 },
          { name: "REPORT GENERIC", tickets: 13 },
          { name: "CONFIG", tickets: 10 },
        ],
      },
      {
        name: "Purchasing",
        tickets: 39,
        children: [
          { name: "CONFIG", tickets: 14 },
          { name: "KONEKSI", tickets: 12 },
          { name: "VALIDASI", tickets: 8 },
          { name: "REPORT", tickets: 5 },
        ],
      },
      {
        name: "Audit",
        tickets: 26,
        children: [
          { name: "REPORT", tickets: 10 },
          { name: "CONFIG", tickets: 7 },
          { name: "VALIDASI", tickets: 5 },
          { name: "KONEKSI", tickets: 4 },
        ],
      },
    ],
  },
  {
    rank: 2,
    name: "BUG SYSTEM",
    tickets: 311,
    growth: 6.5,
    color: "red",
    iconKey: "bug",
    department: "DCT Support",
    children: [
      {
        name: "BPD",
        tickets: 116,
        children: [
          { name: "KONEKSI", tickets: 39 },
          { name: "CONFIG", tickets: 31 },
          { name: "REPORT", tickets: 25 },
          { name: "VALIDASI", tickets: 21 },
        ],
      },
      {
        name: "Finance",
        tickets: 52,
        children: [
          { name: "CONFIG", tickets: 20 },
          { name: "KONEKSI", tickets: 15 },
          { name: "COMBO", tickets: 10 },
          { name: "REPORT", tickets: 7 },
        ],
      },
      {
        name: "COS",
        tickets: 78,
        children: [
          { name: "CONFIG", tickets: 28 },
          { name: "KONEKSI", tickets: 22 },
          { name: "REINSTALL", tickets: 18 },
          { name: "ERROR", tickets: 10 },
        ],
      },
      {
        name: "Purchasing",
        tickets: 39,
        children: [
          { name: "CONFIG", tickets: 16 },
          { name: "KONEKSI", tickets: 11 },
          { name: "COMBO", tickets: 8 },
          { name: "OTHER", tickets: 4 },
        ],
      },
      {
        name: "Vault / Cash",
        tickets: 26,
        children: [
          { name: "CONFIG", tickets: 9 },
          { name: "KONEKSI", tickets: 8 },
          { name: "REPORT", tickets: 5 },
          { name: "OTHER", tickets: 4 },
        ],
      },
    ],
  },
  {
    rank: 3,
    name: "DATA MODIFICATION",
    tickets: 233,
    growth: -2.5,
    color: "cyan",
    iconKey: "data",
    department: "DCT Support",
    children: [
      {
        name: "Finance",
        tickets: 90,
        children: [
          { name: "VALIDASI DELIVE...", tickets: 33 },
          { name: "REPORT GENERIC", tickets: 24 },
          { name: "CONFIG", tickets: 18 },
          { name: "KONEKSI", tickets: 15 },
        ],
      },
      {
        name: "Treasury",
        tickets: 65,
        children: [
          { name: "REPORT GENERIC", tickets: 23 },
          { name: "VALIDASI DELIVE...", tickets: 18 },
          { name: "CONFIG", tickets: 14 },
          { name: "OTHER", tickets: 10 },
        ],
      },
      {
        name: "COS",
        tickets: 52,
        children: [
          { name: "CONFIG", tickets: 20 },
          { name: "KONEKSI", tickets: 13 },
          { name: "REPORT", tickets: 10 },
          { name: "VALIDASI", tickets: 9 },
        ],
      },
      {
        name: "Audit",
        tickets: 26,
        children: [
          { name: "REPORT", tickets: 9 },
          { name: "CONFIG", tickets: 7 },
          { name: "VALIDASI", tickets: 6 },
          { name: "OTHER", tickets: 4 },
        ],
      },
    ],
  },
  {
    rank: 4,
    name: "USER EDUCATION",
    tickets: 182,
    growth: -7.6,
    color: "amber",
    iconKey: "education",
    department: "DCT Support",
    children: [
      {
        name: "BPD",
        tickets: 59,
        children: [
          { name: "SETTING DESK", tickets: 20 },
          { name: "INSTALL", tickets: 16 },
          { name: "EMAIL PENUH", tickets: 13 },
          { name: "VALIDASI", tickets: 10 },
        ],
      },
      {
        name: "Finance",
        tickets: 33,
        children: [
          { name: "SETTING DESK", tickets: 12 },
          { name: "EMAIL PENUH", tickets: 9 },
          { name: "INSTALL", tickets: 7 },
          { name: "OTHER", tickets: 5 },
        ],
      },
      {
        name: "Purchasing",
        tickets: 26,
        children: [
          { name: "SETTING DESK", tickets: 10 },
          { name: "INSTALL", tickets: 7 },
          { name: "EMAIL PENUH", tickets: 5 },
          { name: "OTHER", tickets: 4 },
        ],
      },
      {
        name: "COS",
        tickets: 26,
        children: [
          { name: "SETTING DESK", tickets: 9 },
          { name: "INSTALL", tickets: 7 },
          { name: "EMAIL PENUH", tickets: 6 },
          { name: "OTHER", tickets: 4 },
        ],
      },
      {
        name: "Vault / Cash",
        tickets: 19,
        children: [
          { name: "SETTING DESK", tickets: 8 },
          { name: "EMAIL PENUH", tickets: 5 },
          { name: "INSTALL", tickets: 4 },
          { name: "OTHER", tickets: 2 },
        ],
      },
      {
        name: "Treasury",
        tickets: 19,
        children: [
          { name: "SETTING DESK", tickets: 7 },
          { name: "EMAIL PENUH", tickets: 5 },
          { name: "INSTALL", tickets: 4 },
          { name: "OTHER", tickets: 3 },
        ],
      },
    ],
  },
  {
    rank: 5,
    name: "IMPROVEMENT",
    tickets: 99,
    growth: 12.5,
    color: "emerald",
    iconKey: "improvement",
    department: "DCT Support",
    children: [
      {
        name: "COS",
        tickets: 33,
        children: [
          { name: "CONFIG", tickets: 12 },
          { name: "REINSTALL", tickets: 9 },
          { name: "REPORT", tickets: 7 },
          { name: "OTHER", tickets: 5 },
        ],
      },
      {
        name: "Finance",
        tickets: 26,
        children: [
          { name: "CONFIG", tickets: 10 },
          { name: "REINSTALL", tickets: 7 },
          { name: "REPORT", tickets: 5 },
          { name: "OTHER", tickets: 4 },
        ],
      },
      {
        name: "BPD",
        tickets: 19,
        children: [
          { name: "CONFIG", tickets: 8 },
          { name: "REINSTALL", tickets: 5 },
          { name: "REPORT", tickets: 4 },
          { name: "OTHER", tickets: 2 },
        ],
      },
      {
        name: "Treasury",
        tickets: 11,
        children: [
          { name: "CONFIG", tickets: 4 },
          { name: "REINSTALL", tickets: 3 },
          { name: "REPORT", tickets: 2 },
          { name: "OTHER", tickets: 2 },
        ],
      },
      {
        name: "Audit",
        tickets: 10,
        children: [
          { name: "CONFIG", tickets: 4 },
          { name: "REINSTALL", tickets: 3 },
          { name: "REPORT", tickets: 2 },
          { name: "OTHER", tickets: 1 },
        ],
      },
    ],
  },
];

export const itRootCauses: RootCauseItem[] = [
  {
    rank: 1,
    name: "USER EDUCATION",
    tickets: 380,
    growth: 5.8,
    color: "amber",
    iconKey: "education",
    department: "IT Support",
    children: [
      {
        name: "BPD",
        tickets: 90,
        children: [
          { name: "SETTING DESK", tickets: 34 },
          { name: "INSTALL", tickets: 24 },
          { name: "EMAIL PENUH", tickets: 18 },
          { name: "OTHER", tickets: 14 },
        ],
      },
      {
        name: "Finance",
        tickets: 80,
        children: [
          { name: "SETTING DESK", tickets: 30 },
          { name: "INSTALL", tickets: 22 },
          { name: "EMAIL PENUH", tickets: 16 },
          { name: "OTHER", tickets: 12 },
        ],
      },
      {
        name: "COS",
        tickets: 70,
        children: [
          { name: "SETTING DESK", tickets: 27 },
          { name: "INSTALL", tickets: 19 },
          { name: "EMAIL PENUH", tickets: 14 },
          { name: "OTHER", tickets: 10 },
        ],
      },
      {
        name: "Purchasing",
        tickets: 65,
        children: [
          { name: "SETTING DESK", tickets: 23 },
          { name: "INSTALL", tickets: 19 },
          { name: "EMAIL PENUH", tickets: 13 },
          { name: "OTHER", tickets: 10 },
        ],
      },
      {
        name: "Audit",
        tickets: 75,
        children: [
          { name: "SETTING DESK", tickets: 28 },
          { name: "INSTALL", tickets: 21 },
          { name: "EMAIL PENUH", tickets: 15 },
          { name: "OTHER", tickets: 11 },
        ],
      },
    ],
  },
  {
    rank: 2,
    name: "HUMAN ERROR",
    tickets: 290,
    growth: -3.2,
    color: "violet",
    iconKey: "human",
    department: "IT Support",
    children: [
      {
        name: "BPD",
        tickets: 80,
        children: [
          { name: "CONFIG", tickets: 30 },
          { name: "KONEKSI", tickets: 20 },
          { name: "REPORT", tickets: 16 },
          { name: "OTHER", tickets: 14 },
        ],
      },
      {
        name: "Finance",
        tickets: 70,
        children: [
          { name: "CONFIG", tickets: 26 },
          { name: "KONEKSI", tickets: 19 },
          { name: "REPORT", tickets: 14 },
          { name: "OTHER", tickets: 11 },
        ],
      },
      {
        name: "COS",
        tickets: 60,
        children: [
          { name: "CONFIG", tickets: 22 },
          { name: "KONEKSI", tickets: 17 },
          { name: "REPORT", tickets: 12 },
          { name: "OTHER", tickets: 9 },
        ],
      },
      {
        name: "Treasury",
        tickets: 45,
        children: [
          { name: "CONFIG", tickets: 16 },
          { name: "KONEKSI", tickets: 13 },
          { name: "REPORT", tickets: 9 },
          { name: "OTHER", tickets: 7 },
        ],
      },
      {
        name: "Audit",
        tickets: 35,
        children: [
          { name: "CONFIG", tickets: 13 },
          { name: "KONEKSI", tickets: 10 },
          { name: "REPORT", tickets: 7 },
          { name: "OTHER", tickets: 5 },
        ],
      },
    ],
  },
  {
    rank: 3,
    name: "SOFTWARE & HARDWARE",
    tickets: 180,
    growth: 8.1,
    color: "blue",
    iconKey: "software",
    department: "IT Support",
    children: [
      {
        name: "Infrastructure",
        tickets: 58,
        children: [
          { name: "NETWORK", tickets: 20 },
          { name: "SERVER", tickets: 16 },
          { name: "DEVICE", tickets: 12 },
          { name: "OTHER", tickets: 10 },
        ],
      },
      {
        name: "Hardware",
        tickets: 46,
        children: [
          { name: "PC", tickets: 17 },
          { name: "PRINTER", tickets: 12 },
          { name: "SCANNER", tickets: 9 },
          { name: "OTHER", tickets: 8 },
        ],
      },
      {
        name: "Software",
        tickets: 41,
        children: [
          { name: "APP ERROR", tickets: 15 },
          { name: "LICENSE", tickets: 11 },
          { name: "INSTALL", tickets: 8 },
          { name: "OTHER", tickets: 7 },
        ],
      },
      {
        name: "Support Tools",
        tickets: 35,
        children: [
          { name: "VPN", tickets: 13 },
          { name: "REMOTE", tickets: 10 },
          { name: "EMAIL", tickets: 7 },
          { name: "OTHER", tickets: 5 },
        ],
      },
    ],
  },
];

export const ratingRows: RatingDistributionRow[] = [
  { label: "★★★★★", tickets: 1132, percentage: 91.3, type: "good" },
  { label: "★★★★☆", tickets: 56, percentage: 4.5, type: "good" },
  { label: "★★★☆☆", tickets: 18, percentage: 1.5, type: "good" },
  { label: "★★☆☆☆", tickets: 2, percentage: 0.2, type: "bad" },
  { label: "★☆☆☆☆", tickets: 1, percentage: 0.1, type: "bad" },
  { label: "No Rating", tickets: 31, percentage: 2.5, type: "neutral" },
];

export const rootCauseDetailTickets: RootCauseDetailTicket[] = Array.from(
  { length: 50 },
  (_, index) => ({
    no: index + 1,
    ticketNo: `HD-${String(index + 1).padStart(5, "0")}`,
    tanggal: `2026-04-${String((index % 28) + 1).padStart(2, "0")}`,
    pengirim: [
      "Aldi Kurniawan",
      "DCT Operator",
      "IT Support",
      "Admin Helpdesk",
    ][index % 4],
    divisi: ["BPD", "Finance", "Vault / Cash Center", "Purchasing"][index % 4],
    judulTicket: [
      "Kesalahan input data ticket",
      "Data perlu revisi oleh user",
      "Follow up ticket belum sesuai flow",
      "Perbaikan informasi transaksi",
    ][index % 4],
  }),
);
