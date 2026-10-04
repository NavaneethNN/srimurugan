"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type CafeUser = {
  id: number;
  name: string;
  pin: string;
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
      
      if (!response.ok) throw new Error(data.error || "Failed to load users");
      
      setUsers(data.users);
      setMessage(null);
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err instanceof Error ? err.message : "Failed to load users" 
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
    
    if (!formName.trim() || !formPin.trim()) {
      setMessage({ type: "error", text: "Name and PIN are required" });
      return;
    }

    if (!/^\d{4,6}$/.test(formPin)) {
      setMessage({ type: "error", text: "PIN must be 4-6 digits" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = editingId 
        ? `/api/admin/cafe-users/${editingId}` 
        : "/api/admin/cafe-users";
      
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), pin: formPin }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to save user");

      setMessage({ 
        type: "success", 
        text: editingId ? "User updated successfully" : "User created successfully" 
      });
      resetForm();
      await loadUsers();
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err instanceof Error ? err.message : "Failed to save user" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: CafeUser) => {
    setEditingId(user.id);
    setFormName(user.name);
    setFormPin(user.pin);
    setMessage(null);
  };

  const handleToggleActive = async (user: CafeUser) => {
    try {
      const response = await fetch(`/api/admin/cafe-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      setMessage({ 
        type: "success", 
        text: `User ${!user.isActive ? "activated" : "deactivated"}` 
      });
      await loadUsers();
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err instanceof Error ? err.message : "Failed to update user" 
      });
    }
  };

  const handleDelete = async (user: CafeUser) => {
    if (!confirm(`Delete cafe user "${user.name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/cafe-users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setMessage({ type: "success", text: "User deleted successfully" });
      await loadUsers();
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err instanceof Error ? err.message : "Failed to delete user" 
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormPin("");
    setMessage(null);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Cafe Staff Management
              </p>
              <h1 className="mt-1 text-2xl font-bold">Sri Murugan Cinema</h1>
            </div>
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold transition-colors hover:border-blue-500"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm font-semibold ${
              message.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-green-500/30 bg-green-500/10 text-green-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-400" />
              <p className="mt-4 text-gray-400">Loading staff...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
            {/* Form */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-blue-400">
                {editingId ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter staff name"
                    maxLength={120}
                    required
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    PIN (4-6 digits)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 4-6 digit PIN"
                    pattern="\d{4,6}"
                    required
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for cafe POS login
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-blue-500 px-5 py-3 text-sm font-bold uppercase transition-colors hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Add Staff"}
                  </button>
                  
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-gray-700 px-5 text-sm font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Info Box */}
              <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <h3 className="text-sm font-bold text-blue-400">Quick Guide</h3>
                <ul className="mt-2 space-y-1 text-xs text-gray-400">
                  <li>• Staff login at /cafe/login</li>
                  <li>• PIN must be unique</li>
                  <li>• Disable to revoke access</li>
                  <li>• Delete removes permanently</li>
                </ul>
              </div>
            </div>

            {/* Users List */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Staff Members ({users.length})
                </h2>
                <div className="text-sm text-gray-400">
                  {users.filter(u => u.isActive).length} active
                </div>
              </div>

              {users.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-700 py-16 text-center">
                  <div className="text-5xl">👥</div>
                  <p className="mt-4 text-gray-500">No staff members yet</p>
                  <p className="mt-1 text-sm text-gray-600">Add your first cafe staff member</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="group rounded-xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold">{user.name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                user.isActive
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                            <span className="font-mono">PIN: {user.pin}</span>
                            <span>•</span>
                            <span>
                              Added {new Date(user.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>

                          {user.lastLoginAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              Last login: {new Date(user.lastLoginAt).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="rounded border border-blue-500 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-500/20"
                          >
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`rounded border px-4 py-2 text-xs font-bold transition-colors ${
                              user.isActive
                                ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                : "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            }`}
                          >
                            {user.isActive ? "Disable" : "Enable"}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(user)}
                            className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
