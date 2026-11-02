let lockCount = 0;

/**
 * Safely locks body scrolling when a modal, drawer, or dialog is open.
 * Keeps reference count so multiple nested modals do not prematurely unlock.
 */
export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
}

/**
 * Unlocks body scrolling when a modal or dialog closes.
 * Restores scrolling only when all active locks are released.
 */
export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
}

/**
 * Resets all scroll locks unconditionally.
 * Use on page transitions, route changes, or unmounts to guarantee the user is never stuck.
 */
export function forceUnlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}

