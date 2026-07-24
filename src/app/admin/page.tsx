"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

function isValidImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"now" | "upcoming">("now");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const [movieForm, setMovieForm] = useState<Movie>({
    title: "",
    language: "",
    certification: "",
    dimension: "2D",
    posterUrl: "",
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

  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!status) return;
    const timeout = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(timeout);
  }, [status]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "now") {
        const res = await fetch("/api/admin/movies");
        const data = await res.json();
        setMovies(data.movies || []);
      } else {
        const res = await fetch("/api/admin/upcoming");
        const data = await res.json();
        setUpcoming(data.upcoming || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  async function saveMovie(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const method = editingMovieId ? "PUT" : "POST";
    const url = editingMovieId ? `/api/admin/movies/${editingMovieId}` : "/api/admin/movies";

    const payload = {
      ...movieForm,
      showtimes: movieForm.showtimes
        .filter((s) => s.time.trim())
        .map(({ time, format }) => ({ time, format })),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Failed to save movie" });
      } else {
        setStatus({
          type: "success",
          message: editingMovieId ? "Movie updated successfully." : "Movie added successfully.",
        });
        resetMovieForm();
        fetchData();
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function saveUpcoming(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const method = editingUpcomingId ? "PUT" : "POST";
    const url = editingUpcomingId ? `/api/admin/upcoming/${editingUpcomingId}` : "/api/admin/upcoming";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upcomingForm),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Failed to save upcoming movie" });
      } else {
        setStatus({
          type: "success",
          message: editingUpcomingId ? "Upcoming movie updated." : "Upcoming movie added.",
        });
        resetUpcomingForm();
        fetchData();
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMovie(id: number) {
    if (!confirm("Delete this movie?")) return;
    setDeletingId(id);
    setStatus(null);

    try {
      const res = await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: "error", message: data.error || "Failed to delete movie" });
      } else {
        setStatus({ type: "success", message: "Movie deleted." });
        fetchData();
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteUpcoming(id: number) {
    if (!confirm("Delete this upcoming movie?")) return;
    setDeletingId(id);
    setStatus(null);

    try {
      const res = await fetch(`/api/admin/upcoming/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: "error", message: data.error || "Failed to delete upcoming movie" });
      } else {
        setStatus({ type: "success", message: "Upcoming movie deleted." });
        fetchData();
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setDeletingId(null);
    }
  }

  function editMovie(movie: Movie) {
    setEditingMovieId(movie.id || null);
    setMovieForm({
      title: movie.title,
      language: movie.language || "",
      certification: movie.certification || "",
      dimension: movie.dimension || "2D",
      posterUrl: movie.posterUrl || "",
      isNowShowing: movie.isNowShowing,
      showtimes: movie.showtimes.length
        ? movie.showtimes.map(({ time, format }) => ({ time, format }))
        : [{ time: "", format: "4K DOLBY ATMOS" }],
    });
  }

  function editUpcoming(movie: UpcomingMovie) {
    setEditingUpcomingId(movie.id || null);
    setUpcomingForm({
      title: movie.title,
      language: movie.language || "",
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : "",
      posterUrl: movie.posterUrl || "",
    });
  }

  function resetMovieForm() {
    setEditingMovieId(null);
    setMovieForm({
      title: "",
      language: "",
      certification: "",
      dimension: "2D",
      posterUrl: "",
      isNowShowing: true,
      showtimes: [{ time: "", format: "4K DOLBY ATMOS" }],
    });
  }

  function resetUpcomingForm() {
    setEditingUpcomingId(null);
    setUpcomingForm({ title: "", language: "", releaseDate: "", posterUrl: "" });
  }

  function updateShowtime(index: number, field: keyof Showtime, value: string) {
    const next = [...movieForm.showtimes];
    next[index] = { ...next[index], [field]: value };
    setMovieForm({ ...movieForm, showtimes: next });
  }

  function addShowtime() {
    setMovieForm({
      ...movieForm,
      showtimes: [...movieForm.showtimes, { time: "", format: "4K DOLBY ATMOS" }],
    });
  }

  function removeShowtime(index: number) {
    const next = movieForm.showtimes.filter((_, i) => i !== index);
    setMovieForm({ ...movieForm, showtimes: next.length ? next : [{ time: "", format: "4K DOLBY ATMOS" }] });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-center text-2xl font-bold text-gold sm:text-3xl">Admin Panel</h1>
          <button
            type="button"
            onClick={() => {
              document.cookie = "admin-session=; path=/; max-age=0";
              router.push("/admin/login");
              router.refresh();
            }}
            className="rounded border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 transition-all hover:border-red-500/50 hover:text-red-400"
          >
            Logout
          </button>
        </div>

        <div className="mb-8 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("now")}
            className={`rounded px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "now" ? "bg-gold text-background" : "border border-gold text-gold hover:bg-gold/10"
            }`}
          >
            Now Showing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`rounded px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "upcoming" ? "bg-gold text-background" : "border border-gold text-gold hover:bg-gold/10"
            }`}
          >
            Upcoming
          </button>
        </div>

        {status && (
          <div
            className={`mb-6 rounded border px-4 py-3 text-sm font-medium ${
              status.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {status.message}
          </div>
        )}

        {activeTab === "now" ? (
          <section className="space-y-8">
            <form onSubmit={saveMovie} className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold text-gold">
                {editingMovieId ? "Edit Movie" : "Add Now Showing Movie"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Title</span>
                  <input
                    type="text"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="Movie title"
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Language</span>
                  <input
                    type="text"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="e.g. Tamil"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Certification</span>
                  <input
                    type="text"
                    value={movieForm.certification}
                    onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="UA, A, U, etc."
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Dimension</span>
                  <input
                    type="text"
                    value={movieForm.dimension}
                    onChange={(e) => setMovieForm({ ...movieForm, dimension: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="2D, 3D"
                  />
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium text-white/70">Poster Image URL</span>
                  <input
                    type="url"
                    value={movieForm.posterUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value.trim() })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="https://..."
                  />
                </label>
              </div>

              {movieForm.posterUrl && isValidImageUrl(movieForm.posterUrl) && (
                <div className="relative mt-4 aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={movieForm.posterUrl}
                    alt="Poster preview"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              )}
              {movieForm.posterUrl && !isValidImageUrl(movieForm.posterUrl) && (
                <p className="mt-3 text-xs text-red-400">Please enter a valid https:// image URL.</p>
              )}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-white/80">Showtimes</label>
                {movieForm.showtimes.map((show, index) => (
                  <div key={index} className="mb-2 flex items-center gap-2">
                    <div className="relative w-40">
                      <input
                        type="time"
                        value={show.time}
                        onChange={(e) => updateShowtime(index, "time", e.target.value)}
                        className="admin-time-input w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                      />
                      {show.time && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold">
                          {to12HourFormat(show.time)}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/60">
                      4K DOLBY ATMOS
                    </span>
                    <button
                      type="button"
                      onClick={() => removeShowtime(index)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-red-600/90 text-white hover:bg-red-600"
                      aria-label="Remove showtime"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addShowtime}
                  className="mt-2 inline-flex items-center gap-1 rounded border border-gold px-3 py-1.5 text-xs font-semibold text-gold transition-all hover:scale-105 hover:bg-gold/10 hover:shadow-[0_0_12px_rgba(212,168,75,0.25)]"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Add Showtime
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <input
                  id="nowShowing"
                  type="checkbox"
                  checked={movieForm.isNowShowing}
                  onChange={(e) => setMovieForm({ ...movieForm, isNowShowing: e.target.checked })}
                  className="h-4 w-4 accent-gold"
                  disabled={isSaving}
                />
                <label htmlFor="nowShowing" className="text-sm text-white/80">Now Showing</label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded bg-gold px-5 py-2.5 text-sm font-semibold text-background transition-all hover:scale-105 hover:bg-gold/90 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                      Saving...
                    </>
                  ) : editingMovieId ? (
                    "Update Movie"
                  ) : (
                    "Add Movie"
                  )}
                </button>
                {editingMovieId && (
                  <button
                    type="button"
                    onClick={resetMovieForm}
                    disabled={isSaving}
                    className="rounded border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-white/5 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {loading ? (
              <p className="text-center text-white/60">Loading movies...</p>
            ) : movies.length === 0 ? (
              <p className="text-center text-white/50">No movies added yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    {movie.posterUrl ? (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={movie.posterUrl}
                          alt={movie.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 300px"
                        />
                        <span className={`absolute right-2 top-2 rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase ${movie.isNowShowing ? "bg-green-600/90 text-white" : "bg-white/20 text-white"}`}>
                          {movie.isNowShowing ? "Now Showing" : "Hidden"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                        <span className="text-xs text-white/40">No poster</span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold text-gold">{movie.title}</h3>
                      <p className="text-sm text-white/70">
                        {movie.language}
                        {movie.certification && ` · ${movie.certification}`}
                        {movie.dimension && ` · ${movie.dimension}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {movie.showtimes.map((show) => (
                          <span key={show.id} className="rounded bg-black/40 px-2 py-1 text-xs text-white/80">
                            {to12HourFormat(show.time)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto flex gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => editMovie(movie)}
                          disabled={deletingId === movie.id}
                          className="rounded bg-gold px-3 py-1.5 text-xs font-semibold text-background transition-all hover:scale-105 hover:bg-gold/90 disabled:opacity-60 disabled:hover:scale-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => movie.id && deleteMovie(movie.id)}
                          disabled={deletingId === movie.id}
                          className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105 hover:bg-red-700 disabled:opacity-60 disabled:hover:scale-100"
                        >
                          {deletingId === movie.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-8">
            <form onSubmit={saveUpcoming} className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold text-gold">
                {editingUpcomingId ? "Edit Upcoming Movie" : "Add Upcoming Movie"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Title</span>
                  <input
                    type="text"
                    value={upcomingForm.title}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, title: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="Movie title"
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Language</span>
                  <input
                    type="text"
                    value={upcomingForm.language}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, language: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="e.g. Tamil"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Release Date</span>
                  <input
                    type="date"
                    value={upcomingForm.releaseDate}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, releaseDate: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">Poster Image URL</span>
                  <input
                    type="url"
                    value={upcomingForm.posterUrl}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, posterUrl: e.target.value.trim() })}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
                    placeholder="https://..."
                  />
                </label>
              </div>

              {upcomingForm.posterUrl && isValidImageUrl(upcomingForm.posterUrl) && (
                <div className="relative mt-4 aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={upcomingForm.posterUrl}
                    alt="Poster preview"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              )}
              {upcomingForm.posterUrl && !isValidImageUrl(upcomingForm.posterUrl) && (
                <p className="mt-3 text-xs text-red-400">Please enter a valid https:// image URL.</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded bg-gold px-5 py-2.5 text-sm font-semibold text-background transition-all hover:scale-105 hover:bg-gold/90 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                      Saving...
                    </>
                  ) : editingUpcomingId ? (
                    "Update Movie"
                  ) : (
                    "Add Movie"
                  )}
                </button>
                {editingUpcomingId && (
                  <button
                    type="button"
                    onClick={resetUpcomingForm}
                    disabled={isSaving}
                    className="rounded border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-white/5 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {loading ? (
              <p className="text-center text-white/60">Loading upcoming movies...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-center text-white/50">No upcoming movies added yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    {movie.posterUrl ? (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={movie.posterUrl}
                          alt={movie.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 300px"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                        <span className="text-xs text-white/40">No poster</span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold text-gold">{movie.title}</h3>
                      <p className="text-sm text-white/70">
                        {movie.language}
                        {movie.releaseDate && ` · ${new Date(movie.releaseDate).toLocaleDateString()}`}
                      </p>
                      <div className="mt-auto flex gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => editUpcoming(movie)}
                          disabled={deletingId === movie.id}
                          className="rounded bg-gold px-3 py-1.5 text-xs font-semibold text-background transition-all hover:scale-105 hover:bg-gold/90 disabled:opacity-60 disabled:hover:scale-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => movie.id && deleteUpcoming(movie.id)}
                          disabled={deletingId === movie.id}
                          className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105 hover:bg-red-700 disabled:opacity-60 disabled:hover:scale-100"
                        >
                          {deletingId === movie.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
