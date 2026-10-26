/**
 * Pembatas laju percobaan login.
 *
 * Sengaja tidak memakai "server-only". Modul ini logika murni tanpa akses
 * database atau rahasia, dan penjaga itu membuatnya tidak bisa diuji lewat
 * node --test yang berjalan di luar bundler Next.
 */

/**
 *
 * Tanpa ini, form login menjadi oracle penebak password: SP membalas cepat dan
 * tidak ada yang menghentikan ribuan percobaan. Kolom IsLocked di UM_Employee
 * tidak menolong karena SP sengaja tidak menulis apa pun ke sana, jadi
 * penghitungnya harus ada di sisi dashboard.
 *
 * Penyimpanannya di memori proses. Cukup untuk satu instance, tetapi perlu
 * dicatat: bila dashboard diskalakan ke beberapa replika, tiap replika punya
 * hitungan sendiri sehingga batas efektifnya berlipat. Saat itu tiba,
 * pindahkan penyimpanan ke Redis dengan antarmuka fungsi yang sama.
 */

type Attempt = {
  count: number;
  /** Epoch ms saat jendela pengamatan berakhir. */
  resetAt: number;
  /** Epoch ms hingga kapan kunci ini ditolak. */
  blockedUntil: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;

/** Batas jumlah kunci, supaya serangan dengan NIK acak tidak menghabiskan memori. */
const MAX_TRACKED_KEYS = 10_000;

const globalForRateLimit = globalThis as unknown as {
  authAttempts: Map<string, Attempt> | undefined;
};

const attempts: Map<string, Attempt> =
  globalForRateLimit.authAttempts ?? new Map();

globalForRateLimit.authAttempts = attempts;

function sweep(now: number) {
  for (const [key, value] of attempts) {
    if (value.resetAt <= now && value.blockedUntil <= now) {
      attempts.delete(key);
    }
  }

  // Bila penyapuan belum cukup, buang entri terlama. Map mempertahankan
  // urutan penyisipan, jadi entri pertama adalah yang paling tua.
  if (attempts.size > MAX_TRACKED_KEYS) {
    const excess = attempts.size - MAX_TRACKED_KEYS;
    let removed = 0;

    for (const key of attempts.keys()) {
      attempts.delete(key);
      if (++removed >= excess) break;
    }
  }
}

/**
 * Alamat IP pemanggil.
 *
 * Header proxy hanya dipercaya bila TRUST_PROXY_HEADERS bernilai true. Bila
 * dipercaya tanpa syarat, penyerang cukup mengirim X-Forwarded-For acak untuk
 * mendapatkan kuota baru pada tiap permintaan.
 */
function clientIp(req: Request): string {
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = req.headers.get("x-forwarded-for");

    // Entri pertama adalah klien asli; sisanya rantai proxy.
    if (forwarded) return forwarded.split(",")[0]!.trim();

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }

  return "unknown";
}

/**
 * Kunci penghitung: gabungan IP dan NIK.
 *
 * Memakai NIK saja membuat satu penyerang bisa mengunci akun orang lain.
 * Memakai IP saja membuat satu kantor ber-NAT saling menghabiskan kuota.
 */
export function clientKeyFor(req: Request, identifier: string): string {
  return `${clientIp(req)}::${identifier.toLowerCase()}`;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();

  sweep(now);

  const entry = attempts.get(key);

  if (!entry) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
      blockedUntil: 0,
    });
    return { allowed: true };
  }

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  if (entry.resetAt <= now) {
    entry.count = 1;
    entry.resetAt = now + WINDOW_MS;
    entry.blockedUntil = 0;
    return { allowed: true };
  }

  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(BLOCK_MS / 1000),
    };
  }

  return { allowed: true };
}

/** Dipanggil setelah login berhasil supaya percobaan sah tidak menumpuk. */
export function resetRateLimit(key: string) {
  attempts.delete(key);
}

/** Hanya untuk pengujian. */
export function __clearRateLimit() {
  attempts.clear();
}
