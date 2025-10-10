"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { LucideIcon } from "@/components/LucideIcon";

interface ReferralCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  referralCode?: string | null;
}

const SHARE_MESSAGE_TEMPLATE =
  "\u{1F4B0} Descubra se voc\u00ea tem CENTENAS a receber na sua conta de energia! \u{26A1}\n" +
  "Veja em segundos sua estimativa de restitu\u00ed\u00e7\u00e3o do ICMS e saiba quanto pode recuperar com total seguran\u00e7a e transpar\u00eancia.\n\n" +
  "\u{1F449} Acesse agora https://calculaconfia.com.br\n\n" +
  "\u{1F4AC} Inclua meu c\u00f3digo de convite: {{user_referral_code}} durante o cadastro!\n\n" +
  "\u2705 \u00c9 r\u00e1pido, seguro e custa s\u00f3 R$5 \u2014 o valor que revela quanto \u00e9 SEU por direito.\n" +
  "\u{1F4F2} Compartilhe com amigos e familiares: cada um que descobre, sai ganhando.";

const ANIMATION_DURATION_MS = 260;

export default function ReferralCelebrationModal({
  open,
  onClose,
  referralCode,
}: ReferralCelebrationModalProps) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const autoCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number | null = null;
    let hideTimeout: number | null = null;

    if (open) {
      setIsMounted(true);
      raf = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else if (isMounted) {
      setIsVisible(false);
      hideTimeout = window.setTimeout(() => {
        setIsMounted(false);
      }, ANIMATION_DURATION_MS);
    }

    return () => {
      if (raf != null) {
        window.cancelAnimationFrame(raf);
      }
      if (hideTimeout != null) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [open, isMounted]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (autoCloseTimerRef.current != null) {
      window.clearTimeout(autoCloseTimerRef.current);
    }

    autoCloseTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 10000);

    return () => {
      if (autoCloseTimerRef.current != null) {
        window.clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    };
  }, [open, onClose]);

  const handleRequestClose = useCallback(() => {
    if (!open) {
      return;
    }

    if (autoCloseTimerRef.current != null) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    setIsVisible(false);
    onClose();
  }, [open, onClose]);

  const shareHref = useMemo(() => {
    if (!referralCode) {
      return null;
    }

    const message = SHARE_MESSAGE_TEMPLATE.replace(
      "{{user_referral_code}}",
      referralCode.toUpperCase(),
    );

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [referralCode]);

  if (!isMounted || typeof document === "undefined") {
    return null;
  }

  const displayCode = referralCode?.toUpperCase() ?? "--";

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[90] flex items-center justify-center px-4 py-8 sm:px-6 transition-opacity duration-300 ease-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
        onClick={handleRequestClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          "relative z-10 w-full max-w-[420px] transform overflow-hidden rounded-[28px] bg-gradient-to-br",
          "from-amber-400 via-pink-500 to-purple-600 text-white shadow-2xl",
          "focus:outline-none transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0",
        )}
      >
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={handleRequestClose}
          aria-label="Fechar aviso de indica\u00e7\u00e3o"
        >
          <LucideIcon name="X" className="h-4 w-4" />
        </button>

        <div className="relative flex flex-col gap-5 px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <span className="inline-flex items-center gap-2 self-center rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            <LucideIcon name="Sparkles" className="h-4 w-4" />
            Indica\u00e7\u00e3o confirmada
          </span>

          <div className="text-center">
            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
              Parab\u00e9ns! Voc\u00ea ganhou 1 cr\u00e9dito b\u00f4nus \u2728
            </h2>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Obrigado por usar um c\u00f3digo de convite. Seu cr\u00e9dito extra j\u00e1 foi liberado e voc\u00ea pode
              come\u00e7ar a simular agora mesmo!
            </p>
          </div>

          <div className="rounded-3xl bg-white/15 p-4 text-center shadow-inner">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">Seu c\u00f3digo</p>
            <p className="mt-3 font-mono text-2xl tracking-[0.35em] sm:text-3xl">{displayCode}</p>
            <p className="mt-2 text-xs text-white/80">
              Compartilhe e ganhe mais cr\u00e9ditos a cada nova indica\u00e7\u00e3o aprovada.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={shareHref ?? undefined}
              target="_blank"
              rel="noreferrer"
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg transition",
                shareHref
                  ? "hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  : "cursor-not-allowed bg-white/20 text-white/60",
              )}
              aria-disabled={!shareHref}
            >
              <LucideIcon name="Send" className="h-4 w-4" />
              Compartilhar c\u00f3digo no WhatsApp
            </a>
            <p className="text-center text-[11px] text-white/70">
              Este aviso fecha automaticamente em 10 segundos.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
