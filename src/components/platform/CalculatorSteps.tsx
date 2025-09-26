import { FC, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

export interface BillOption {
  id: number;
  label: string;
  selected: boolean;
  description?: string;
}

export interface CalculatorFormState {
  referenceMonth: string;
  dueDate: string;
  icmsPercentage: string;
  additionalNotes: string;
}

type StepLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
  highlight?: ReactNode;
  className?: string;
};

const bottomPadding = "calc(24px + env(safe-area-inset-bottom))";

const StepLayout: FC<StepLayoutProps> = ({ children, footer, highlight, className }) => (
  <div
    className={clsx(
      "relative flex h-full w-full flex-col items-center overflow-hidden px-4",
      className,
    )}
    style={{ minHeight: "100%" }}
  >
    {highlight}
    <div className="flex flex-1 w-full flex-col items-center justify-center gap-6 text-center">
      {children}
    </div>
    {footer ? (
      <div className="mt-auto w-full" style={{ paddingBottom: bottomPadding }}>
        {footer}
      </div>
    ) : null}
  </div>
);

export interface WelcomeStepProps {
  onStart: () => void;
}

export const WelcomeStep: FC<WelcomeStepProps> = ({ onStart }) => (
  <StepLayout
    highlight={
      <div className="absolute inset-x-0 top-0 flex justify-center pt-12">
        <div className="rounded-full bg-emerald-100/60 px-4 py-1 text-xs font-medium text-emerald-700 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            Nova experiência de cálculo
          </span>
        </div>
      </div>
    }
    footer={
      <button
        type="button"
        aria-label="Iniciar fluxo de cálculo"
        className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        onClick={onStart}
      >
        Vamos começar
      </button>
    }
  >
    <div className="flex max-w-sm flex-col items-center gap-4">
      <h1 className="text-3xl font-semibold text-slate-900">Vamos simular os seus créditos</h1>
      <p className="text-base text-slate-600">
        Organize faturas, faça ajustes e confira o potencial de recuperação em um fluxo simples e guiado.
      </p>
    </div>
  </StepLayout>
);

interface ControlButtonProps {
  label: string;
  variant: "primary" | "secondary" | "outline";
  onClick: () => void;
}

const ControlButton: FC<ControlButtonProps> = ({ label, variant, onClick }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={clsx(
      "h-12 w-full rounded-2xl text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      {
        primary:
          "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 focus-visible:outline-emerald-600",
        secondary:
          "border border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-600 focus-visible:outline-emerald-400",
        outline:
          "border border-emerald-400 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 focus-visible:outline-emerald-400",
      }[variant],
    )}
  >
    {label}
  </button>
);

export interface BillSelectionStepProps {
  bills: BillOption[];
  onToggleBill: (billId: number) => void;
  onNext: () => void;
  onPrev: () => void;
  showAlert: boolean;
}

export const BillSelectionStep: FC<BillSelectionStepProps> = ({
  bills,
  onToggleBill,
  onNext,
  onPrev,
  showAlert,
}) => (
  <StepLayout
    highlight={
      <div
        className={clsx(
          "pointer-events-none absolute left-1/2 top-6 z-10 flex w-[90%] max-w-sm -translate-x-1/2 transform justify-center transition-all duration-300",
          showAlert ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0",
        )}
      >
        <div className="flex w-full items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-700 shadow-lg">
          <AlertTriangle className="h-5 w-5" aria-hidden />
          <p className="text-sm font-medium">Selecione ao menos três faturas para uma simulação mais precisa.</p>
        </div>
      </div>
    }
    footer={
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <ControlButton label="Voltar" variant="secondary" onClick={onPrev} />
          <ControlButton label="Continuar" variant="primary" onClick={onNext} />
        </div>
      </div>
    }
  >
    <div className="flex w-full max-w-lg flex-col items-center gap-8">
      <header className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Quais faturas você quer incluir?</h2>
        <p className="text-sm text-slate-500">Escolha entre 1 e 12 faturas recentes. Você pode ajustar depois.</p>
      </header>

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
        {bills.map((bill) => (
          <button
            key={bill.id}
            type="button"
            aria-label={`Selecionar fatura ${bill.label}`}
            aria-pressed={bill.selected}
            onClick={() => onToggleBill(bill.id)}
            className={clsx(
              "relative flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 text-center transition",
              bill.selected
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-600",
            )}
          >
            <span className="text-sm font-semibold">Fatura {bill.id.toString().padStart(2, "0")}</span>
            <span className="text-xs text-slate-400">
              {bill.description ?? "Últimos 30 dias"}
            </span>
          </button>
        ))}
      </div>
    </div>
  </StepLayout>
);

export interface FormStepProps {
  billCount: number;
  formState: CalculatorFormState;
  onChange: (field: keyof CalculatorFormState, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const FormStep: FC<FormStepProps> = ({ billCount, formState, onChange, onPrev, onNext }) => (
  <StepLayout
    footer={
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <ControlButton label="Voltar" variant="secondary" onClick={onPrev} />
          <ControlButton label="Próxima" variant="outline" onClick={onNext} />
        </div>
        <button
          type="button"
          aria-label="Finalizar ajustes e avançar"
          className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          onClick={onNext}
        >
          Finalizar etapa
        </button>
      </div>
    }
  >
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Ajuste os detalhes fiscais</h2>
        <p className="text-sm text-slate-500">
          Informe os campos para {billCount} {billCount === 1 ? "fatura" : "faturas"} selecionadas e confira as dicas.
        </p>
      </header>

      <form
        className="flex w-full flex-col gap-4 text-left"
        aria-label="Formulário de configuração das faturas"
        onSubmit={(event) => {
          event.preventDefault();
          onNext();
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600">Mês de referência</span>
          <input
            aria-label="Selecionar mês de referência"
            type="month"
            value={formState.referenceMonth}
            onChange={(event) => onChange("referenceMonth", event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600">Data limite para envio</span>
          <input
            aria-label="Selecionar data limite"
            type="date"
            value={formState.dueDate}
            onChange={(event) => onChange("dueDate", event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600">Percentual de ICMS estimado</span>
          <input
            aria-label="Informar percentual de ICMS"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={formState.icmsPercentage}
            onChange={(event) => onChange("icmsPercentage", event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600">Anotações adicionais</span>
          <textarea
            aria-label="Adicionar observações"
            value={formState.additionalNotes}
            onChange={(event) => onChange("additionalNotes", event.target.value)}
            className="h-24 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </form>

      <TipsCarousel />
    </div>
  </StepLayout>
);

const TipsCarousel: FC = () => {
  const tips = [
    {
      title: "Organize por segmento",
      description: "Separe as faturas por unidade consumidora para acelerar a conferência.",
    },
    {
      title: "Revise o ICMS",
      description: "Confirme as alíquotas antes de enviar a simulação para evitar retrabalho.",
    },
    {
      title: "Compartilhe com o time",
      description: "Envie o resumo para os responsáveis financeiros antes da confirmação.",
    },
  ];

  return (
    <div className="w-full max-w-md">
      <h3 className="mb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
        Dicas rápidas
      </h3>
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        role="list"
        aria-label="Carrossel de dicas"
      >
        {tips.map((tip, index) => (
          <article
            key={tip.title}
            className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            role="listitem"
          >
            <div className="mb-3 flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider">#{index + 1}</span>
            </div>
            <h4 className="text-base font-semibold text-slate-800">{tip.title}</h4>
            <p className="mt-2 text-sm text-slate-500">{tip.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export interface ConfirmationStepProps {
  selectedBills: BillOption[];
  onPrev: () => void;
  onConfirm: () => void;
}

export const ConfirmationStep: FC<ConfirmationStepProps> = ({ selectedBills, onPrev, onConfirm }) => (
  <StepLayout
    footer={
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <ControlButton label="Voltar" variant="secondary" onClick={onPrev} />
          <ControlButton label="Confirmar e Calcular" variant="primary" onClick={onConfirm} />
        </div>
      </div>
    }
  >
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Tudo pronto para calcular</h2>
        <p className="text-sm text-slate-500">Confira o resumo antes de consumir seus créditos.</p>
      </header>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500">Faturas selecionadas</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {selectedBills.map((bill) => (
            <li key={bill.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-sm font-medium text-slate-700">Fatura {bill.id.toString().padStart(2, "0")}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full rounded-2xl bg-emerald-50 p-4 text-left text-sm text-emerald-700">
        Cada cálculo consome 1 crédito. Certifique-se de ter saldo disponível antes de confirmar.
      </div>
    </div>
  </StepLayout>
);

export interface LoadingStepProps {
  activeIndex: number;
}

export const LoadingStep: FC<LoadingStepProps> = ({ activeIndex }) => {
  const steps = [
    "Validando parâmetros",
    "Conferindo legislações",
    "Calculando créditos",
    "Gerando resumo",
    "Finalizando simulação",
  ];

  return (
    <StepLayout className="pt-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500" aria-hidden />
        <h2 className="text-2xl font-semibold text-slate-900">Processando sua simulação</h2>
        <p className="text-sm text-slate-500">Fique por aqui, isso leva poucos segundos.</p>
      </div>

      <ol className="flex w-full max-w-sm flex-col gap-4" aria-label="Linha do tempo do cálculo">
        {steps.map((label, index) => (
          <li key={label} className="relative flex items-start gap-3">
            <span
              className={clsx(
                "mt-1 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
                index < activeIndex
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : index === activeIndex
                    ? "border-emerald-500 bg-white text-emerald-600"
                    : "border-slate-200 bg-white text-slate-300",
              )}
            >
              {index < activeIndex ? "" : index + 1}
            </span>
            <div className="flex flex-1 flex-col">
              <span
                className={clsx(
                  "text-sm font-medium",
                  index <= activeIndex ? "text-slate-800" : "text-slate-400",
                )}
              >
                {label}
              </span>
              <div className="mt-2 h-1 rounded-full bg-slate-100">
                <div
                  className={clsx(
                    "h-1 rounded-full bg-emerald-500 transition-all duration-500 ease-out",
                    index < activeIndex
                      ? "w-full"
                      : index === activeIndex
                        ? "w-3/4"
                        : "w-0",
                  )}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </StepLayout>
  );
};

export interface ResultStepProps {
  billCount: number;
  simulatedAmount: number;
  onRestart: () => void;
  onViewSummary: () => void;
}

export const ResultStep: FC<ResultStepProps> = ({
  billCount,
  simulatedAmount,
  onRestart,
  onViewSummary,
}) => (
  <StepLayout
    footer={
      <div className="flex flex-col gap-3">
        <ControlButton label="Começar de novo" variant="secondary" onClick={onRestart} />
        <button
          type="button"
          aria-label="Ver resumo da simulação"
          className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          onClick={onViewSummary}
        >
          Ver resumo
        </button>
      </div>
    }
  >
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <TrendingUp className="h-12 w-12 text-emerald-500" aria-hidden />
        <h2 className="text-3xl font-semibold text-slate-900">Simulação concluída</h2>
        <p className="text-sm text-slate-500">
          Estimativa com {billCount} {billCount === 1 ? "fatura" : "faturas"} selecionadas.
        </p>
      </header>

      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <span className="text-sm uppercase tracking-[0.2em] text-emerald-500">Crédito potencial</span>
        <p className="mt-3 text-4xl font-bold text-slate-900">
          {simulatedAmount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
          })}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Esse valor é apenas uma estimativa inicial. Gere o resumo completo e compartilhe com o time fiscal.
        </p>
      </div>
    </div>
  </StepLayout>
);
