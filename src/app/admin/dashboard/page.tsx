"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  nowShowing: number;
  upcoming: number;
  pendingOrders: number;
  preparingOrders: number;
  cafeStaff: number;
  foodItems: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    nowShowing: 0,
    upcoming: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    cafeStaff: 0,
    foodItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [moviesRes, upcomingRes, ordersRes, staffRes, menuRes] = await Promise.all([
          fetch("/api/admin/movies"),
          fetch("/api/admin/upcoming"),
          fetch("/api/admin/food-orders?status=all&limit=100"),
          fetch("/api/admin/cafe-users"),
          fetch("/api/admin/food-menu/categories"),
        ]);

        const [moviesData, upcomingData, ordersData, staffData, menuData] = await Promise.all([
          moviesRes.json(),
          upcomingRes.json(),
          ordersRes.json(),
          staffRes.json(),
          menuRes.json(),
        ]);

        setStats({
          nowShowing: moviesData.movies?.filter((m: { isNowShowing: boolean }) => m.isNowShowing).length || 0,
          upcoming: upcomingData.upcoming?.length || 0,
          pendingOrders: ordersData.counts?.pending || 0,
          preparingOrders: ordersData.counts?.preparing || 0,
          cafeStaff: staffData.users?.filter((u: { isActive: boolean }) => u.isActive).length || 0,
          foodItems: menuData.products?.filter((p: { isAvailable: boolean }) => p.isAvailable).length || 0,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    document.cookie = "admin-session=; path=/; max-age=0";
    router.push("/admin/login");
    router.refresh();
  };

  const modules = [
    {
      title: "Movies",
      icon: "🎬",
      description: "Manage now showing & upcoming",
      stats: `${stats.nowShowing} showing, ${stats.upcoming} upcoming`,
      href: "/admin/movies",
      color: "from-purple-500 to-indigo-600",
      badge: stats.nowShowing,
    },
    {
      title: "Food Orders",
      icon: "🍿",
      description: "Monitor cafe orders in real-time",
      stats: `${stats.pendingOrders} new, ${stats.preparingOrders} preparing`,
      href: "/admin/orders",
      color: "from-amber-500 to-orange-600",
      badge: stats.pendingOrders,
      urgent: stats.pendingOrders > 0,
    },
    {
      title: "Cafe Menu",
      icon: "📋",
      description: "Manage products & categories",
      stats: `${stats.foodItems} items available`,
      href: "/admin/cafe",
      color: "from-green-500 to-emerald-600",
      badge: stats.foodItems,
    },
    {
      title: "Cafe Staff",
      icon: "👥",
      description: "Manage POS user accounts",
      stats: `${stats.cafeStaff} active staff members`,
      href: "/admin/cafe-users",
      color: "from-blue-500 to-cyan-600",
      badge: stats.cafeStaff,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Admin Control Panel
              </p>
              <h1 className="mt-1 text-3xl font-bold">Sri Murugan Cinema</h1>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-6 py-3 text-sm font-bold uppercase transition-colors hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-amber-400" />
              <p className="mt-4 text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">New Orders</p>
                    <p className="mt-2 text-4xl font-bold text-amber-400">{stats.pendingOrders}</p>
                  </div>
                  <div className="text-5xl">🔔</div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Preparing</p>
                    <p className="mt-2 text-4xl font-bold text-blue-400">{stats.preparingOrders}</p>
                  </div>
                  <div className="text-5xl">👨‍🍳</div>
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Now Showing</p>
                    <p className="mt-2 text-4xl font-bold text-purple-400">{stats.nowShowing}</p>
                  </div>
                  <div className="text-5xl">🎬</div>
                </div>
              </div>

              <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Staff</p>
                    <p className="mt-2 text-4xl font-bold text-green-400">{stats.cafeStaff}</p>
                  </div>
                  <div className="text-5xl">👥</div>
                </div>
              </div>
            </div>

            {/* Main Modules */}
            <div className="mb-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-200">Management Modules</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {modules.map((module) => (
                  <Link
                    key={module.title}
                    href={module.href}
                    className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-6 transition-all hover:scale-105 hover:border-gray-700 hover:shadow-2xl"
                  >
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 transition-opacity group-hover:opacity-10`}
                    />

                    {/* Content */}
                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-6xl">{module.icon}</div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{module.title}</h3>
                            <p className="mt-1 text-sm text-gray-400">{module.description}</p>
                          </div>
                        </div>
                        {module.urgent && (
                          <span className="animate-pulse rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                            URGENT
                          </span>
                        )}
                        {!module.urgent && module.badge > 0 && (
                          <span className="rounded-full bg-gray-700 px-3 py-1 text-sm font-bold text-white">
                            {module.badge}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-300">{module.stats}</p>
                        <span className="text-2xl transition-transform group-hover:translate-x-2">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-200">Quick Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/admin/movies"
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-sm font-semibold transition-colors hover:border-purple-500 hover:bg-gray-750"
                >
                  + Add Movie
                </Link>
                <Link
                  href="/admin/cafe"
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-sm font-semibold transition-colors hover:border-green-500 hover:bg-gray-750"
                >
                  + Add Food Item
                </Link>
                <Link
                  href="/admin/cafe-users"
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-sm font-semibold transition-colors hover:border-blue-500 hover:bg-gray-750"
                >
                  + Add Staff User
                </Link>
                <Link
                  href="/admin/orders"
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-sm font-semibold transition-colors hover:border-amber-500 hover:bg-gray-750"
                >
                  View All Orders
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 bg-gray-900/30 py-6">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          <p>Sri Murugan Cinema - Admin Control Panel v2.0</p>
          <p className="mt-1">Vista POS Style Management System</p>
        </div>
      </footer>
    </main>
  );
}
