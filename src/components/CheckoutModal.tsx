"use client";

import { useEffect } from "react";
import { LucideIcon } from "@/components/LucideIcon";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl: string;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  checkoutUrl,
}: CheckoutModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const hasCheckoutUrl = checkoutUrl.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 px-4 py-6">
      <div className="relative flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Finalize o Pagamento</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar modal de pagamento"
          >
            <LucideIcon name="X" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
          {hasCheckoutUrl ? (
            <iframe
              src={checkoutUrl}
              title="Mercado Pago Checkout"
              className="h-full w-full flex-1 border-0"
              referrerPolicy="no-referrer"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-600">
              Não foi possível carregar o checkout. Feche esta janela e tente novamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
