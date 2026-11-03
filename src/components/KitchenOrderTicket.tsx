"use client";

import React, { useEffect, useState } from "react";
import { formatPrice } from "@/lib/foodMenu";

export type KotOrder = {
  id: number;
  customerName: string | null;
  seat: string;
  items: { name: string; variantName?: string; quantity: number }[];
  status: string;
  amountPaise: number | null;
  acceptedBy?: string | null;
  acceptedAt?: string | null;
  completedBy?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

export const PRINTER_PRESETS = [
  "Canon G2010 series",
  "POS Thermal 80mm (ESC/POS)",
  "POS Thermal 58mm (Receipt)",
  "Epson TM-T82 Thermal Printer",
  "TVS RP 3200 Star",
  "Browser Print / Save as PDF",
] as const;

export function formatKotDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
    return `${day}/${month}, ${time}`;
  } catch {
    return "";
  }
}

export function generateKotRawText(order: KotOrder, device: string, staffName?: string | null): string {
  const width = 33;
  const doubleLine = "=".repeat(width);
  const singleLine = "-".repeat(width);

  const center = (text: string) => {
    const trimmed = text.length > width ? text.slice(0, width) : text;
    const pad = Math.max(0, Math.floor((width - trimmed.length) / 2));
    return " ".repeat(pad) + trimmed;
  };

  const lines: string[] = [];
  lines.push(doubleLine);
  lines.push(center("SRI MURUGAN CINEMA"));
  lines.push(center("KITCHEN KOT"));
  lines.push(center(`*** ${order.seat.toUpperCase()} ***`));
  lines.push(doubleLine);

  lines.push(`Order: #${order.id}   Time: ${formatKotDateTime(order.createdAt)}`);
  lines.push(`Device: ${device}`);
  if (order.acceptedBy || staffName) {
    lines.push(`Staff:  ${order.acceptedBy || staffName}`);
  }
  if (order.customerName) {
    lines.push(`Cust:   ${order.customerName}`);
  }

  lines.push(singleLine);
  lines.push("QTY  ITEM");
  lines.push(singleLine);

  for (const item of order.items) {
    const qtyStr = `${item.quantity}`.padStart(2, " ");
    const variantStr = item.variantName ? ` (${item.variantName})` : "";
    lines.push(`${qtyStr} x ${item.name}${variantStr}`);
  }

  lines.push(singleLine);
  lines.push(center("KITCHEN ORDER TICKET"));
  lines.push(center("NOT A TAX INVOICE"));
  lines.push(doubleLine);

  return lines.join("\n");
}

type Props = {
  order: KotOrder;
  currentStaffName?: string | null;
  onClose?: () => void;
  isPrinted?: boolean;
  onTogglePrinted?: (orderId: number, printed: boolean) => void;
  autoLaunchPrint?: boolean;
};

export default function KitchenOrderTicketModal({
  order,
  currentStaffName,
  onClose,
  isPrinted = false,
  onTogglePrinted,
  autoLaunchPrint = false,
}: Props) {
  const [device, setDevice] = useState<string>("Canon G2010 series");
  const [isCustomDevice, setIsCustomDevice] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "roll">("a4");
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [copied, setCopied] = useState(false);
  const [printed, setPrinted] = useState(isPrinted);

  useEffect(() => {
    try {
      const savedDevice = localStorage.getItem("cafe_kot_selected_printer");
      if (savedDevice) {
        setDevice(savedDevice);
        if (!PRINTER_PRESETS.includes(savedDevice as (typeof PRINTER_PRESETS)[number])) {
          setIsCustomDevice(true);
        }
      }
      const savedPageSize = localStorage.getItem("cafe_kot_page_size");
      if (savedPageSize === "a4" || savedPageSize === "roll") {
        setPageSize(savedPageSize);
      }
      const savedWidth = localStorage.getItem("cafe_kot_paper_width");
      if (savedWidth === "58mm" || savedWidth === "80mm") {
        setPaperWidth(savedWidth);
      }
    } catch {
      /* localStorage optional */
    }
  }, []);

  useEffect(() => {
    setPrinted(isPrinted);
  }, [isPrinted]);

  useEffect(() => {
    if (autoLaunchPrint) {
      const timer = setTimeout(() => {
        window.print();
        setPrinted(true);
        onTogglePrinted?.(order.id, true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoLaunchPrint, order.id, onTogglePrinted]);

  function handleDeviceChange(val: string) {
    if (val === "__custom__") {
      setIsCustomDevice(true);
      return;
    }
    setIsCustomDevice(false);
    setDevice(val);
    try {
      localStorage.setItem("cafe_kot_selected_printer", val);
    } catch {
      /* optional */
    }
  }

  function handleCustomDeviceChange(val: string) {
    setDevice(val);
    try {
      localStorage.setItem("cafe_kot_selected_printer", val);
    } catch {
      /* optional */
    }
  }

  function handlePageSizeChange(size: "a4" | "roll") {
    setPageSize(size);
    try {
      localStorage.setItem("cafe_kot_page_size", size);
    } catch {
      /* optional */
    }
  }

  function handlePaperWidthChange(width: "80mm" | "58mm") {
    setPaperWidth(width);
    try {
      localStorage.setItem("cafe_kot_paper_width", width);
    } catch {
      /* optional */
    }
  }

  function handlePrint() {
    setPrinted(true);
    onTogglePrinted?.(order.id, true);
    window.print();
  }

  async function handleCopyText() {
    const raw = generateKotRawText(order, device, currentStaffName);
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* optional */
    }
  }

  function toggleMarkPrinted() {
    const next = !printed;
    setPrinted(next);
    onTogglePrinted?.(order.id, next);
  }

  const rawText = generateKotRawText(order, device, currentStaffName);

  return (
    <>
      {/* Global CSS for Print Media to print on A4 page, centered in middle, starting from top only */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${pageSize === "roll" ? (paperWidth === "58mm" ? "58mm auto" : "80mm auto") : "A4 portrait"};
            margin: 0;
          }

          /* Reset all screen-only filters, transforms and modal backdrops */
          *, *::before, *::after {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            filter: none !important;
            transform: none !important;
          }

          /* Ensure clean page canvas */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${pageSize === "roll" ? (paperWidth === "58mm" ? "58mm" : "80mm") : "210mm"} !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all screen interface elements */
          body * {
            visibility: hidden !important;
          }

          /* Make only the KOT ticket and its preformatted text visible */
          #kot-print-area,
          #kot-print-area * {
            visibility: visible !important;
          }

          /* Position ticket on A4 page: centered in middle, starting from top only */
          #kot-print-area {
            position: fixed !important;
            top: 0 !important;
            bottom: auto !important;
            ${pageSize === "roll"
              ? `
              left: 0 !important;
              right: auto !important;
              margin: 0 !important;
              margin-top: 2mm !important;
            `
              : `
              left: 0 !important;
              right: 0 !important;
              margin-left: auto !important;
              margin-right: auto !important;
              margin-top: 4mm !important;
              margin-bottom: 0 !important;
            `}
            width: ${paperWidth === "58mm" ? "58mm" : "80mm"} !important;
            max-width: ${paperWidth === "58mm" ? "58mm" : "80mm"} !important;
            box-sizing: border-box !important;
            padding: 4mm 5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 1px dashed #444444 !important;
            border-radius: 0 !important;
            font-family: 'Courier New', Courier, monospace !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #kot-print-area pre {
            color: #000000 !important;
            font-size: ${paperWidth === "58mm" ? "9.5pt" : "10.5pt"} !important;
            line-height: 1.35 !important;
            margin: 0 !important;
            padding: 0 !important;
            white-space: pre-wrap !important;
            word-break: break-word !important;
          }
        }
      `}</style>

      {/* Modal Backdrop (screen view) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kot-modal-title"
      >
        <div className="relative my-auto w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-2xl border border-[#2c2820] bg-[#111010] p-4 sm:p-5 shadow-2xl text-[#f4efe8]">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#222018] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c9993a]">
                  Kitchen Order Ticket (KOT)
                </span>
              </div>
              <h2 id="kot-modal-title" className="mt-1 text-xl font-bold text-white">
                Order #{order.id} · {order.seat}
              </h2>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2c2820] bg-[#161410] text-[#b8b2aa] hover:border-[#c9993a] hover:text-white transition"
                aria-label="Close KOT preview"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Printer Configuration Controls */}
          <div className="mt-4 space-y-3 rounded-xl border border-[#222018] bg-[#161410] p-3 text-xs">
            {/* Select Printer Option */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="kot-printer-select" className="font-semibold text-[#b8b2aa]">
                Select Printer:
              </label>
              <div className="flex-1 max-w-xs">
                <select
                  id="kot-printer-select"
                  value={isCustomDevice ? "__custom__" : device}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full rounded-lg border border-[#2c2820] bg-[#0c0a08] px-2.5 py-1.5 text-xs text-[#f4efe8] outline-none focus:border-[#c9993a]"
                >
                  {PRINTER_PRESETS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__custom__">Custom Printer Device...</option>
                </select>
                {isCustomDevice && (
                  <input
                    type="text"
                    value={device}
                    onChange={(e) => handleCustomDeviceChange(e.target.value)}
                    placeholder="Enter device model (e.g. Canon G2010)"
                    className="mt-1.5 w-full rounded-lg border border-[#2c2820] bg-[#0c0a08] px-2.5 py-1 text-xs text-[#f4efe8] outline-none focus:border-[#c9993a]"
                  />
                )}
              </div>
            </div>

            {/* Paper Format & Size Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-[#222018] pt-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[#b8b2aa]">Page Size:</span>
                <button
                  type="button"
                  onClick={() => handlePageSizeChange("a4")}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold transition ${
                    pageSize === "a4"
                      ? "bg-[#c9993a] text-black shadow"
                      : "border border-[#2c2820] bg-[#0c0a08] text-[#b8b2aa] hover:text-white"
                  }`}
                >
                  A4 Page (Top Center)
                </button>
                <button
                  type="button"
                  onClick={() => handlePageSizeChange("roll")}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold transition ${
                    pageSize === "roll"
                      ? "bg-[#c9993a] text-black shadow"
                      : "border border-[#2c2820] bg-[#0c0a08] text-[#b8b2aa] hover:text-white"
                  }`}
                >
                  Thermal Roll
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#b8b2aa]">Width:</span>
                <button
                  type="button"
                  onClick={() => handlePaperWidthChange("80mm")}
                  className={`rounded px-2 py-0.5 text-[11px] font-bold transition ${
                    paperWidth === "80mm"
                      ? "bg-[#c9993a] text-black"
                      : "border border-[#2c2820] bg-[#0c0a08] text-[#b8b2aa] hover:text-white"
                  }`}
                >
                  80mm (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperWidthChange("58mm")}
                  className={`rounded px-2 py-0.5 text-[11px] font-bold transition ${
                    paperWidth === "58mm"
                      ? "bg-[#c9993a] text-black"
                      : "border border-[#2c2820] bg-[#0c0a08] text-[#b8b2aa] hover:text-white"
                  }`}
                >
                  58mm (Mini)
                </button>
              </div>
            </div>

            {/* Mark as Printed Toggle Option */}
            <div className="flex items-center justify-between border-t border-[#222018] pt-2">
              <span className="text-[11px] text-[#b8b2aa]">
                {pageSize === "a4"
                  ? "Calibrated for A4 paper: centered horizontally, starting from top"
                  : "Calibrated for continuous thermal roll paper"}
              </span>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printed}
                  onChange={toggleMarkPrinted}
                  className="h-4 w-4 rounded border-[#2c2820] bg-[#0c0a08] text-[#c9993a] focus:ring-0"
                />
                <span className={`text-[11px] font-bold ${printed ? "text-emerald-400" : "text-[#b8b2aa]"}`}>
                  {printed ? "Marked as Printed" : "Mark as Printed"}
                </span>
              </label>
            </div>
          </div>

          {/* A4 Sheet Simulation Preview Container */}
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-[#222018] bg-[#080808] p-3 sm:p-5 overflow-hidden">
            <div className="mb-2.5 flex items-center justify-between w-full max-w-[340px] px-1 text-[11px] text-[#b8b2aa]">
              <span className="flex items-center gap-1.5 font-semibold text-[#f4efe8]">
                <svg className="h-3.5 w-3.5 text-[#e8be6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>{pageSize === "a4" ? "A4 Page Layout" : "Thermal Roll Layout"}</span>
              </span>
              <span className="rounded bg-[#c9993a]/15 border border-[#c9993a]/30 px-2 py-0.5 text-[10px] font-bold text-[#e8be6a]">
                {pageSize === "a4" ? "Top Center Aligned" : "Left Aligned"}
              </span>
            </div>

            {/* A4 sheet miniature frame */}
            <div className="relative flex flex-col items-center w-full max-w-[340px] pt-2 pb-4 px-3 rounded-lg border border-dashed border-[#333025] bg-[#111010]/80">
              <span className="text-[10px] text-[#b8b2aa]/70 uppercase tracking-widest mb-2 font-mono">
                ↑ Top of {pageSize === "a4" ? "A4 Sheet" : "Roll"} ↑
              </span>
              <div
                id="kot-print-area"
                className={`rounded border border-neutral-300 bg-[#fffdf7] p-3 sm:p-4 text-black shadow-lg font-mono text-[11px] sm:text-[12px] leading-tight select-text overflow-x-auto max-w-full ${
                  paperWidth === "58mm" ? "w-[240px]" : "w-[300px]"
                }`}
                style={{
                  fontFamily: "'Courier New', Courier, 'Lucida Console', monospace",
                  lineHeight: "1.35",
                }}
              >
                <pre className="whitespace-pre font-mono m-0 p-0 text-black leading-snug">{rawText}</pre>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#222018]">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex min-h-10 flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 text-xs font-semibold text-[#f4efe8] hover:border-[#c9993a] transition"
              >
                <svg className="h-3.5 w-3.5 text-[#e8be6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copied ? "Copied!" : "Copy KOT Text"}</span>
              </button>

              <button
                type="button"
                onClick={toggleMarkPrinted}
                className={`inline-flex min-h-10 flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                  printed
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    : "border-[#2c2820] bg-[#161410] text-[#b8b2aa] hover:text-white"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{printed ? "Printed" : "Mark Printed"}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-10 flex-1 sm:flex-none rounded-xl border border-[#2c2820] bg-[#161410] px-4 text-xs font-semibold text-[#b8b2aa] hover:text-white transition"
                >
                  Done / Close
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex min-h-10 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] px-5 text-xs font-black uppercase tracking-wider text-[#080808] shadow-md shadow-[#c9993a]/20 transition hover:brightness-110 active:scale-95"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
