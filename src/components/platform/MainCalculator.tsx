import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import clsx from "clsx";
import {
  BillOption,
  CalculatorFormState,
  ConfirmationStep,
  FormStep,
  LoadingStep,
  ResultStep,
  WelcomeStep,
  BillSelectionStep,
} from "./CalculatorSteps";

const STEP_ORDER = [
  "welcome",
  "selection",
  "form",
  "confirmation",
  "loading",
  "result",
] as const;

type StepId = (typeof STEP_ORDER)[number];

interface MainCalculatorProps {
  onRequestBuyCredits?: () => void;
  onNavigateToHistory?: () => void;
  isVisible?: boolean;
}

interface FormDraft extends CalculatorFormState {}

const INITIAL_FORM_STATE: FormDraft = {
  referenceMonth: "",
  dueDate: "",
  icmsPercentage: "18",
  additionalNotes: "",
};

const createInitialBills = (): BillOption[] =>
  Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    label: `Fatura ${(index + 1).toString().padStart(2, "0")}`,
    description: "Últimos 30 dias",
    selected: false,
  }));

const SWIPE_THRESHOLD = 60;
const LOADING_STEPS = 5;

type BillPayload = { icms_value: number; issue_date: string };

interface CalculationMeta {
  creditsRemaining: number | null;
  calculationId: number | null;
  processingTimeMs: number | null;
}

interface ErrorState {
  title: string;
  messages: string[];
  retryStep: StepId;
}

const MainCalculator = ({
  onRequestBuyCredits: _onRequestBuyCredits,
  onNavigateToHistory,
  isVisible = true,
}: MainCalculatorProps) => {
  // State control for step progression and data across the flow
  const [currentStep, setCurrentStep] = useState<StepId>("welcome");
  const [billData, setBillData] = useState<BillOption[]>(() => createInitialBills());
  const [billCount, setBillCount] = useState(0);
  const [formState, setFormState] = useState<FormDraft>(INITIAL_FORM_STATE);
  const [simulatedAmount, setSimulatedAmount] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [pendingPayload, setPendingPayload] = useState<BillPayload[] | null>(null);
  const [calculationMeta, setCalculationMeta] = useState<CalculationMeta | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  void _onRequestBuyCredits;

  const selectedBills = useMemo(
    () => billData.filter((bill) => bill.selected),
    [billData],
  );

  const stepIndex = STEP_ORDER.indexOf(currentStep);

  const requestControllerRef = useRef<AbortController | null>(null);
  const loadingIntervalRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const requestDispatchedRef = useRef(false);

  useEffect(() => {
    setBillCount(selectedBills.length);
  }, [selectedBills.length]);

  // Basic utilities to handle step navigation in sequence
  const goToStep = useCallback((step: StepId) => {
    setCurrentStep(step);
  }, []);

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const index = STEP_ORDER.indexOf(prev);
      const nextIndex = Math.min(index + 1, STEP_ORDER.length - 1);
      return STEP_ORDER[nextIndex];
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => {
      const index = STEP_ORDER.indexOf(prev);
      const nextIndex = Math.max(index - 1, 0);
      return STEP_ORDER[nextIndex];
    });
  }, []);

  // Handlers for each stage of the flow
  const handleStart = useCallback(() => {
    setErrorState(null);
    goToStep("selection");
  }, [goToStep]);

  const handleToggleBill = useCallback((billId: number) => {
    setBillData((previous) =>
      previous.map((bill) =>
        bill.id === billId ? { ...bill, selected: !bill.selected } : bill,
      ),
    );
  }, []);

  const handleAdvanceFromSelection = useCallback(() => {
    if (selectedBills.length === 0) {
      setErrorState({
        title: "Selecione faturas",
        messages: ["Escolha pelo menos uma fatura antes de continuar."],
        retryStep: "selection",
      });
      goToStep("selection");
      return;
    }
    setErrorState(null);
    goToStep("form");
  }, [goToStep, selectedBills.length]);

  const handleFormChange = useCallback(
    (field: keyof FormDraft, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleFormNext = useCallback(() => {
    setErrorState(null);
    goToStep("confirmation");
  }, [goToStep]);

  const handleConfirm = useCallback(() => {
    const validationMessages: string[] = [];

    if (selectedBills.length === 0) {
      validationMessages.push("Selecione ao menos uma fatura.");
    }
    if (selectedBills.length > 12) {
      validationMessages.push("É possível calcular no máximo 12 faturas por vez.");
    }

    if (!formState.referenceMonth) {
      validationMessages.push("Informe o mês de referência no formato AAAA-MM.");
    } else if (!/^\d{4}-\d{2}$/.test(formState.referenceMonth)) {
      validationMessages.push("O mês de referência deve estar no formato AAAA-MM.");
    }

    if (!formState.icmsPercentage) {
      validationMessages.push("Informe o valor estimado de ICMS.");
    } else if (Number.isNaN(Number(formState.icmsPercentage))) {
      validationMessages.push("O valor de ICMS deve ser numérico.");
    } else if (Number(formState.icmsPercentage) <= 0) {
      validationMessages.push("O valor de ICMS deve ser maior que zero.");
    }

    if (validationMessages.length > 0) {
      const nextStep = validationMessages.some((message) => message.includes("fatura"))
        ? "selection"
        : "form";
      setErrorState({
        title: "Validação necessária",
        messages: validationMessages,
        retryStep: nextStep,
      });
      goToStep(nextStep);
      return;
    }

    const icmsValue = Number(formState.icmsPercentage);
    const payload: BillPayload[] = selectedBills.map(() => ({
      icms_value: icmsValue,
      issue_date: formState.referenceMonth,
    }));

    setPendingPayload(payload);
    setErrorState(null);
    setCalculationMeta(null);
    goToStep("loading");
  }, [formState, goToStep, selectedBills]);

  const handleRestart = useCallback(() => {
    setBillData(createInitialBills());
    setBillCount(0);
    setFormState(INITIAL_FORM_STATE);
    setSimulatedAmount(0);
    setPendingPayload(null);
    setCalculationMeta(null);
    setErrorState(null);
    setLoadingIndex(0);
    setIsRequesting(false);
    goToStep("welcome");
  }, [goToStep]);

  const handleViewSummary = useCallback(() => {
    onNavigateToHistory?.();
  }, [onNavigateToHistory]);

  // API integration handled while loading to keep UI responsive
  useEffect(() => {
    if (currentStep !== "loading") {
      if (loadingIntervalRef.current) {
        window.clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
        requestControllerRef.current = null;
      }
      requestDispatchedRef.current = false;
      setIsRequesting(false);
      return;
    }

    setLoadingIndex(0);

    loadingIntervalRef.current = window.setInterval(() => {
      setLoadingIndex((previous) =>
        previous + 1 >= LOADING_STEPS ? LOADING_STEPS - 1 : previous + 1,
      );
    }, 500);

    if (!pendingPayload || requestDispatchedRef.current) {
      return () => {
        if (loadingIntervalRef.current) {
          window.clearInterval(loadingIntervalRef.current);
          loadingIntervalRef.current = null;
        }
      };
    }

    requestDispatchedRef.current = true;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsRequesting(true);

    const resolveErrorMessage = (status: number, detail?: string) => {
      const fallbackMap: Record<number, string> = {
        400: "Verifique os dados informados e tente novamente.",
        401: "Sessão expirada. Faça login novamente para continuar.",
        402: "Créditos insuficientes para realizar este cálculo.",
        404: "Dados IPCA não encontrados para o período selecionado.",
        500: "Erro interno no servidor. Tente novamente mais tarde.",
      };
      return detail ?? fallbackMap[status] ?? "Não foi possível concluir o cálculo.";
    };

    const performRequest = async () => {
      try {
        const response = await fetch("/api/v1/calcular", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ bills: pendingPayload }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let detail: string | undefined;
          try {
            const data = await response.json();
            detail = typeof data?.detail === "string" ? data.detail : undefined;
          } catch {
            detail = undefined;
          }
          throw new Error(resolveErrorMessage(response.status, detail));
        }

        const data = await response.json();
        setSimulatedAmount(Number(data?.valor_calculado ?? 0));
        setCalculationMeta({
          creditsRemaining: Number.isFinite(Number(data?.creditos_restantes))
            ? Number(data.creditos_restantes)
            : null,
          calculationId: Number.isFinite(Number(data?.calculation_id))
            ? Number(data.calculation_id)
            : null,
          processingTimeMs: Number.isFinite(Number(data?.processing_time_ms))
            ? Number(data.processing_time_ms)
            : null,
        });
        setPendingPayload(null);
        setIsRequesting(false);
        setLoadingIndex(LOADING_STEPS - 1);

        loadingTimeoutRef.current = window.setTimeout(() => {
          goToStep("result");
        }, 400);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setPendingPayload(null);
        setIsRequesting(false);
        setErrorState({
          title: "Erro no cálculo",
          messages: [
            error instanceof Error
              ? error.message
              : "Não foi possível concluir o cálculo. Tente novamente.",
          ],
          retryStep: "form",
        });
        goToStep("confirmation");
      }
    };

    void performRequest();

    return () => {
      if (loadingIntervalRef.current) {
        window.clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      controller.abort();
      requestControllerRef.current = null;
      requestDispatchedRef.current = false;
    };
  }, [currentStep, goToStep, pendingPayload]);

  // Touch gesture support for horizontal swipes
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!isVisible || currentStep === "loading") {
        return;
      }
      const touch = event.touches[0];
      touchOrigin.current = { x: touch.clientX, y: touch.clientY };
    },
    [currentStep, isVisible],
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!isVisible || currentStep === "loading") {
        touchOrigin.current = null;
        return;
      }
      if (!touchOrigin.current) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchOrigin.current.x;
      const deltaY = touch.clientY - touchOrigin.current.y;
      touchOrigin.current = null;

      if (Math.abs(deltaX) < Math.abs(deltaY) || Math.abs(deltaX) < SWIPE_THRESHOLD) {
        return;
      }

      if (deltaX < 0) {
        // Swipe left to advance
        if (currentStep === "welcome") {
          handleStart();
        } else if (currentStep === "selection") {
          handleAdvanceFromSelection();
        } else if (currentStep === "form") {
          handleFormNext();
        } else if (currentStep === "confirmation") {
          handleConfirm();
        } else if (currentStep === "result") {
          handleRestart();
        }
      } else {
        // Swipe right to go back when applicable
        if (currentStep === "selection") {
          goToPreviousStep();
        } else if (currentStep === "form") {
          goToPreviousStep();
        } else if (currentStep === "confirmation") {
          goToPreviousStep();
        } else if (currentStep === "result") {
          goToStep("confirmation");
        }
      }
    },
    [
      currentStep,
      goToPreviousStep,
      goToStep,
      handleAdvanceFromSelection,
      handleConfirm,
      handleFormNext,
      handleRestart,
      handleStart,
      isVisible,
    ],
  );

  const showSelectionAlert = selectedBills.length <= 2;

  const stepContent = useMemo(() => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onStart={handleStart} />;
      case "selection":
        return (
          <BillSelectionStep
            bills={billData}
            onToggleBill={handleToggleBill}
            onNext={handleAdvanceFromSelection}
            onPrev={goToPreviousStep}
            showAlert={showSelectionAlert}
          />
        );
      case "form":
        return (
          <FormStep
            billCount={billCount}
            formState={formState}
            onChange={handleFormChange}
            onPrev={goToPreviousStep}
            onNext={handleFormNext}
          />
        );
      case "confirmation":
        return (
          <ConfirmationStep
            selectedBills={selectedBills}
            onPrev={goToPreviousStep}
            onConfirm={handleConfirm}
          />
        );
      case "loading":
        return <LoadingStep activeIndex={loadingIndex} />;
      case "result":
        return (
          <ResultStep
            billCount={selectedBills.length}
            simulatedAmount={simulatedAmount}
            onRestart={handleRestart}
            onViewSummary={handleViewSummary}
          />
        );
      default:
        return null;
    }
  }, [
    billCount,
    billData,
    currentStep,
    formState,
    goToPreviousStep,
    handleAdvanceFromSelection,
    handleConfirm,
    handleFormChange,
    handleFormNext,
    handleRestart,
    handleStart,
    handleToggleBill,
    handleViewSummary,
    loadingIndex,
    selectedBills,
    showSelectionAlert,
    simulatedAmount,
  ]);

  return (
    <div
      className={clsx(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        !isVisible && "pointer-events-none opacity-90",
      )}
      style={{ minHeight: "100svh", width: "100%" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-hidden={!isVisible}
    >
      <div
        className="relative flex h-full w-full max-w-screen-sm flex-1 items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 shadow-inner"
      >
        <div
          key={stepIndex}
          className="flex h-full w-full items-center justify-center"
          style={{ animation: "calculator-fade-scale 0.4s ease-out" }}
        >
          {stepContent}
        </div>

        {currentStep === "loading" && isRequesting ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-4">
            <div className="pointer-events-auto rounded-2xl bg-white/80 px-4 py-2 text-xs font-medium text-emerald-600 shadow-lg backdrop-blur">
              Calculando... aguarde um instante
            </div>
          </div>
        ) : null}

        {currentStep === "result" && calculationMeta ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-xs rounded-2xl bg-white/90 p-4 text-sm text-slate-600 shadow-lg backdrop-blur">
              {calculationMeta.calculationId != null ? (
                <p className="font-semibold text-slate-700">
                  Protocolo #{calculationMeta.calculationId}
                </p>
              ) : null}
              {calculationMeta.creditsRemaining != null ? (
                <p className="mt-2">Créditos disponíveis: {calculationMeta.creditsRemaining}</p>
              ) : null}
              {calculationMeta.processingTimeMs != null ? (
                <p className="mt-1 text-xs text-slate-400">
                  Tempo de processamento: {calculationMeta.processingTimeMs} ms
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {errorState ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">{errorState.title}</h3>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                {errorState.messages.map((message, index) => (
                  <p key={`${message}-${index}`}>{message}</p>
                ))}
              </div>
              <button
                type="button"
                className="mt-6 h-12 w-full rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                onClick={() => {
                  setErrorState(null);
                  goToStep(errorState.retryStep);
                }}
              >
                Corrigir dados
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes calculator-fade-scale {
          0% {
            opacity: 0;
            transform: scale(0.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default MainCalculator;
