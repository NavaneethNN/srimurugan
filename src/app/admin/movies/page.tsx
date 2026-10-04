"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

interface Showtime {
  id?: number;
  time: string;
  format: string;
}

interface Movie {
  id?: number;
  title: string;
  language?: string;
  certification?: string;
  dimension?: string;
  posterUrl?: string;
  mobileBgUrl?: string;
  desktopBgUrl?: string;
  isNowShowing: boolean;
  showtimes: Showtime[];
}

interface UpcomingMovie {
  id?: number;
  title: string;
  language?: string;
  releaseDate?: string;
  posterUrl?: string;
}

function to12HourFormat(time: string) {
  const [hourStr, minuteStr] = time.split(":");
  if (!hourStr || !minuteStr) return time;
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function MoviesManagement() {
  const [activeTab, setActiveTab] = useState<"now" | "upcoming">("now");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [movieForm, setMovieForm] = useState<Movie>({
    title: "",
    language: "",
    certification: "",
    dimension: "2D",
    posterUrl: "",
    mobileBgUrl: "",
    desktopBgUrl: "",
    isNowShowing: true,
    showtimes: [{ time: "", format: "4K DOLBY ATMOS" }],
  });
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);

  const [upcomingForm, setUpcomingForm] = useState<UpcomingMovie>({
    title: "",
    language: "",
    releaseDate: "",
    posterUrl: "",
  });
  const [editingUpcomingId, setEditingUpcomingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "now") {
        const res = await fetch("/api/admin/movies", { cache: "no-store" });
        const data = await res.json();
        setMovies(data.movies || []);
      } else {
        const res = await fetch("/api/admin/upcoming", { cache: "no-store" });
        const data = await res.json();
        setUpcoming(data.upcoming || []);
      }
      setMessage(null);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const initial = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(initial);
  }, [fetchData]);

  const saveMovie = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingMovieId ? `/api/admin/movies/${editingMovieId}` : "/api/admin/movies";
      const response = await fetch(url, {
        method: editingMovieId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...movieForm,
          showtimes: movieForm.showtimes.filter((s) => s.time.trim()).map(({ time, format }) => ({ time, format })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save movie");

      setMessage({ type: "success", text: editingMovieId ? "Movie updated" : "Movie added" });
      resetMovieForm();
      await fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save movie" });
    } finally {
      setSaving(false);
    }
  };

  const saveUpcoming = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingUpcomingId ? `/api/admin/upcoming/${editingUpcomingId}` : "/api/admin/upcoming";
      const response = await fetch(url, {
        method: editingUpcomingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upcomingForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save movie");

      setMessage({ type: "success", text: editingUpcomingId ? "Movie updated" : "Movie added" });
      resetUpcomingForm();
      await fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save movie" });
    } finally {
      setSaving(false);
    }
  };

  const deleteMovie = async (id: number) => {
    if (!confirm("Delete this movie?")) return;
    try {
      const response = await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setMessage({ type: "success", text: "Movie deleted" });
      await fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to delete" });
    }
  };

  const deleteUpcoming = async (id: number) => {
    if (!confirm("Delete this upcoming movie?")) return;
    try {
      const response = await fetch(`/api/admin/upcoming/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setMessage({ type: "success", text: "Movie deleted" });
      await fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to delete" });
    }
  };

  const editMovie = (movie: Movie) => {
    setEditingMovieId(movie.id || null);
    setMovieForm({
      ...movie,
      showtimes: movie.showtimes.length ? movie.showtimes : [{ time: "", format: "4K DOLBY ATMOS" }],
    });
  };

  const editUpcoming = (movie: UpcomingMovie) => {
    setEditingUpcomingId(movie.id || null);
    setUpcomingForm({
      ...movie,
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : "",
    });
  };

  const resetMovieForm = () => {
    setEditingMovieId(null);
    setMovieForm({
      title: "",
      language: "",
      certification: "",
      dimension: "2D",
      posterUrl: "",
      mobileBgUrl: "",
      desktopBgUrl: "",
      isNowShowing: true,
      showtimes: [{ time: "", format: "4K DOLBY ATMOS" }],
    });
  };

  const resetUpcomingForm = () => {
    setEditingUpcomingId(null);
    setUpcomingForm({ title: "", language: "", releaseDate: "", posterUrl: "" });
  };

  const addShowtime = () => {
    setMovieForm({
      ...movieForm,
      showtimes: [...movieForm.showtimes, { time: "", format: "4K DOLBY ATMOS" }],
    });
  };

  const removeShowtime = (index: number) => {
    const next = movieForm.showtimes.filter((_, i) => i !== index);
    setMovieForm({ ...movieForm, showtimes: next.length ? next : [{ time: "", format: "4K DOLBY ATMOS" }] });
  };

  const updateShowtime = (index: number, field: keyof Showtime, value: string) => {
    const next = [...movieForm.showtimes];
    next[index] = { ...next[index], [field]: value };
    setMovieForm({ ...movieForm, showtimes: next });
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <AdminNav title="Movies" />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("now")}
            className={`rounded-lg px-6 py-3 text-sm font-bold uppercase transition-colors ${
              activeTab === "now" ? "bg-purple-500 text-white" : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            Now Showing ({movies.filter((m) => m.isNowShowing).length})
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-lg px-6 py-3 text-sm font-bold uppercase transition-colors ${
              activeTab === "upcoming" ? "bg-purple-500 text-white" : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
        </div>

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
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-purple-400" />
              <p className="mt-4 text-gray-400">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
            {/* Form */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-purple-400">
                {activeTab === "now"
                  ? editingMovieId
                    ? "Edit Movie"
                    : "Add Movie"
                  : editingUpcomingId
                  ? "Edit Upcoming"
                  : "Add Upcoming"}
              </h2>

              {activeTab === "now" ? (
                <form onSubmit={saveMovie} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Movie Title *"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Language"
                      value={movieForm.language}
                      onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Certification"
                      value={movieForm.certification}
                      onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="Mobile Background URL"
                    value={movieForm.mobileBgUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, mobileBgUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  />
                  <input
                    type="url"
                    placeholder="Desktop Background URL"
                    value={movieForm.desktopBgUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, desktopBgUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  />

                  {/* Showtimes */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Showtimes</label>
                    {movieForm.showtimes.map((show, idx) => (
                      <div key={idx} className="mb-2 flex gap-2">
                        <input
                          type="time"
                          value={show.time}
                          onChange={(e) => updateShowtime(idx, "time", e.target.value)}
                          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeShowtime(idx)}
                          className="rounded-lg bg-red-600 px-4 text-sm font-bold hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addShowtime}
                      className="mt-2 w-full rounded-lg border border-purple-500 py-2 text-sm font-bold text-purple-400 hover:bg-purple-500/10"
                    >
                      + Add Showtime
                    </button>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={movieForm.isNowShowing}
                      onChange={(e) => setMovieForm({ ...movieForm, isNowShowing: e.target.checked })}
                      className="h-4 w-4 accent-purple-500"
                    />
                    <span className="text-sm text-gray-300">Now Showing</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-lg bg-purple-500 py-3 text-sm font-bold uppercase hover:bg-purple-600 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingMovieId ? "Update" : "Add Movie"}
                    </button>
                    {editingMovieId && (
                      <button
                        type="button"
                        onClick={resetMovieForm}
                        className="rounded-lg border border-gray-700 px-6 text-sm font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={saveUpcoming} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Movie Title *"
                    value={upcomingForm.title}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, title: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Language"
                    value={upcomingForm.language}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, language: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  />
                  <input
                    type="date"
                    value={upcomingForm.releaseDate}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, releaseDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  />
                  <input
                    type="url"
                    placeholder="Poster URL"
                    value={upcomingForm.posterUrl}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, posterUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-purple-500"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-lg bg-purple-500 py-3 text-sm font-bold uppercase hover:bg-purple-600 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingUpcomingId ? "Update" : "Add Movie"}
                    </button>
                    {editingUpcomingId && (
                      <button
                        type="button"
                        onClick={resetUpcomingForm}
                        className="rounded-lg border border-gray-700 px-6 text-sm font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* List */}
            <div>
              <h2 className="mb-4 text-xl font-bold">
                {activeTab === "now" ? "Now Showing Movies" : "Upcoming Movies"} (
                {activeTab === "now" ? movies.length : upcoming.length})
              </h2>

              {activeTab === "now" ? (
                movies.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-700 py-16 text-center text-gray-500">
                    No movies yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {movies.map((movie) => (
                      <div key={movie.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold">{movie.title}</h3>
                            <p className="mt-1 text-sm text-gray-400">
                              {movie.language} {movie.certification && `• ${movie.certification}`}{" "}
                              {movie.dimension && `• ${movie.dimension}`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {movie.showtimes.map((show, idx) => (
                                <span key={idx} className="rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                                  {to12HourFormat(show.time)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editMovie(movie)}
                              className="rounded bg-purple-500 px-4 py-2 text-xs font-bold hover:bg-purple-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => movie.id && deleteMovie(movie.id)}
                              className="rounded bg-red-600 px-4 py-2 text-xs font-bold hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : upcoming.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-700 py-16 text-center text-gray-500">
                  No upcoming movies yet
                </p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((movie) => (
                    <div key={movie.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold">{movie.title}</h3>
                          <p className="mt-1 text-sm text-gray-400">
                            {movie.language}{" "}
                            {movie.releaseDate && `• ${new Date(movie.releaseDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editUpcoming(movie)}
                            className="rounded bg-purple-500 px-4 py-2 text-xs font-bold hover:bg-purple-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => movie.id && deleteUpcoming(movie.id)}
                            className="rounded bg-red-600 px-4 py-2 text-xs font-bold hover:bg-red-700"
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
