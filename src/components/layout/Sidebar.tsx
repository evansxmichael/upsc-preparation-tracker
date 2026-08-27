"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { NAV_ITEMS } from "@/config/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role;

  // 1. Prevent UI flickering while checking session status
  if (status === "loading") {
    return (
      <aside className="w-64 shrink-0 border-r border-[#e5e7eb] bg-white h-screen flex flex-col justify-between p-4 sticky top-0 select-none z-30" />
    );
  }

  // 2. Hide completely on login/register screens or when unauthenticated
  if (
    status === "unauthenticated" ||
    pathname === "/login" ||
    pathname === "/register" ||
    !session
  ) {
    return null;
  }

  return (
    <aside className="w-64 shrink-0 border-r border-[#e5e7eb] bg-white h-screen flex flex-col justify-between p-4 sticky top-0 select-none z-30">
      {/* Top Header & Navigation Links */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="px-3 py-3 border-b border-gray-100 mb-3 shrink-0">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#991b1b] font-semibold">
            CSE Command
          </span>
          <h1 className="text-xl font-serif font-bold text-[#0f172a] mt-0.5 tracking-tight">
            UPSC Tracker
          </h1>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="space-y-0.5 overflow-y-auto pr-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-xs font-mono rounded-md transition-colors ${
                  isActive
                    ? "bg-[#f3f4f1] text-[#0f172a] font-bold border-l-4 border-[#0f172a]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          {/* Admin Command Link: Only visible if role is ADMIN */}
          {userRole === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex items-center px-3 py-2 text-xs font-mono rounded-md transition-colors mt-2 ${
                pathname === "/admin"
                  ? "bg-purple-900 text-white font-bold"
                  : "bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold border border-purple-200"
              }`}
            >
              👑 Admin Command
            </Link>
          )}
        </nav>
      </div>

      {/* Bottom Profile & Session Controls */}
      <div className="pt-3 border-t border-gray-100 space-y-2 shrink-0">
        {/* User Info Badge */}
        {session?.user && (
          <div className="p-2.5 bg-[#fbfbf9] border border-gray-200 rounded-md text-xs font-mono">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  userRole === "ADMIN" ? "text-purple-700" : "text-gray-400"
                }`}
              >
                {userRole || "Aspirant"}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  userRole === "ADMIN" ? "bg-purple-600" : "bg-emerald-500"
                }`}
              />
            </div>
            <p className="font-bold text-[#0f172a] truncate mt-0.5">
              {session.user.name || "Aspirant"}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {session.user.email}
            </p>
          </div>
        )}

        {/* Sign Out Action */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-between px-3 py-2 bg-red-50 hover:bg-red-100 text-[#991b1b] rounded text-xs font-mono font-bold transition cursor-pointer"
        >
          <span>Log Out</span>
          <span>⏻</span>
        </button>
      </div>
    </aside>
  );
}