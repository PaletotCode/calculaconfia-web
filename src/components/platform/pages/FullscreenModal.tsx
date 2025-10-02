"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface FullscreenModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function FullscreenModal({ open, title, onClose, children, className }: FullscreenModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    document.addEventListener("keydown", handleKeyDown);
    const button = closeButtonRef.current;
    button?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? headingId : undefined}
        className={clsx(
          "relative z-10 flex h-[calc(100vh-120px)] w-[calc(100vw-32px)] max-w-[420px] flex-col overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-2xl sm:h-[calc(100vh-96px)] sm:max-w-[520px] sm:rounded-[32px] md:h-[96vh] md:w-[min(640px,90vw)] md:max-w-none",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id={headingId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}