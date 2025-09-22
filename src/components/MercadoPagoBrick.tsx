"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import { useMutation } from "@tanstack/react-query";
import {
  confirmPayment,
  extractErrorMessage,
  processPixPayment,
  type PixPaymentResponse,
  type ProcessPixPaymentPayload,
} from "@/lib/api";

interface MercadoPagoBrickProps {
  preferenceId: string;
  amount: number;
  payerEmail: string;
  payerFirstName?: string | null;
  payerLastName?: string | null;
  onPaymentCreated?: (paymentId: string | number) => void;
  onPaymentSuccess: () => void;
}

type CheckoutStep = "form" | "status";

type PixPaymentStatus = PixPaymentResponse & {
  id: string | number;
};

const PIX_POLLING_INTERVAL_MS = 5000;

export default function MercadoPagoBrick({
  preferenceId,
  amount,
  payerEmail,
  payerFirstName,
  payerLastName,
  onPaymentCreated,
  onPaymentSuccess,
}: MercadoPagoBrickProps) {
  const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? "";
  const hasInitialized = useRef(false);
  const hasReportedSuccess = useRef(false);
  const pollingTimerRef = useRef<number | null>(null);
  const [step, setStep] = useState<CheckoutStep>("form");
  const [paymentInfo, setPaymentInfo] = useState<PixPaymentStatus | null>(null);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setErrorMessage(
        "Não foi possível inicializar o checkout. Configure a chave pública do Mercado Pago."
      );
      return;
    }

    if (hasInitialized.current) {
      return;
    }

    initMercadoPago(publicKey, { locale: "pt-BR" });
    hasInitialized.current = true;
  }, [publicKey]);

  useEffect(() => {
    setStep("form");
    setPaymentInfo(null);
    setErrorMessage(null);
    setIsPaymentReady(false);
    hasReportedSuccess.current = false;

    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, [preferenceId]);

  useEffect(() => {
    if (!paymentInfo?.id || hasReportedSuccess.current) {
      return;
    }

    const poll = async () => {
      try {
        const response = await confirmPayment({
          payment_id: String(paymentInfo.id),
          preference_id: preferenceId,
        });

        if (response.credits_added && !hasReportedSuccess.current) {
          hasReportedSuccess.current = true;
          if (pollingTimerRef.current) {
            window.clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          onPaymentSuccess();
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento PIX", error);
      }
    };

    void poll();
    pollingTimerRef.current = window.setInterval(poll, PIX_POLLING_INTERVAL_MS);

    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [paymentInfo?.id, preferenceId, onPaymentSuccess]);

  const paymentInitialization = useMemo(
    () => ({
      amount,
      preferenceId,
      payer: {
        email: payerEmail,
        firstName: payerFirstName ?? undefined,
        lastName: payerLastName ?? undefined,
      },
    }),
    [amount, preferenceId, payerEmail, payerFirstName, payerLastName]
  );

  const paymentCustomization = useMemo(
    () => ({
      paymentMethods: {
        bankTransfer: "all" as const,
        types: {
          included: ["bank_transfer" as const],
        },
      },
      visual: {
        hideRedirectionPanel: true,
        style: {
          theme: "flat" as const,
          customVariables: {
            baseColor: "#16a34a",
            baseColorFirstVariant: "#22c55e",
            baseColorSecondVariant: "#15803d",
            textPrimaryColor: "#0f172a",
            textSecondaryColor: "#475569",
            formBackgroundColor: "#ffffff",
            inputBackgroundColor: "#f8fafc",
            buttonTextColor: "#ffffff",
            borderRadiusMedium: "14px",
          },
        },
      },
    }),
    []
  );

  const statusCustomization = useMemo(
    () => ({
      backUrls: {
        return: "/platform",
      },
      visual: {
        hideStatusDetails: false,
        hideTransactionDate: false,
        showExternalReference: false,
      },
    }),
    []
  );

  const processPaymentMutation = useMutation({
    mutationFn: (payload: ProcessPixPaymentPayload) => processPixPayment(payload),
    onSuccess: (response) => {
      setPaymentInfo({ ...response, id: response.id });
      setStep("status");
      onPaymentCreated?.(response.id);
      if (response.status === "approved" && !hasReportedSuccess.current) {
        hasReportedSuccess.current = true;
        if (pollingTimerRef.current) {
          window.clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
        onPaymentSuccess();
      }
    },
    onError: (error) => {
      setErrorMessage(extractErrorMessage(error));
    },
  });

  const handleSubmit = async () => {
    setErrorMessage(null);
    const response = await processPaymentMutation.mutateAsync({
      preference_id: preferenceId,
    });
    return response;
  };

  const renderPaymentStep = () => (
    <div className="space-y-4">
      {!isPaymentReady && !processPaymentMutation.isPending && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Preparando checkout seguro do Mercado Pago...
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <Payment
          id="mercado-pago-payment-brick"
          locale="pt"
          initialization={paymentInitialization}
          customization={paymentCustomization}
          onReady={() => {
            setIsPaymentReady(true);
          }}
          onSubmit={async () => {
            await handleSubmit();
          }}
          onError={(error) => {
            console.error("Mercado Pago Payment Brick", error);
            setErrorMessage(
              "Não foi possível carregar o formulário de pagamento. Tente novamente."
            );
          }}
        />
      </div>
    </div>
  );

  const renderStatusStep = () => {
    if (!paymentInfo) {
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Estamos iniciando o pagamento PIX...
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <StatusScreen
          id="mercado-pago-status-brick"
          locale="pt-BR"
          initialization={{
            paymentId: String(paymentInfo.id),
          }}
          customization={statusCustomization}
          onError={(error) => {
            console.error("Mercado Pago Status Screen", error);
            setErrorMessage(
              "Não foi possível carregar o status do pagamento. Atualize a página ou gere um novo pagamento."
            );
          }}
        />
        <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
          Assim que o Mercado Pago confirmar o pagamento, vamos liberar automaticamente o seu acesso.
        </p>
      </div>
    );
  };

  if (!publicKey) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Não foi possível carregar o pagamento. Verifique sua chave pública do Mercado Pago.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {processPaymentMutation.isPending && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Gerando pagamento PIX seguro...
        </div>
      )}
      {step === "form" ? renderPaymentStep() : renderStatusStep()}
    </div>
  );
}
