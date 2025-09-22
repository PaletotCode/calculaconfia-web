"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";

import MercadoPagoBrick from "@/components/MercadoPagoBrick";
import { LucideIcon } from "@/components/LucideIcon";
import useAuth from "@/hooks/useAuth";
import { createOrder, extractErrorMessage } from "@/lib/api";
import {
  extractCreditsFromUser,
  inferPurchaseFromUser,
} from "@/utils/user-credits";

type SessionStatus =
  | "LOADING"
  | "LOGGED_OUT"
  | "READY_FOR_PLATFORM"
  | "NEEDS_PAYMENT"
  | "PAYMENT_IN_PROGRESS";

type PaymentStatus = {
  title: string;
  message: string;
  type: "Info" | "success" | "error";
};

interface SessionManagerContextValue {
  status: SessionStatus;
  isPaymentModalOpen: boolean;
  isPaymentStatusOpen: boolean;
  paymentStatus: PaymentStatus | null;
  openPaymentModal: () => boolean;
  closePaymentModal: () => void;
  showPaymentStatus: (status: PaymentStatus) => void;
  hidePaymentStatus: () => void;
}

const SessionManagerContext =
  createContext<SessionManagerContextValue | undefined>(undefined);

const DEFAULT_CREDIT_PRICE = 5;

export function useSessionManager() {
  const context = useContext(SessionManagerContext);
  if (!context) {
    throw new Error("useSessionManager must be used within SessionManager");
  }
  return context;
}

export default function SessionManager({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, refresh } = useAuth();

  const [status, setStatus] = useState<SessionStatus>("LOADING");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentStatusOpen, setIsPaymentStatusOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number>(DEFAULT_CREDIT_PRICE);
  const [isPollingCredits, setIsPollingCredits] = useState(false);
  const [hasPromptedPayment, setHasPromptedPayment] = useState(false);

  const balancePollingIntervalRef = useRef<number | null>(null);
  const balancePollingTimeoutRef = useRef<number | null>(null);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const stopBalancePolling = useCallback(() => {
    if (balancePollingIntervalRef.current) {
      window.clearInterval(balancePollingIntervalRef.current);
      balancePollingIntervalRef.current = null;
    }
    if (balancePollingTimeoutRef.current) {
      window.clearTimeout(balancePollingTimeoutRef.current);
      balancePollingTimeoutRef.current = null;
    }
    setIsPollingCredits(false);
  }, []);

  const showPaymentStatus = useCallback((info: PaymentStatus) => {
    setPaymentStatus(info);
    setIsPaymentStatusOpen(true);
  }, []);

  const hidePaymentStatus = useCallback(() => {
    setIsPaymentStatusOpen(false);
  }, []);

  const startBalancePolling = useCallback(() => {
    if (isPollingCredits) {
      return;
    }
    stopBalancePolling();
    setIsPollingCredits(true);
    void refresh();
    balancePollingIntervalRef.current = window.setInterval(() => {
      void refresh();
    }, 4000);
    balancePollingTimeoutRef.current = window.setTimeout(() => {
      stopBalancePolling();
      showPaymentStatus({
        title: "Pagamento em processamento",
        message:
          "Ainda não recebemos a confirmação do pagamento. Assim que o Mercado Pago aprovar, vamos atualizar seus créditos automaticamente.",
        type: "Info",
      });
    }, 2 * 60 * 1000);
  }, [isPollingCredits, refresh, stopBalancePolling, showPaymentStatus]);

  const {
    mutate: triggerCreateOrder,
    reset: resetCreateOrder,
    isPending: isCreatingOrder,
    isError: isCreateOrderError,
    error: createOrderError,
  } = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      if (data.preference_id) {
        setPreferenceId(data.preference_id);
        if (typeof data.amount === "number") {
          setOrderAmount(data.amount);
        } else {
          setOrderAmount(DEFAULT_CREDIT_PRICE);
        }
      } else {
        setPreferenceId(null);
        setOrderAmount(DEFAULT_CREDIT_PRICE);
        setStatus("NEEDS_PAYMENT");
        showPaymentStatus({
          title: "Erro ao iniciar pagamento",
          message:
            "Não foi possível obter as informações de pagamento. Tente novamente.",
          type: "error",
        });
      }
    },
    onError: (error) => {
      setPreferenceId(null);
      setOrderAmount(DEFAULT_CREDIT_PRICE);
      setStatus("NEEDS_PAYMENT");
      showPaymentStatus({
        title: "Não foi possível iniciar",
        message: extractErrorMessage(error),
        type: "error",
      });
    },
  });

  const resetPaymentFlow = useCallback(() => {
    setPreferenceId(null);
    setOrderAmount(DEFAULT_CREDIT_PRICE);
    setIsPaymentModalOpen(false);
    setIsPaymentStatusOpen(false);
    setPaymentStatus(null);
    setHasPromptedPayment(false);
    stopBalancePolling();
    resetCreateOrder();
  }, [resetCreateOrder, stopBalancePolling]);

  const openPaymentModal = useCallback(() => {
    if (!isAuthenticated) {
      return false;
    }
    setIsPaymentModalOpen(true);
    setHasPromptedPayment(true);
    if (status === "LOGGED_OUT" || status === "LOADING") {
      setStatus("NEEDS_PAYMENT");
    }
    return true;
  }, [isAuthenticated, status]);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setPreferenceId(null);
    setOrderAmount(DEFAULT_CREDIT_PRICE);
    resetCreateOrder();
    if (status === "PAYMENT_IN_PROGRESS") {
      setStatus("NEEDS_PAYMENT");
    }
  }, [resetCreateOrder, status]);

  const handleGeneratePix = useCallback(() => {
    if (isCreatingOrder) {
      return;
    }
    setPreferenceId(null);
    setOrderAmount(DEFAULT_CREDIT_PRICE);
    resetCreateOrder();
    setStatus("PAYMENT_IN_PROGRESS");
    triggerCreateOrder();
  }, [isCreatingOrder, resetCreateOrder, triggerCreateOrder]);

  const handleCheckBalance = useCallback(async () => {
    await refresh();
    startBalancePolling();
    showPaymentStatus({
      title: "Estamos verificando",
      message:
        "Atualizamos suas informações. Assim que novos créditos forem detectados, você será redirecionado automaticamente para a plataforma.",
      type: "Info",
    });
  }, [refresh, startBalancePolling, showPaymentStatus]);

  const handlePaymentSuccess = useCallback(async () => {
    stopBalancePolling();
    setPreferenceId(null);
    setIsPaymentModalOpen(false);
    setStatus("READY_FOR_PLATFORM");
    await refresh();
  }, [refresh, stopBalancePolling]);

  useEffect(() => () => stopBalancePolling(), [stopBalancePolling]);

  useEffect(() => {
    if (isLoading) {
      if (status !== "LOADING") {
        setStatus("LOADING");
      }
      return;
    }

    if (!isAuthenticated) {
      if (status !== "LOGGED_OUT") {
        setStatus("LOGGED_OUT");
      }
      resetPaymentFlow();
      return;
    }

    const credits = extractCreditsFromUser(user);
    const hasPurchase = inferPurchaseFromUser(user);

    if (credits > 0 || hasPurchase) {
      if (status !== "READY_FOR_PLATFORM") {
        setStatus("READY_FOR_PLATFORM");
      }
      return;
    }

    if (status === "PAYMENT_IN_PROGRESS") {
      return;
    }

    if (status !== "NEEDS_PAYMENT") {
      setStatus("NEEDS_PAYMENT");
    }

    if (!hasPromptedPayment) {
      setIsPaymentModalOpen(true);
      setHasPromptedPayment(true);
    }
  }, [
    hasPromptedPayment,
    isAuthenticated,
    isLoading,
    resetPaymentFlow,
    status,
    user,
  ]);

  useEffect(() => {
    if (status !== "READY_FOR_PLATFORM" || !isAuthenticated) {
      return;
    }
    if (pathname && pathname.startsWith("/platform")) {
      return;
    }
    router.replace("/platform");
  }, [isAuthenticated, pathname, router, status]);

  useEffect(() => {
    if (!pathname) {
      return;
    }
    if (pathname.startsWith("/platform")) {
      return;
    }
    if (status === "PAYMENT_IN_PROGRESS" && !isPaymentModalOpen) {
      setIsPaymentModalOpen(true);
    }
  }, [isPaymentModalOpen, pathname, status]);

  const formattedOrderAmount = useMemo(
    () => currencyFormatter.format(orderAmount),
    [currencyFormatter, orderAmount]
  );

  const shouldRenderChildren =
    !(pathname === "/" && status === "READY_FOR_PLATFORM");

  const contextValue = useMemo<SessionManagerContextValue>(
    () => ({
      status,
      isPaymentModalOpen,
      isPaymentStatusOpen,
      paymentStatus,
      openPaymentModal,
      closePaymentModal,
      showPaymentStatus,
      hidePaymentStatus,
    }),
    [
      hidePaymentStatus,
      isPaymentModalOpen,
      isPaymentStatusOpen,
      openPaymentModal,
      closePaymentModal,
      paymentStatus,
      showPaymentStatus,
      status,
    ]
  );

  return (
    <SessionManagerContext.Provider value={contextValue}>
      {shouldRenderChildren ? children : null}

      {isPaymentStatusOpen && paymentStatus ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 px-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl md:p-8">
            <button
              type="button"
              onClick={hidePaymentStatus}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              title="Fechar aviso"
            >
              <LucideIcon name="X" className="h-5 w-5" />
            </button>
            <LucideIcon
              name={
                paymentStatus.type === "success"
                  ? "CircleCheckBig"
                  : paymentStatus.type === "error"
                  ? "TriangleAlert"
                  : "Info"
              }
              className={clsx(
                "mx-auto mb-4 h-12 w-12",
                paymentStatus.type === "success"
                  ? "text-green-500"
                  : paymentStatus.type === "error"
                  ? "text-red-500"
                  : "text-slate-500"
              )}
            />
            <h2 className="mb-2 text-xl font-bold text-slate-800">
              {paymentStatus.title}
            </h2>
            <p className="text-slate-700">{paymentStatus.message}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700"
                onClick={hidePaymentStatus}
              >
                Continuar
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-slate-200 py-2.5 font-semibold text-slate-800 hover:bg-slate-300"
                onClick={hidePaymentStatus}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPaymentModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={closePaymentModal}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600"
              title="Fechar"
            >
              <LucideIcon name="X" className="h-5 w-5" />
            </button>
            <div className="pr-8">
              <h3 className="text-xl font-semibold text-slate-900">Gerar pagamento PIX</h3>
              <p className="mt-1 text-sm text-slate-600">Valor único de {formattedOrderAmount}.</p>
            </div>
            {isCreateOrderError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {extractErrorMessage(createOrderError)}
              </div>
            )}
            <div className="mt-6">
              {preferenceId ? (
                <MercadoPagoBrick
                  preferenceId={preferenceId}
                  onPaymentCreated={() => startBalancePolling()}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={handleGeneratePix}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder
                      ? "Gerando PIX..."
                      : `Gerar PIX de ${formattedOrderAmount}`}
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    Você verá o QR Code oficial do Mercado Pago em seguida.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm font-medium text-green-700 hover:text-green-800"
                onClick={handleCheckBalance}
              >
                Já paguei, verificar saldo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SessionManagerContext.Provider>
  );
}
