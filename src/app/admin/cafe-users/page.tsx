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
  updatedAt?: string;
};

export default function CafeUsersPage() {
  const [users, setUsers] = useState<CafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPin, setFormPin] = useState("");
  const [showFormPin, setShowFormPin] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Dedicated "Change PIN" Modal states
  const [pinModalUser, setPinModalUser] = useState<CafeUser | null>(null);
  const [modalNewPin, setModalNewPin] = useState("");
  const [modalConfirmPin, setModalConfirmPin] = useState("");
  const [modalShowPin, setModalShowPin] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/cafe-users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load staff accounts");
      setUsers(data.users || []);
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

    const cleanPin = formPin.trim();
    if (!editingId && !cleanPin) {
      setMessage({ type: "error", text: "A 4-6 digit numeric PIN is required for new staff." });
      return;
    }

    if (cleanPin && !/^\d{4,6}$/.test(cleanPin)) {
      setMessage({ type: "error", text: "PIN must be between 4 and 6 numeric digits." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = editingId ? `/api/admin/cafe-users/${editingId}` : "/api/admin/cafe-users";
      const payload: { name: string; pin?: string } = { name: formName.trim() };
      if (cleanPin) {
        payload.pin = cleanPin;
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
        text: editingId
          ? cleanPin
            ? `Staff member "${formName.trim()}" name and PIN updated successfully!`
            : `Staff member "${formName.trim()}" profile updated successfully.`
          : `New staff member "${formName.trim()}" enrolled successfully.`,
      });

      setEditingId(null);
      setFormName("");
      setFormPin("");
      setShowFormPin(false);
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
    setShowFormPin(false);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormName("");
    setFormPin("");
    setShowFormPin(false);
  };

  const handleOpenPinModal = (user: CafeUser) => {
    setPinModalUser(user);
    setModalNewPin("");
    setModalConfirmPin("");
    setModalShowPin(false);
    setModalError(null);
  };

  const handleClosePinModal = () => {
    if (modalSaving) return;
    setPinModalUser(null);
    setModalNewPin("");
    setModalConfirmPin("");
    setModalShowPin(false);
    setModalError(null);
  };

  const handleSavePinModal = async (e: FormEvent) => {
    e.preventDefault();
    if (!pinModalUser) return;

    const cleanPin = modalNewPin.trim();
    if (!/^\d{4,6}$/.test(cleanPin)) {
      setModalError("PIN must be between 4 and 6 numeric digits.");
      return;
    }

    if (modalConfirmPin.trim() && cleanPin !== modalConfirmPin.trim()) {
      setModalError("Confirmation PIN does not match. Please re-enter.");
      return;
    }

    setModalSaving(true);
    setModalError(null);

    try {
      const response = await fetch(`/api/admin/cafe-users/${pinModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: cleanPin }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update staff PIN");

      const staffName = pinModalUser.name;
      handleClosePinModal();
      setMessage({
        type: "success",
        text: `PIN for "${staffName}" changed successfully. The new PIN is active immediately for POS login.`,
      });
      await loadUsers();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to update staff PIN");
    } finally {
      setModalSaving(false);
    }
  };

  const handleToggleActive = async (user: CafeUser) => {
    try {
      const response = await fetch(`/api/admin/cafe-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update staff status");

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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete staff member");

      setMessage({ type: "success", text: `Staff account "${user.name}" removed.` });
      await loadUsers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete staff member",
      });
    }
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

        {/* Global Message Banner */}
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
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="opacity-70 hover:opacity-100 transition"
              aria-label="Dismiss message"
            >
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
          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* Form Box */}
            <div className="h-fit rounded-3xl border border-[#222018] bg-gradient-to-b from-[#111010] to-[#0c0a08] p-5 sm:p-6 shadow-2xl">
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    {editingId ? "Edit Staff Account" : "Add New Staff Member"}
                  </h2>
                  {editingId && (
                    <span className="rounded-full bg-[#c9993a]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e8be6a] border border-[#c9993a]/30">
                      Editing #{editingId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#b8b2aa] mt-0.5">
                  {editingId
                    ? "Update staff name or enter a new PIN below"
                    : "Create a counter POS login with name and secure numeric PIN"}
                </p>
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
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#b8b2aa]">
                      {editingId ? "New POS PIN" : "POS Login PIN"} {!editingId && <span className="text-[#e8be6a]">*</span>}
                    </label>
                    {formPin.length > 0 && (
                      <span className="text-[10px] font-mono text-[#c9993a]">
                        {formPin.length}/6 digits
                      </span>
                    )}
                  </div>

                  <div className="relative mt-1.5">
                    <input
                      type={showFormPin ? "text" : "password"}
                      inputMode="numeric"
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder={editingId ? "Leave blank to keep existing PIN" : "4 to 6-digit numeric PIN"}
                      required={!editingId}
                      className="w-full rounded-xl border border-[#2c2820] bg-[#161410] pl-3.5 pr-10 py-2.5 font-mono text-xs text-[#f4efe8] placeholder-[#b8b2aa]/40 outline-none transition focus:border-[#c9993a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPin((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#b8b2aa] hover:text-[#f4efe8] transition"
                      aria-label={showFormPin ? "Hide PIN" : "Show PIN"}
                    >
                      {showFormPin ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <p className="mt-1 text-[11px] text-[#b8b2aa]">
                    {editingId
                      ? "Only fill this if you want to replace the current PIN with a new 4 to 6-digit PIN."
                      : "4 to 6 numeric digits used by staff to sign into the POS register."}
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
                      onClick={handleCancelEdit}
                      className="rounded-xl border border-[#2c2820] bg-[#161410] px-4 py-2.5 text-xs font-semibold text-[#b8b2aa] transition hover:bg-[#222018] hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* POS Access Guidelines */}
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
                    <span>Each staff member must have a unique numeric PIN (4-6 digits)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e8be6a]">•</span>
                    <span>All PINs are securely salted and hashed in the database</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e8be6a]">•</span>
                    <span>Use &ldquo;Change PIN&rdquo; on any staff card to set or reset credentials</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#e8be6a]">•</span>
                    <span>Staff members cannot change their own PIN — only administrators can manage credentials</span>
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

                          <div className="mt-3 space-y-1.5 rounded-xl border border-[#222018] bg-[#161410] p-2.5 text-xs">
                            <div className="flex items-center justify-between text-[#b8b2aa]">
                              <span className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>PIN Status:</span>
                              </span>
                              <span className="font-mono text-emerald-400 font-semibold">Active (Encrypted)</span>
                            </div>

                            {user.updatedAt && (
                              <div className="flex items-center justify-between text-[#b8b2aa]">
                                <span>Last Updated:</span>
                                <span className="text-[#f4efe8]">
                                  {new Date(user.updatedAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}

                            {user.lastLoginAt ? (
                              <div className="flex items-center justify-between text-[#b8b2aa]">
                                <span>Last Sign In:</span>
                                <span className="text-[#e8be6a]">
                                  {new Date(user.lastLoginAt).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[#b8b2aa]">
                                <span>Last Sign In:</span>
                                <span className="text-[#b8b2aa]/70">No sign-ins yet</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#222018] pt-3">
                          {/* Change PIN Dedicated Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPinModal(user)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#c9993a]/40 bg-[#c9993a]/15 px-3 py-1.5 text-xs font-bold text-[#e8be6a] transition hover:bg-[#c9993a]/25 hover:border-[#c9993a]"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5L13 7l-1.5-1.5L10 7 8.5 5.5 7 7l-5 5v5h5l7-7" />
                              <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                            </svg>
                            <span>Change PIN</span>
                          </button>

                          {/* Edit Profile Button */}
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#161410] px-3 py-1.5 text-xs font-semibold text-[#f4efe8] transition hover:border-[#c9993a]/50 hover:text-white"
                          >
                            <svg className="h-3.5 w-3.5 text-[#b8b2aa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            <span>Edit Name</span>
                          </button>

                          {/* Toggle Active Button */}
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(user)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                              user.isActive
                                ? "border-[#2c2820] bg-[#161410] text-[#b8b2aa] hover:border-amber-500/40 hover:text-amber-300"
                                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>

                          {/* Delete Account Button */}
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

      {/* Dedicated Change PIN Modal */}
      {pinModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#2c2820] bg-gradient-to-b from-[#141210] to-[#0a0908] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#222018] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#c9993a]/40 bg-[#c9993a]/15 text-[#e8be6a]">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white">Change Staff PIN</h3>
                </div>
                <p className="mt-1 text-xs text-[#b8b2aa]">
                  Set a new 4 to 6-digit numeric login PIN for <strong className="text-white">{pinModalUser.name}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePinModal}
                disabled={modalSaving}
                className="rounded-lg p-1.5 text-[#b8b2aa] hover:bg-[#222018] hover:text-white transition disabled:opacity-50"
                aria-label="Close dialog"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-semibold text-rose-200"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePinModal} className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#b8b2aa]">
                    New Numeric PIN <span className="text-[#e8be6a]">*</span>
                  </label>
                  {modalNewPin.length > 0 && (
                    <span className={`text-[10px] font-mono ${modalNewPin.length >= 4 ? "text-emerald-400" : "text-amber-400"}`}>
                      {modalNewPin.length}/6 digits {modalNewPin.length >= 4 ? "(Valid)" : "(Min 4)"}
                    </span>
                  )}
                </div>

                <div className="relative mt-1.5">
                  <input
                    type={modalShowPin ? "text" : "password"}
                    inputMode="numeric"
                    autoFocus
                    value={modalNewPin}
                    onChange={(e) => setModalNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 4 to 6 digits"
                    required
                    className="w-full rounded-xl border border-[#2c2820] bg-[#161410] pl-3.5 pr-10 py-2.5 font-mono text-sm text-[#f4efe8] placeholder-[#b8b2aa]/40 outline-none transition focus:border-[#c9993a]"
                  />
                  <button
                    type="button"
                    onClick={() => setModalShowPin((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#b8b2aa] hover:text-[#f4efe8] transition"
                    aria-label={modalShowPin ? "Hide PIN" : "Show PIN"}
                  >
                    {modalShowPin ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#b8b2aa]">
                    Confirm New PIN <span className="text-[#e8be6a]">*</span>
                  </label>
                  {modalConfirmPin.length > 0 && (
                    <span
                      className={`text-[10px] font-semibold ${
                        modalNewPin === modalConfirmPin ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {modalNewPin === modalConfirmPin ? "PINs match" : "Does not match"}
                    </span>
                  )}
                </div>

                <input
                  type={modalShowPin ? "text" : "password"}
                  inputMode="numeric"
                  value={modalConfirmPin}
                  onChange={(e) => setModalConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Re-enter new PIN"
                  required
                  className="mt-1.5 w-full rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 py-2.5 font-mono text-sm text-[#f4efe8] placeholder-[#b8b2aa]/40 outline-none transition focus:border-[#c9993a]"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="submit"
                  disabled={modalSaving || modalNewPin.length < 4 || (modalConfirmPin.length > 0 && modalNewPin !== modalConfirmPin)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080808] shadow-md shadow-[#c9993a]/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {modalSaving ? "Saving PIN..." : "Update PIN Now"}
                </button>
                <button
                  type="button"
                  onClick={handleClosePinModal}
                  disabled={modalSaving}
                  className="rounded-xl border border-[#2c2820] bg-[#161410] px-4 py-2.5 text-xs font-semibold text-[#b8b2aa] transition hover:bg-[#222018] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
