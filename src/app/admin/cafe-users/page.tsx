"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

type CafeUser = {
  id: number;
  name: string;
  pin?: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export default function CafeUsersPage() {
  const [users, setUsers] = useState<CafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formName, setFormName] = useState("");
  const [formPin, setFormPin] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/cafe-users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load staff accounts");
      setUsers(data.users || []);
      setMessage(null);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load staff accounts",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setMessage({ type: "error", text: "Staff member name is required." });
      return;
    }

    if (!editingId && !formPin.trim()) {
      setMessage({ type: "error", text: "A 4-6 digit numeric PIN is required for new staff." });
      return;
    }

    if (formPin.trim() && !/^\d{4,6}$/.test(formPin.trim())) {
      setMessage({ type: "error", text: "PIN must be between 4 and 6 numeric digits." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = editingId ? `/api/admin/cafe-users/${editingId}` : "/api/admin/cafe-users";
      const payload: { name: string; pin?: string } = { name: formName.trim() };
      if (formPin.trim()) {
        payload.pin = formPin.trim();
      }

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save staff member");

      setMessage({
        type: "success",
        text: editingId ? "Staff member profile updated successfully." : "New staff member account created.",
      });
      resetForm();
      await loadUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save staff member",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: CafeUser) => {
    setEditingId(user.id);
    setFormName(user.name);
    setFormPin("");
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = async (user: CafeUser) => {
    try {
      const response = await fetch(`/api/admin/cafe-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update staff status");

      setMessage({
        type: "success",
        text: `Staff member "${user.name}" ${!user.isActive ? "activated" : "deactivated"}.`,
      });
      await loadUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update staff status",
      });
    }
  };

  const handleDelete = async (user: CafeUser) => {
    if (!confirm(`Are you sure you want to delete staff account "${user.name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/cafe-users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete staff member");

      setMessage({ type: "success", text: `Staff account "${user.name}" removed.` });
      await loadUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete staff member",
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormPin("");
    setMessage(null);
  };

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <main className="min-h-screen bg-[#090c12] text-slate-100">
      <AdminNav title="Staff & POS Users" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Staff & POS Access
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {activeCount} Active POS Staff
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Manage counter staff logins and POS terminal PINs for the cafe concessions team.
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-xs font-semibold ${
              message.type === "error"
                ? "border-rose-500/40 bg-rose-950/40 text-rose-200"
                : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
            }`}
          >
            <svg
              className={`mt-0.5 h-4 w-4 shrink-0 ${message.type === "error" ? "text-rose-400" : "text-emerald-400"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {message.type === "error" ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              ) : (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </>
              )}
            </svg>
            <span className="flex-1">{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Loading staff members...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
            {/* Form Box */}
            <div className="h-fit rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-[#0c101a] p-6 shadow-xl">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-white">
                  {editingId ? "Edit Staff Account" : "Add New Staff Member"}
                </h2>
                <p className="text-xs text-slate-400">Set display name and secure POS access PIN</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh K."
                    maxLength={120}
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    POS Login PIN {editingId ? "(Leave empty to keep existing)" : "(4-6 digits) *"}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={editingId ? "•••• (Unchanged)" : "e.g. 1234"}
                    required={!editingId}
                    className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Used by staff to sign into the Cafe POS terminal.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update Staff" : "Add Staff Member"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Cinema Staff Guidelines */}
              <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>POS Access Guide</span>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>Staff sign into the register at <code className="rounded bg-slate-950 px-1 py-0.5 text-amber-300">/cafe/login</code></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>All PINs are securely hashed in the database</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>Deactivating a staff account blocks terminal access immediately</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Staff List Grid */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Staff Roster ({users.length})</h2>
              </div>

              {users.length === 0 ? (
                <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-amber-400">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">No staff members enrolled</h3>
                  <p className="mt-1 text-xs text-slate-400">Use the form to create counter POS accounts for your team</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {users.map((user) => {
                    const initials = user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={user.id}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#0c101a] p-4 shadow-md transition hover:border-slate-700"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 font-bold text-amber-300">
                                {initials}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-white">{user.name}</h3>
                                <p className="text-[11px] text-slate-400">POS Staff • #{user.id}</p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                user.isActive
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {user.isActive ? "Active" : "Disabled"}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 rounded-xl border border-slate-800/60 bg-slate-950/40 p-2.5 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>PIN Status:</span>
                              <span className="font-mono text-slate-200">•••• (Secured)</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Added on:</span>
                              <span className="text-slate-300">{new Date(user.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>
                            {user.lastLoginAt && (
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Last Login:</span>
                                <span className="text-slate-300">{new Date(user.lastLoginAt).toLocaleString("en-IN")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-800/60 pt-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="flex-1 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-700 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(user)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                              user.isActive
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(user)}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
