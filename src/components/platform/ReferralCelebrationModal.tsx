"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { LucideIcon } from "@/components/LucideIcon";

interface ReferralCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  referralCode?: string | null;
}

const SHARE_MESSAGE_TEMPLATE = `💰 Descubra se você tem CENTENAS a receber na sua conta de energia! ⚡\nVeja em segundos sua estimativa de restituição do ICMS e saiba quanto pode recuperar com total segurança e transparência.\n\n👉 Acesse agora https://calculaconfia.com.br\n\n💬 Inclua meu código de convite: {{user_referral_code}} durante o cadastro!\n\n✅ É rápido, seguro e custa só R$5 — o valor que revela quanto é SEU por direito.\n📲 Compartilhe com amigos e familiares: cada um que descobre, sai ganhando.`;

export default function ReferralCelebrationModal({
  open,
  onClose,
  referralCode,
}: ReferralCelebrationModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      window.clearTimeout(timeout);
    };
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

  if (!open || typeof document === "undefined") {
    return null;
  }

  const displayCode = referralCode?.toUpperCase() ?? "--";

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8 sm:px-6">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          "relative z-10 w-full max-w-[420px] overflow-hidden rounded-[28px] bg-gradient-to-br",
          "from-amber-400 via-pink-500 to-purple-600 text-white shadow-2xl",
          "focus:outline-none",
        )}
      >
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={onClose}
          aria-label="Fechar aviso de indicação"
        >
          <LucideIcon name="X" className="h-4 w-4" />
        </button>

        <div className="relative flex flex-col gap-5 px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <span className="inline-flex items-center gap-2 self-center rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            <LucideIcon name="Sparkles" className="h-4 w-4" />
            Indicação confirmada
          </span>

          <div className="text-center">
            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">Parabéns! Você ganhou 1 crédito bônus 🎉</h2>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Obrigado por usar um código de convite. Seu crédito extra já foi liberado e você pode começar a simular agora mesmo!
            </p>
          </div>

          <div className="rounded-3xl bg-white/15 p-4 text-center shadow-inner">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">Seu código</p>
            <p className="mt-3 font-mono text-2xl tracking-[0.35em] sm:text-3xl">{displayCode}</p>
            <p className="mt-2 text-xs text-white/80">Compartilhe e ganhe mais créditos a cada nova indicação aprovada.</p>
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
              Compartilhar código no WhatsApp
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