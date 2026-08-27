"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "Registration submitted! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Failed to register.");
      }
    } catch {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbf9] px-4 select-none">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            ASPIRANT REGISTRATION
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0f172a]">
            Create Account
          </h1>
          <p className="text-xs text-gray-500">
            Submit your profile for administrative approval
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-mono text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-gray-600 mb-1">Full Name / Aspirant Alias</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aspirant Name"
              className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden font-sans text-xs"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aspirant@gmail.com"
              className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden font-sans text-xs"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden font-sans text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0f172a] text-white rounded font-bold hover:bg-black transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Submitting Registration..." : "Register Aspirant Profile ➔"}
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-mono text-gray-500">
          Already registered?{" "}
          <Link href="/login" className="text-[#0f172a] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}