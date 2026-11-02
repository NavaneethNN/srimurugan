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
    <main className="min-h-screen bg-[#080808] text-[#f4efe8]">
      <AdminNav title="Staff & POS Access" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Staff &amp; POS Access
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9993a]/40 bg-[#c9993a]/10 px-3 py-1 text-xs font-semibold text-[#e8be6a]">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {activeCount} Active POS Staff
              </span>
            </div>
            <p className="mt-0.5 font-dancing text-lg text-[#c9993a]">
              Counter staff credentials and POS register authorizations
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
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-[#222018] bg-[#111010]/50 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9993a]/30 bg-[#c9993a]/10 text-[#e8be6a]">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Loading staff members...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
            {/* Form Box */}
            <div className="h-fit rounded-3xl border border-[#222018] bg-gradient-to-b from-[#111010] to-[#0c0a08] p-6 shadow-2xl">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-white">
                  {editingId ? "Edit Staff Account" : "Add New Staff Member"}
                </h2>
                <p className="text-xs text-[#b8b2aa]">Set display name and secure POS access PIN</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#b8b2aa]">
                    Full Name <span className="text-[#e8be6a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh K."
                    maxLength={120}
                    required
                    className="mt-1.5 w-full rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 py-2.5 text-xs text-[#f4efe8] placeholder-[#b8b2aa]/50 outline-none transition focus:border-[#c9993a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#b8b2aa]">
                    POS Login PIN {editingId ? "(Leave empty to keep existing)" : "(4-6 digits) *"}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={editingId ? "•••• (Unchanged)" : "e.g. 1234"}
                    required={!editingId}
                    className="mt-1.5 w-full rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 py-2.5 font-mono text-xs text-[#f4efe8] placeholder-[#b8b2aa]/50 outline-none transition focus:border-[#c9993a]"
                  />
                  <p className="mt-1 text-[11px] text-[#b8b2aa]">
                    Used by staff to sign into the Cafe POS terminal.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080808] shadow-md shadow-[#c9993a]/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update Staff" : "Add Staff Member"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-[#2c2820] bg-[#161410] px-4 py-2.5 text-xs font-semibold text-[#b8b2aa] transition hover:bg-[#222018] hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Cinema Staff Guidelines */}
              <div className="mt-6 rounded-2xl border border-[#c9993a]/30 bg-[#c9993a]/10 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#e8be6a]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>POS Access Guide</span>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-[11px] text-[#f4efe8]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e8be6a]">•</span>
                    <span>Staff sign into the register at <code className="rounded bg-[#080808] px-1 py-0.5 text-[#e8be6a]">/cafe/login</code></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e8be6a]">•</span>
                    <span>All PINs are securely hashed in the database</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e8be6a]">•</span>
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
                <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#222018] bg-[#111010]/30 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2c2820] bg-[#161410] text-[#c9993a]">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">No staff members enrolled</h3>
                  <p className="mt-1 text-xs text-[#b8b2aa]">Use the form to create counter POS accounts for your team</p>
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
                        className="group flex flex-col justify-between rounded-2xl border border-[#222018] bg-gradient-to-b from-[#111010] to-[#0c0a08] p-4 shadow-md transition hover:border-[#c9993a]/50"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9993a]/40 bg-[#c9993a]/15 font-bold text-[#e8be6a]">
                                {initials}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-white">{user.name}</h3>
                                <p className="text-[11px] text-[#b8b2aa]">POS Staff • #{user.id}</p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                user.isActive
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                                  : "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                              }`}
                            >
                              {user.isActive ? "Active" : "Disabled"}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 rounded-xl border border-[#222018] bg-[#161410] p-2.5 text-xs">
                            <div className="flex items-center justify-between text-[#b8b2aa]">
                              <span>PIN Status:</span>
                              <span className="font-mono text-[#f4efe8]">•••• (Secured)</span>
                            </div>
                            <div className="flex items-center justify-between text-[#b8b2aa]">
                              <span>Added on:</span>
                              <span className="text-[#f4efe8]">{new Date(user.createdAt).toLocaleDateString("en-IN")}</span>
                            </div>
                            {user.lastLoginAt && (
                              <div className="flex items-center justify-between text-[#b8b2aa]">
                                <span>Last Login:</span>
                                <span className="text-[#e8be6a]">{new Date(user.lastLoginAt).toLocaleString("en-IN")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="mt-3 flex items-center gap-2 border-t border-[#222018] pt-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="flex-1 rounded-xl border border-[#2c2820] bg-[#161410] px-3 py-1.5 text-xs font-semibold text-[#f4efe8] transition hover:border-[#c9993a]/50 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(user)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                              user.isActive
                                ? "border-[#c9993a]/40 bg-[#c9993a]/15 text-[#e8be6a] hover:bg-[#c9993a]/25"
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
