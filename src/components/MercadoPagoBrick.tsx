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

type CopyFeedbackState = "idle" | "copied" | "error";

const PIX_POLLING_INTERVAL_MS = 5000;

let isMercadoPagoInitialized = false;

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
  const hasReportedSuccess = useRef(false);
  const pollingTimerRef = useRef<number | null>(null);
  const copyFeedbackTimerRef = useRef<number | null>(null);
  const [step, setStep] = useState<CheckoutStep>("form");
  const [paymentInfo, setPaymentInfo] = useState<PixPaymentStatus | null>(null);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusScreenFailed, setStatusScreenFailed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedbackState>("idle");

  useEffect(() => {
    if (!publicKey) {
      setErrorMessage(
        "Não foi possível inicializar o checkout. Configure a chave pública do Mercado Pago."
      );
      return;
    }

    if (isMercadoPagoInitialized) {
      return;
    }

    initMercadoPago(publicKey, { locale: "pt-BR" });
    isMercadoPagoInitialized = true;
  }, [publicKey]);

  useEffect(() => {
    setStep("form");
    setPaymentInfo(null);
    setErrorMessage(null);
    setIsPaymentReady(false);
    hasReportedSuccess.current = false;
    setStatusScreenFailed(false);
    setCopyFeedback("idle");

    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (copyFeedbackTimerRef.current) {
      window.clearTimeout(copyFeedbackTimerRef.current);
      copyFeedbackTimerRef.current = null;
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

  useEffect(() => {
    if (copyFeedback === "idle") {
      return;
    }

    if (copyFeedbackTimerRef.current) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }

    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopyFeedback("idle");
      copyFeedbackTimerRef.current = null;
    }, 2500);

    return () => {
      if (copyFeedbackTimerRef.current) {
        window.clearTimeout(copyFeedbackTimerRef.current);
        copyFeedbackTimerRef.current = null;
      }
    };
  }, [copyFeedback]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        window.clearTimeout(copyFeedbackTimerRef.current);
        copyFeedbackTimerRef.current = null;
      }
    };
  }, []);

  const paymentInitialization = useMemo(
    () => ({
      amount,
      payer: {
        email: payerEmail,
        firstName: payerFirstName ?? undefined,
        lastName: payerLastName ?? undefined,
      },
    }),
    [amount, payerEmail, payerFirstName, payerLastName]
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
      ...(typeof window !== "undefined"
        ? {
            backUrls: {
              return: `${window.location.origin}/platform`,
            },
          }
        : {}),
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

    const pixData = paymentInfo.point_of_interaction?.transaction_data;

    const handleCopyPixCode = async () => {
      if (!pixData?.qr_code) {
        return;
      }

      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("clipboard API indisponível");
        }

        await navigator.clipboard.writeText(pixData.qr_code);
        setCopyFeedback("copied");
      } catch (error) {
        console.error("Erro ao copiar código PIX", error);
        setCopyFeedback("error");
      }
    };

    const renderPixFallback = () => {
      if (!pixData) {
        return (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Não foi possível carregar os dados do PIX automaticamente. Atualize a página ou gere um novo pagamento.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {pixData.qr_code_base64 ? (
            <div className="flex justify-center">
              {/* Mercado Pago returns a base64 image not hosted within Next's domain list, so we avoid next/image here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code do PIX"
                className="h-60 w-60 max-w-full rounded-lg border border-slate-300 bg-white p-3 shadow-sm"
              />
            </div>
          ) : null}
          {pixData.qr_code ? (
            <div>
              <p className="text-sm font-semibold text-slate-700">Pix copia e cola</p>
              <textarea
                readOnly
                value={pixData.qr_code}
                className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-700"
                rows={4}
                onFocus={(event) => event.currentTarget.select()}
              />
              <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handleCopyPixCode}
                  disabled={!pixData.qr_code}
                >
                  {copyFeedback === "copied" ? "Copiado!" : "Copiar código"}
                </button>
                {copyFeedback === "error" ? (
                  <span className="text-xs text-red-600">
                    Não foi possível copiar automaticamente. Copie manualmente acima.
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
          {pixData.ticket_url ? (
            <p className="text-sm text-slate-600">
              Prefere abrir direto no Mercado Pago?{" "}
              <a
                href={pixData.ticket_url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-green-700 hover:text-green-800"
              >
                Acessar comprovante
              </a>
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            Assim que o Mercado Pago confirmar o pagamento, seu acesso será liberado automaticamente.
          </p>
        </div>
      );
    };

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
          {!statusScreenFailed ? (
            <StatusScreen
              id="mercado-pago-status-brick"
              locale="pt-BR"
              initialization={{
                paymentId: String(paymentInfo.id),
              }}
              customization={statusCustomization}
              onError={(error) => {
                console.error("Mercado Pago Status Screen", error);
                setStatusScreenFailed(true);
                setErrorMessage(
                  "Não foi possível carregar a tela do Mercado Pago. Utilize o QR code ou o código Pix abaixo ou gere um novo pagamento."
                );
              }}
            />
          ) : (
            renderPixFallback()
          )}
        </div>
        {!statusScreenFailed ? (
          <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            Assim que o Mercado Pago confirmar o pagamento, vamos liberar automaticamente o seu acesso.
          </p>
        ) : null}
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
