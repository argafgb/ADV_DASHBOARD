"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { safeReturnTo } from "@/lib/auth/return-to";

type LoginState = {
  identifier: string;
  password: string;
};


function LoginForm() {
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get("returnTo");
  const returnTo = rawReturnTo ? safeReturnTo(rawReturnTo) : "/dashboard/asset-maintenance";

  const [form, setForm] = useState<LoginState>({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (key: keyof LoginState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    setErrorMessage("");
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.identifier.trim() || !form.password.trim()) {
      setErrorMessage("NIK / Email / No. HP dan password wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: form.identifier,
          password: form.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result?.message ?? "Login gagal.");
        return;
      }

      window.location.assign(returnTo);
    } catch {
      setErrorMessage("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[52%_48%]">
      <section className="relative flex min-h-screen flex-col px-8 py-10 sm:px-14 lg:px-20 justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/adv-icon-v2.webp"
            alt="ADV"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <div>
            <h1 className="text-lg font-black tracking-tight text-zinc-950">
              Advantage SCM
            </h1>
            <p className="text-xs text-zinc-500 font-medium">Unified Operations Dashboard</p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-110 flex-col justify-center my-auto py-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-950 font-display">
              Selamat Datang!
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Masuk untuk mengakses modul Asset IT &amp; Helpdesk Dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                NIK / Email / No. HP
              </label>
              <input
                value={form.identifier}
                onChange={(event) =>
                  handleChange("identifier", event.target.value)
                }
                placeholder="Masukkan NIK, email, atau nomor HP"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  value={form.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-medium text-zinc-950 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? "Memverifikasi..." : "Login ke Dashboard"}
            </button>
          </form>
        </div>

        <p className="text-xs font-medium text-slate-400">
          Hak cipta &copy; 2026 PT Advantage SCM. Seluruh hak dilindungi.
        </p>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-blue-600 lg:block rounded-tl-3xl rounded-bl-3xl">
        <Image
          src="/hero.webp"
          alt="Pratinjau dashboard"
          fill
          priority
          sizes="50vw"
          className="object-cover object-left-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent flex flex-col justify-end p-12 text-white">
          <p className="text-xl font-bold font-display">Satu Dashboard untuk Seluruh Operasional</p>
          <p className="text-xs text-blue-200 mt-1">
            Monitoring Preventive Maintenance, Aset IT, dan Helpdesk Ticketing secara real-time.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
