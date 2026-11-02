"use client";

import { ChangeEvent, DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
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

  // Upload states
  const [uploadingTarget, setUploadingTarget] = useState<"now" | "upcoming" | null>(null);
  const [dragActiveNow, setDragActiveNow] = useState(false);
  const [dragActiveUpcoming, setDragActiveUpcoming] = useState(false);

  const fileInputNowRef = useRef<HTMLInputElement>(null);
  const fileInputUpcomingRef = useRef<HTMLInputElement>(null);

  const [movieForm, setMovieForm] = useState<Movie>({
    title: "",
    language: "",
    certification: "",
    dimension: "2D",
    posterUrl: "",
    mobileBgUrl: "",
    desktopBgUrl: "",
    isNowShowing: true,
    showtimes: [{ time: "10:30", format: "4K DOLBY ATMOS" }],
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
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load movie data" });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const initial = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(initial);
  }, [fetchData]);

  // Upload poster file handler
  async function handleFileUpload(file: File, target: "now" | "upcoming") {
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file (PNG, JPG, WebP, AVIF)." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size exceeds 10 MB limit. Please select a smaller image." });
      return;
    }

    setUploadingTarget(target);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload poster image.");
      }

      if (target === "now") {
        setMovieForm((prev) => ({ ...prev, posterUrl: data.url }));
      } else {
        setUpcomingForm((prev) => ({ ...prev, posterUrl: data.url }));
      }

      setMessage({ type: "success", text: "Poster uploaded successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to upload poster.",
      });
    } finally {
      setUploadingTarget(null);
    }
  }

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>, target: "now" | "upcoming") => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileUpload(file, target);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>, target: "now" | "upcoming") => {
    e.preventDefault();
    e.stopPropagation();
    if (target === "now") setDragActiveNow(true);
    else setDragActiveUpcoming(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>, target: "now" | "upcoming") => {
    e.preventDefault();
    e.stopPropagation();
    if (target === "now") setDragActiveNow(false);
    else setDragActiveUpcoming(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, target: "now" | "upcoming") => {
    e.preventDefault();
    e.stopPropagation();
    if (target === "now") setDragActiveNow(false);
    else setDragActiveUpcoming(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file, target);
    }
  };

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

      setMessage({ type: "success", text: editingMovieId ? "Movie schedule updated successfully." : "Movie added to Now Showing." });
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
      if (!response.ok) throw new Error(data.error || "Failed to save upcoming movie");

      setMessage({ type: "success", text: editingUpcomingId ? "Upcoming release updated successfully." : "Upcoming title announced." });
      resetUpcomingForm();
      await fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save upcoming movie" });
    } finally {
      setSaving(false);
    }
  };

  const deleteMovie = async (id: number) => {
    if (!confirm("Remove this movie and its showtimes from Now Showing?")) return;
    try {
      const response = await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete movie");
      setMessage({ type: "success", text: "Movie removed from schedule." });
      await fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to delete movie" });
    }
  };

  const deleteUpcoming = async (id: number) => {
    if (!confirm("Delete this upcoming title announcement?")) return;
    try {
      const response = await fetch(`/api/admin/upcoming/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete upcoming movie");
      setMessage({ type: "success", text: "Upcoming title deleted." });
      await fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to delete upcoming movie" });
    }
  };

  const editMovie = (movie: Movie) => {
    setEditingMovieId(movie.id || null);
    setMovieForm({
      ...movie,
      showtimes: movie.showtimes.length ? movie.showtimes : [{ time: "", format: "4K DOLBY ATMOS" }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editUpcoming = (movie: UpcomingMovie) => {
    setEditingUpcomingId(movie.id || null);
    setUpcomingForm({
      ...movie,
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      showtimes: [{ time: "10:30", format: "4K DOLBY ATMOS" }],
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
    <main className="min-h-screen bg-[#090c12] text-slate-100">
      <AdminNav title="Movies" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Cinema Movies & Showtimes
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Control the current theatrical schedule, screening formats, Dolby Atmos badges, and upcoming releases.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("now")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "now"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 3v18" />
                <path d="M3 7.5h4" />
                <path d="M3 12h18" />
                <path d="M3 16.5h4" />
                <path d="M17 3v18" />
                <path d="M17 7.5h4" />
                <path d="M17 16.5h4" />
              </svg>
              <span>Now Showing ({movies.filter((m) => m.isNowShowing).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "upcoming"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
              <span>Upcoming Releases ({upcoming.length})</span>
            </button>
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
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Loading theatrical listings...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[440px_1fr]">
            {/* Form Editor Card */}
            <div className="h-fit rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-[#0c101a] p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {activeTab === "now"
                      ? editingMovieId
                        ? "Edit Screening"
                        : "Add Now Showing Movie"
                      : editingUpcomingId
                      ? "Edit Upcoming Title"
                      : "Add Upcoming Release"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeTab === "now"
                      ? "Configure show timings, poster artwork & screening format"
                      : "Set title, language, release date & poster artwork"}
                  </p>
                </div>
              </div>

              {activeTab === "now" ? (
                <form onSubmit={saveMovie} className="space-y-4">
                  {/* Movie Title */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Movie Title <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leo, Jailer, Dunki"
                      value={movieForm.title}
                      onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                      required
                      className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                    />
                  </div>

                  {/* Language & Certification */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Language
                      </label>
                      <input
                        type="text"
                        placeholder="Tamil, Telugu, Hindi"
                        value={movieForm.language || ""}
                        onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Certification
                      </label>
                      <input
                        type="text"
                        placeholder="U, U/A, A"
                        value={movieForm.certification || ""}
                        onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Poster Image Uploader */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                      Movie Poster Artwork
                    </label>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Upload an image file from your device or specify an image URL
                    </p>

                    {/* Hidden input for file selection */}
                    <input
                      ref={fileInputNowRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => onFileInputChange(e, "now")}
                    />

                    {/* Dropzone area */}
                    <div
                      onDragOver={(e) => onDragOver(e, "now")}
                      onDragLeave={(e) => onDragLeave(e, "now")}
                      onDrop={(e) => onDrop(e, "now")}
                      className={`mt-2.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
                        dragActiveNow
                          ? "border-amber-400 bg-amber-500/10"
                          : "border-slate-700/80 bg-slate-900/50 hover:border-amber-500/40 hover:bg-slate-900/80"
                      }`}
                    >
                      {uploadingTarget === "now" ? (
                        <div className="flex flex-col items-center py-2">
                          <svg className="h-6 w-6 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          </svg>
                          <span className="mt-2 text-xs font-semibold text-amber-300">Uploading poster image...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputNowRef.current?.click()}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                              </svg>
                              <span>Browse File to Upload</span>
                            </button>
                            <span className="block mt-1 text-[10px] text-slate-400">
                              or drag and drop here (JPG, PNG, WebP up to 10MB)
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Preview or URL Input */}
                    {movieForm.posterUrl ? (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-black">
                            <Image
                              src={movieForm.posterUrl}
                              alt="Poster Preview"
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">Current Poster</p>
                            <p className="text-[10px] text-slate-400 truncate">{movieForm.posterUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputNowRef.current?.click()}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setMovieForm((prev) => ({ ...prev, posterUrl: "" }))}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1 text-rose-300 hover:bg-rose-500/20"
                            title="Remove poster"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5">
                        <label className="block text-[11px] font-semibold text-slate-400">
                          Or paste external image URL / path:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. /hero-cinema.png or https://..."
                          value={movieForm.posterUrl || ""}
                          onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Dimension */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Screen Dimension
                    </label>
                    <select
                      value={movieForm.dimension || "2D"}
                      onChange={(e) => setMovieForm({ ...movieForm, dimension: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500"
                    >
                      <option value="2D">2D</option>
                      <option value="3D">3D</option>
                      <option value="4DX">4DX</option>
                      <option value="IMAX 2D">IMAX 2D</option>
                    </select>
                  </div>

                  {/* Showtimes Builder */}
                  <div className="border-t border-slate-800/80 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Show Timings ({movieForm.showtimes.length})
                      </label>
                      <button
                        type="button"
                        onClick={addShowtime}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add Show</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {movieForm.showtimes.map((show, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={show.time}
                            onChange={(e) => updateShowtime(idx, "time", e.target.value)}
                            className="rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white outline-none transition focus:border-amber-500"
                          />
                          <input
                            type="text"
                            placeholder="Format (e.g. 4K DOLBY ATMOS)"
                            value={show.format}
                            onChange={(e) => updateShowtime(idx, "format", e.target.value)}
                            className="flex-1 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeShowtime(idx)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-300"
                            aria-label="Remove showtime"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <input
                      type="checkbox"
                      id="movie-now-showing"
                      checked={movieForm.isNowShowing}
                      onChange={(e) => setMovieForm({ ...movieForm, isNowShowing: e.target.checked })}
                      className="h-4 w-4 rounded accent-amber-500"
                    />
                    <label htmlFor="movie-now-showing" className="cursor-pointer text-xs font-medium text-slate-200">
                      Actively screening on Sri Murugan screens
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={saving || uploadingTarget !== null}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingMovieId ? "Update Movie" : "Publish Movie"}
                    </button>
                    {editingMovieId && (
                      <button
                        type="button"
                        onClick={resetMovieForm}
                        className="rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                /* Upcoming Form */
                <form onSubmit={saveUpcoming} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Movie Title <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Title of upcoming release"
                      value={upcomingForm.title}
                      onChange={(e) => setUpcomingForm({ ...upcomingForm, title: e.target.value })}
                      required
                      className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Language
                      </label>
                      <input
                        type="text"
                        placeholder="Tamil, Telugu..."
                        value={upcomingForm.language || ""}
                        onChange={(e) => setUpcomingForm({ ...upcomingForm, language: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Release Date
                      </label>
                      <input
                        type="date"
                        value={upcomingForm.releaseDate || ""}
                        onChange={(e) => setUpcomingForm({ ...upcomingForm, releaseDate: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Poster Image Uploader for Upcoming */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                      Upcoming Poster Artwork
                    </label>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Upload a teaser or release poster from your computer
                    </p>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputUpcomingRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => onFileInputChange(e, "upcoming")}
                    />

                    {/* Dropzone area */}
                    <div
                      onDragOver={(e) => onDragOver(e, "upcoming")}
                      onDragLeave={(e) => onDragLeave(e, "upcoming")}
                      onDrop={(e) => onDrop(e, "upcoming")}
                      className={`mt-2.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
                        dragActiveUpcoming
                          ? "border-amber-400 bg-amber-500/10"
                          : "border-slate-700/80 bg-slate-900/50 hover:border-amber-500/40 hover:bg-slate-900/80"
                      }`}
                    >
                      {uploadingTarget === "upcoming" ? (
                        <div className="flex flex-col items-center py-2">
                          <svg className="h-6 w-6 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          </svg>
                          <span className="mt-2 text-xs font-semibold text-amber-300">Uploading teaser poster...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputUpcomingRef.current?.click()}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                              </svg>
                              <span>Browse File to Upload</span>
                            </button>
                            <span className="block mt-1 text-[10px] text-slate-400">
                              or drag and drop here (JPG, PNG, WebP up to 10MB)
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Preview or URL Input */}
                    {upcomingForm.posterUrl ? (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-black">
                            <Image
                              src={upcomingForm.posterUrl}
                              alt="Poster Preview"
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">Current Poster</p>
                            <p className="text-[10px] text-slate-400 truncate">{upcomingForm.posterUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputUpcomingRef.current?.click()}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpcomingForm((prev) => ({ ...prev, posterUrl: "" }))}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1 text-rose-300 hover:bg-rose-500/20"
                            title="Remove poster"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5">
                        <label className="block text-[11px] font-semibold text-slate-400">
                          Or paste external image URL / path:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. /poster.jpg or https://..."
                          value={upcomingForm.posterUrl || ""}
                          onChange={(e) => setUpcomingForm({ ...upcomingForm, posterUrl: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={saving || uploadingTarget !== null}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingUpcomingId ? "Update Upcoming" : "Add Announcement"}
                    </button>
                    {editingUpcomingId && (
                      <button
                        type="button"
                        onClick={resetUpcomingForm}
                        className="rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Movie Listings List */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  {activeTab === "now" ? "Now Showing Titles" : "Upcoming Releases"} (
                  {activeTab === "now" ? movies.length : upcoming.length})
                </h2>
              </div>

              {activeTab === "now" ? (
                movies.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-amber-400">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M7 3v18" />
                        <path d="M17 3v18" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-white">No active screenings listed</h3>
                    <p className="mt-1 text-xs text-slate-400">Add a movie using the form on the left to show it on the site</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movies.map((movie) => (
                      <div
                        key={movie.id}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#0c101a] p-5 shadow-md transition hover:border-slate-700"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-4">
                            {movie.posterUrl && (
                              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                                <Image
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-white">{movie.title}</h3>
                                {movie.certification && (
                                  <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                    {movie.certification}
                                  </span>
                                )}
                                {movie.dimension && (
                                  <span className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                                    {movie.dimension}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {movie.language || "Regional"}
                              </p>

                              {/* Showtimes Pills */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {movie.showtimes?.map((show, idx) => (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs"
                                  >
                                    <svg className="h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span className="font-bold text-amber-200">{to12HourFormat(show.time)}</span>
                                    <span className="text-[10px] text-amber-400/80">• {show.format}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => editMovie(movie)}
                              className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-700 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => movie.id && void deleteMovie(movie.id)}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
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
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-amber-400">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">No upcoming movies announced</h3>
                  <p className="mt-1 text-xs text-slate-400">Add upcoming releases to display in the coming soon section</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((movie) => (
                    <div
                      key={movie.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#0c101a] p-5 shadow-md transition hover:border-slate-700"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          {movie.posterUrl && (
                            <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                              <Image
                                src={movie.posterUrl}
                                alt={movie.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}

                          <div>
                            <h3 className="text-base font-bold text-white">{movie.title}</h3>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {movie.language || "Regional"}
                              {movie.releaseDate && ` • Releasing ${new Date(movie.releaseDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => editUpcoming(movie)}
                            className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-700 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => movie.id && void deleteUpcoming(movie.id)}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
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
