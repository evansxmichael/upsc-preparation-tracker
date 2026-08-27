"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ type: "pending" | "rejected" | "invalid"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.code === "PENDING_APPROVAL" || res.error.includes("PENDING_APPROVAL")) {
          setError({
            type: "pending",
            message: "⏳ Your registration is currently pending Admin approval. Access will be unlocked once approved.",
          });
        } else if (res.code === "ACCOUNT_REJECTED" || res.error.includes("ACCOUNT_REJECTED")) {
          setError({
            type: "rejected",
            message: "⛔ Your registration request was rejected by the administrator.",
          });
        } else {
          setError({
            type: "invalid",
            message: "Invalid email address or password.",
          });
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError({
        type: "invalid",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbf9] px-4 select-none">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            AUTHENTICATION PORTAL
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#0f172a]">
            UPSC CSE Companion
          </h1>
          <p className="text-xs text-gray-500">
            Sign in to access your preparation database
          </p>
        </div>

        {/* Dynamic Context Alert */}
        {error && (
          <div
            className={`p-3 rounded text-xs font-mono text-center border ${
              error.type === "pending"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : error.type === "rejected"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
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
            {loading ? "Verifying Credentials..." : "Sign In ➔"}
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-mono text-gray-500">
          New aspirant?{" "}
          <Link href="/register" className="text-[#991b1b] font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}