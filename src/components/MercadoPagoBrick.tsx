"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

interface MercadoPagoBrickProps {
  preferenceId: string;
  onPaymentSuccess: () => void;
}

export default function MercadoPagoBrick({
  preferenceId,
  onPaymentSuccess,
}: MercadoPagoBrickProps) {
  const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? "";
  const hasInitialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      console.error("Mercado Pago public key is not configured.");
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
    setIsReady(false);
    setErrorMessage(null);
  }, [preferenceId]);

  const customization = useMemo(
    () => ({
      paymentMethods: {
        bankTransfer: "all" as const,
        types: {
          included: ["bank_transfer"] as const,
        },
      },
      visual: {
        style: {
          theme: "flat" as const,
          customVariables: {
            baseColor: "#16a34a",
            textPrimaryColor: "#0f172a",
            textSecondaryColor: "#475569",
            formBackgroundColor: "#ffffff",
            inputBackgroundColor: "#f8fafc",
            buttonTextColor: "#ffffff",
            borderRadiusMedium: "12px",
          },
        },
      },
    }),
    []
  );

  if (!publicKey) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Não foi possível carregar o pagamento. Tente novamente mais tarde.
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
      {!isReady && !errorMessage && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Preparando checkout seguro do Mercado Pago...
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-2">
        <Payment
          locale="pt"
          initialization={{
            amount: 5,
            preferenceId,
          }}
          customization={customization}
          onSubmit={async () => {
            onPaymentSuccess();
          }}
          onReady={() => {
            setIsReady(true);
          }}
          onError={(error) => {
            console.error("Mercado Pago Brick error", error);
            setErrorMessage(
              "Ocorreu um erro ao carregar o checkout. Tente gerar o pagamento novamente."
            );
          }}
        />
      </div>
    </div>
  );
}
