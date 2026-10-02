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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formName, setFormName] = useState("");
  const [formPin, setFormPin] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/cafe-users", { cache: "no-store" });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to load users");
      
      setUsers(data.users);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
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
      setError("Name and PIN are required");
      return;
    }

    if (!/^\d{4,6}$/.test(formPin)) {
      setError("PIN must be 4-6 digits");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

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

      setSuccess(editingId ? "User updated successfully" : "User created successfully");
      resetForm();
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: CafeUser) => {
    setEditingId(user.id);
    setFormName(user.name);
    setFormPin(user.pin);
    setError("");
    setSuccess("");
  };

  const handleToggleActive = async (user: CafeUser) => {
    try {
      const response = await fetch(`/api/admin/cafe-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      setSuccess(`User ${!user.isActive ? "activated" : "deactivated"}`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDelete = async (user: CafeUser) => {
    if (!confirm(`Delete cafe user "${user.name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/cafe-users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setSuccess("User deleted successfully");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormPin("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold">
              Sri Murugan Cinema
            </p>
            <h1 className="mt-1 text-3xl font-bold">Cafe Staff Management</h1>
            <p className="mt-2 text-sm text-muted">
              Manage cafe POS users and their access PINs
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold"
          >
            ← Admin Panel
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Add/Edit Form */}
          <div className="rounded-2xl border border-white/15 bg-card p-6">
            <h2 className="text-xl font-bold text-gold">
              {editingId ? "Edit User" : "Add New User"}
            </h2>
            
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="block text-sm font-medium text-white/75">Name</span>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter staff name"
                  maxLength={120}
                  required
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#171410] px-3 py-2.5 text-sm text-white outline-none focus:border-gold"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-white/75">
                  PIN (4-6 digits)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 4-6 digit PIN"
                  pattern="\d{4,6}"
                  required
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#171410] px-3 py-2.5 text-sm text-white outline-none focus:border-gold"
                />
                <span className="mt-1 block text-xs text-muted">
                  This PIN will be used to login to the cafe POS system
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-background transition-all hover:bg-gold/90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update User" : "Add User"}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold transition-all hover:bg-white/5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="rounded-2xl border border-white/15 bg-card p-6">
            <h2 className="text-xl font-bold text-gold">
              Cafe Staff ({users.length})
            </h2>

            {loading ? (
              <p className="mt-5 text-muted">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="mt-5 rounded-lg border border-dashed border-white/20 p-8 text-center text-sm text-muted">
                No cafe users yet. Add one to get started.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-lg border border-white/10 bg-background/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">{user.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              user.isActive
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        
                        <p className="mt-1 font-mono text-sm text-muted">
                          PIN: {user.pin}
                        </p>
                        
                        <div className="mt-2 text-xs text-muted">
                          <p>
                            Created:{" "}
                            {new Date(user.createdAt).toLocaleDateString("en-IN")}
                          </p>
                          {user.lastLoginAt && (
                            <p>
                              Last login:{" "}
                              {new Date(user.lastLoginAt).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="rounded border border-gold px-3 py-1.5 text-xs font-bold text-gold transition-all hover:bg-gold/10"
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`rounded border px-3 py-1.5 text-xs font-bold transition-all ${
                            user.isActive
                              ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                              : "border-green-500/40 text-green-400 hover:bg-green-500/10"
                          }`}
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(user)}
                          className="rounded border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/10"
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

        <div className="mt-8 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <h3 className="font-bold text-blue-400">Quick Guide</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-300">
            <li>• Create cafe staff accounts with unique PINs</li>
            <li>• Staff can login at <strong>/cafe/login</strong> using their PIN</li>
            <li>• POS interface at <strong>/cafe/pos</strong> for order management</li>
            <li>• Disable users to temporarily revoke access without deleting</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
