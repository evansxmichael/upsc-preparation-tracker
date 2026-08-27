"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface AspirantUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ASPIRANT";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AspirantUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  if (status === "loading" || loading) {
    return <div className="p-8 font-mono text-xs text-gray-500">Loading Command Center...</div>;
  }

  if ((session?.user as any)?.role !== "ADMIN") {
    return (
      <div className="p-12 text-center">
        <span className="text-red-700 font-mono font-bold text-sm block">⛔ Access Denied</span>
        <p className="text-gray-500 font-mono text-xs mt-1">
          Master Command is restricted exclusively to Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-20">
      <div className="border-b border-gray-200 pb-3">
        <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
          MASTER COMMAND
        </span>
        <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
          Aspirant Security & Approvals
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#fbfbf9] border-b border-gray-200 text-gray-500 uppercase text-[10px]">
            <tr>
              <th className="p-3">Aspirant</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <span className="font-bold text-gray-900 block">{u.name || "Aspirant"}</span>
                  <span className="text-[11px] text-gray-500">{u.email}</span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : u.status === "PENDING"
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-gray-400 text-[11px]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-right space-x-2">
                  {u.status !== "APPROVED" && (
                    <button
                      onClick={() => handleUpdateStatus(u.id, "APPROVED")}
                      className="px-2.5 py-1 bg-emerald-700 text-white rounded hover:bg-emerald-800 text-[11px] font-bold cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                  {u.status !== "REJECTED" && (
                    <button
                      onClick={() => handleUpdateStatus(u.id, "REJECTED")}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-[11px] font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="px-2.5 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-[11px] font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}