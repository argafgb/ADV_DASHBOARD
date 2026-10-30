import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!code) {
    return new NextResponse("Code parameter is required", { status: 400 });
  }

  const safeCode = code.trim();
  if (!/^[a-zA-Z0-9_.\s-]+$/.test(safeCode)) {
    return new NextResponse("Invalid employee code", { status: 400 });
  }
  const isDebug = _request.nextUrl.searchParams.get("debug") === "1";

  // 1. Cek folder lokal public/avatars jika user menaruh custom avatar (.jpg, .jpeg, .png, .webp)
  const extensions = [
    { ext: ".jpg", mime: "image/jpeg" },
    { ext: ".jpeg", mime: "image/jpeg" },
    { ext: ".png", mime: "image/png" },
    { ext: ".webp", mime: "image/webp" },
  ];

  const candidateNames = [
    safeCode,
    safeCode.toLowerCase(),
    safeCode.toUpperCase(),
    safeCode.replace(/[\s-]+/g, "_"),
    safeCode.replace(/[\s_]+/g, "-"),
  ];

  const uniqueCandidates = Array.from(new Set(candidateNames));

  for (const candidate of uniqueCandidates) {
    for (const { ext, mime } of extensions) {
      const publicAvatarPath = path.join(
        process.cwd(),
        "public",
        "avatars",
        `${candidate}${ext}`,
      );
      if (!isDebug && fs.existsSync(publicAvatarPath)) {
        try {
          const fileBuffer = await fs.promises.readFile(publicAvatarPath);
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": mime,
              "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            },
          });
        } catch (err) {
          console.error("[Local Avatar Read Error]:", err);
        }
      }
    }
  }

  // 2. Fetch ke server backend ASP.NET (GetProfilePic.ashx langsung membaca spesimen foto tanpa butuh session)
  const baseUrl = (process.env.ADV_BASE_URL || "https://dctweb2.advantagescm.com/STAGING").replace(/\/+$/, "");
  const sessionCookie = (process.env.ADV_SESSION_COOKIE || "").trim();
  const externalUrl = `${baseUrl}/APP/GetProfilePic.ashx?UserID=${encodeURIComponent(safeCode)}`;

  try {
    const res = await fetch(externalUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `${baseUrl}/HELPDESK/HELPDESK_DashboardIT.aspx`,
        ...(sessionCookie ? { Cookie: `ASP.NET_SessionId=${sessionCookie}` } : {}),
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch image", {
        status: res.status === 404 ? 404 : 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const disposition = res.headers.get("content-disposition") || "";
    // Jika server DCTWeb mengembalikan placeholder unknown person, beri status 404 agar UI memakai placeholder lokal
    if (disposition.toLowerCase().includes("unknown-person")) {
      return new NextResponse("Specimen image not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return new NextResponse("Specimen image empty", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("ADV returned a non-image response", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[Avatar Proxy Error]:", err);
    return new NextResponse("Internal Proxy Error", { status: 500 });
  }
}
