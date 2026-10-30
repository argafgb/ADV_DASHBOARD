export class AccessDeniedError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message = "Akses ditolak.", code = "FORBIDDEN", status = 403) {
    super(message);
    this.name = "AccessDeniedError";
    this.code = code;
    this.status = status;
  }
}

export class UnauthenticatedError extends Error {
  readonly status = 401;

  constructor(message = "Sesi tidak valid atau telah berakhir.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class AccessUnavailableError extends Error {
  readonly status = 503;

  constructor(message = "Layanan otorisasi database sedang tidak tersedia.") {
    super(message);
    this.name = "AccessUnavailableError";
  }
}

export class VersionConflictError extends Error {
  readonly status = 409;
  readonly code = "VERSION_CONFLICT";

  constructor(
    message = "Akses user ini baru saja diubah admin lain. Muat ulang lalu coba lagi.",
  ) {
    super(message);
    this.name = "VersionConflictError";
  }
}
