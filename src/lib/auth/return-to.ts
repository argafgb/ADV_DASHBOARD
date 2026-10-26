const DEFAULT_RETURN_TO = "/dashboard";

/**
 * Host fleet bawaan. Dipakai hanya kalau AUTH_ALLOWED_RETURN_HOSTS kosong,
 * supaya deployment ke domain/HTTPS cukup mengubah env tanpa menyentuh kode.
 */
const DEFAULT_ALLOWED_HOSTS = ["103.76.204.104", "localhost", "127.0.0.1"];

const ALLOWED_PORTS = new Set([
  "5703", // IT & DCT Helpdesk
  "5704", // Asset IT & PM Dashboard
  "5705", // PIC Monitoring
  "5706", // Learning & Growth
  "5707", // Server Performance
  "5708", // Network Performance
  "5709", // Proses & Risk
  "5710", // KPI Bug Tracker
  "5711", // Overtime
  "5712", // IT Repair & Maintenance
  "5713", // Kaldev Performance
  // "5777", // IT Dashboard Hub Landing Page (dinonaktifkan)
]);

/**
 * Port yang dipakai `next dev` di mesin pengembang.
 *
 * Tanpa ini, membuka salah satu dashboard dari localhost selalu berakhir di
 * dashboard issuer setelah login, karena tujuan aslinya dibuang sebagai host
 * tak dikenal. Hanya berlaku di luar produksi, jadi daftar host yang boleh
 * dituju di server tetap sempit.
 */
const DEV_PORTS = ["3000", "3001", "3002", "5798", "5799"];

/** Entri boleh "host" atau "host:port", dipisah koma. */
function allowedHosts(): string[] {
  const raw = process.env.AUTH_ALLOWED_RETURN_HOSTS?.trim();
  if (!raw) return DEFAULT_ALLOWED_HOSTS;

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedTarget(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const hosts = allowedHosts();

  // Entri dengan port harus cocok persis, jadi "app.example.com:8443" tetap bisa dikunci.
  if (hosts.includes(url.host.toLowerCase())) return true;
  if (!hosts.includes(url.hostname.toLowerCase())) return false;

  // Entri tanpa port: terima port default (kosong) atau salah satu port fleet.
  if (url.port === "" || ALLOWED_PORTS.has(url.port)) return true;

  return process.env.NODE_ENV !== "production" && DEV_PORTS.includes(url.port);
}

/**
 * Path lokal yang aman dipakai apa adanya.
 *
 * Pemeriksaan `!startsWith("//")` saja tidak cukup. Peramban menyamakan garis
 * miring terbalik dengan garis miring pada bagian otoritas URL, sehingga
 * "/\evil.com" diperlakukan sebagai "//evil.com" dan menjadi open redirect ke
 * domain luar. Karena itu karakter kedua harus benar-benar bukan pemisah.
 */
function isSafeLocalPath(value: string): boolean {
  if (!value.startsWith("/")) return false;

  const second = value[1];

  return second !== "/" && second !== "\\";
}

function isForbiddenReturnPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/forbidden" ||
    pathname.startsWith("/dashboard/forbidden/")
  );
}

/**
 * Batasi tujuan setelah login/logout ke path lokal atau dashboard fleet yang
 * dikenal, supaya returnTo tidak bisa dipakai sebagai open redirect.
 */
export function safeReturnTo(value: string | null): string {
  if (!value) return DEFAULT_RETURN_TO;

  // Karakter kendali, termasuk newline, dipakai untuk menyelundupkan header
  // pada respons redirect. Tolak sebelum diurai.
  if (/[\u0000-\u001f\u007f]/.test(value)) return DEFAULT_RETURN_TO;

  if (isSafeLocalPath(value)) {
    const pathname = value.split(/[?#]/, 1)[0];
    return isForbiddenReturnPath(pathname) ? DEFAULT_RETURN_TO : value;
  }

  try {
    const url = new URL(value);
    return isAllowedTarget(url) && !isForbiddenReturnPath(url.pathname)
      ? url.href
      : DEFAULT_RETURN_TO;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}
