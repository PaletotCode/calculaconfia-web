"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import useAuth from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { createOrder, extractErrorMessage } from "@/lib/api";
import { LucideIcon } from "@/components/LucideIcon";
import { inferPurchaseFromUser } from "@/utils/user-credits";
import MercadoPagoBrick from "@/components/MercadoPagoBrick";

const Calculator = dynamic(() => import("@/components/Calculator"), { ssr: false });

const DEFAULT_PLATFORM_CREDIT_PRICE = 5;

function PlatformContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refresh } = useAuth();
  const searchParams = useSearchParams();
  const [isPaymentCardOpen, setIsPaymentCardOpen] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number>(DEFAULT_PLATFORM_CREDIT_PRICE);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );
  const formattedOrderAmount = useMemo(
    () => currencyFormatter.format(orderAmount),
    [currencyFormatter, orderAmount]
  );

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      if (data.preference_id) {
        setPreferenceId(data.preference_id);
        if (typeof data.amount === "number") {
          setOrderAmount(data.amount);
        } else {
          setOrderAmount(DEFAULT_PLATFORM_CREDIT_PRICE);
        }
      } else {
        alert("Não foi possível iniciar o checkout. Tente novamente em instantes.");
      }
    },
    onError: (error) => {
      // Idealmente, mostrar um toast/modal de erro para o usuário
      alert(extractErrorMessage(error));
    },
  });

  const {
    mutate: triggerCreateOrder,
    reset: resetCreateOrder,
    isPending,
    isError,
    error,
  } = createOrderMutation;

  const handleBuyCredits = () => {
    setPreferenceId(null);
    setOrderAmount(DEFAULT_PLATFORM_CREDIT_PRICE);
    resetCreateOrder();
    triggerCreateOrder();
  };

  const closePaymentCard = () => {
    setIsPaymentCardOpen(false);
    setPreferenceId(null);
    setOrderAmount(DEFAULT_PLATFORM_CREDIT_PRICE);
    resetCreateOrder();
  };

  const handlePaymentSuccess = async () => {
    setPreferenceId(null);
    setIsPaymentCardOpen(false);
    await refresh();
    router.replace("/platform", { scroll: false });
  };

  useEffect(() => {
    if (searchParams.get("new_user") === "true") {
      setIsPaymentCardOpen(true);
      setPreferenceId(null);
      setOrderAmount(DEFAULT_PLATFORM_CREDIT_PRICE);
      resetCreateOrder();
      // Limpa a URL para não mostrar o modal novamente em um refresh
      router.replace("/platform", { scroll: false });
    }
  }, [resetCreateOrder, router, searchParams]);

  const hasSuccessfulPayment = useMemo(
    () => inferPurchaseFromUser(user),
    [user]
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !hasSuccessfulPayment) {
      router.replace("/");
    }
  }, [hasSuccessfulPayment, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm text-white/80 shadow-2xl">
          Verificando seu acesso...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasSuccessfulPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-semibold">Acesso indisponível</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Para entrar na plataforma, finalize um pagamento aprovado no Mercado Pago usando esta conta. Assim que o pagamento
            for confirmado, seu acesso será liberado automaticamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Calculator />

      {isPaymentCardOpen && (
        <div className="fixed inset-0 z-[60] flex min-h-full items-center justify-center bg-black/60 p-4">
          <div className="payment-card relative w-full max-w-xl rounded-2xl border border-green-200 bg-white p-8 shadow-2xl md:p-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-slate-800">Comprar Créditos</h3>
              <button type="button" onClick={closePaymentCard} className="text-slate-500 hover:text-slate-700" title="Fechar">
                <LucideIcon name="X" className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4 text-green-800">
              <p className="font-bold">Bem-vindo(a)! Desbloqueie sua primeira análise.</p>
              <p className="mt-1 text-sm">
                Ganhe acesso imediato por apenas {formattedOrderAmount} e descubra oportunidades que você não pode perder. <strong>Oferta de boas-vindas!</strong>
              </p>
            </div>
            {isError && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {extractErrorMessage(error)}
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
              {preferenceId ? (
                <MercadoPagoBrick
                  preferenceId={preferenceId}
                  amount={orderAmount}
                  payerEmail={user?.email ?? ""}
                  payerFirstName={user?.first_name}
                  payerLastName={user?.last_name}
                  onPaymentCreated={() => void refresh()}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <p className="text-center text-sm text-slate-600">
                    Clique em pagar para gerar seu PIX seguro sem sair da plataforma.
                  </p>
                  <button
                    type="button"
                    className="btn-gradient-animated w-full rounded-xl py-4 text-lg font-bold text-white transition hover:scale-[1.03]"
                    onClick={handleBuyCredits}
                    disabled={isPending}
                  >
                    {isPending ? "Preparando pagamento..." : "Gerar pagamento PIX"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PlatformPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm text-white/80 shadow-2xl">
          Carregando...
        </div>
      </div>
    }>
      <PlatformContent />
    </Suspense>
  );
}
