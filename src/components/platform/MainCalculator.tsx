import React, { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle,
  FileSearch2,
  FileText,
  Info,
  Loader2,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import './MainCalculator.css';

import useAuth from '@/hooks/useAuth';
import { calcular, type BillPayload, type CalcularResponse, extractErrorMessage } from '@/lib/api';
import { extractCreditsFromUser } from '@/utils/user-credits';

interface BillData {
  date: string;
  icms: string;
}

interface CarouselSlideData {
  imgSrc: string;
  imgAlt: string;
  title: string;
  description: string;
}

interface MainCalculatorProps {
  onRequestBuyCredits?: () => void;
  onNavigateToHistory?: () => void;
  isVisible?: boolean;
}

const CAROUSEL_SLIDES: CarouselSlideData[] = [
  {
    imgSrc: 'https://placehold.co/400x300/e2e8f0/64748b?text=Onde+encontrar+o+ICMS%3F',
    imgAlt: '[Imagem de Dica sobre ICMS na fatura]',
    title: 'Onde encontrar o ICMS?',
    description: "Procure na seção 'Detalhes de Faturamento' ou 'Tributos' da sua conta de luz.",
  },
  {
    imgSrc: 'https://placehold.co/400x300/e2e8f0/64748b?text=Preencha+o+valor+exato',
    imgAlt: '[Imagem de Dica sobre preenchimento de valor]',
    title: 'Preencha o valor exato',
    description: 'Use a vírgula para centavos, como no exemplo: 45,78.',
  },
  {
    imgSrc: 'https://placehold.co/400x300/e2e8f0/64748b?text=Data+de+Vencimento',
    imgAlt: '[Imagem de Dica sobre data da fatura]',
    title: 'Use a data de vencimento',
    description: 'A data de vencimento ou de emissão pode ser usada como referência.',
  },
];

const TIMELINE_ITEMS = [
  { text: 'Analisando padrões de tributação...', icon: FileSearch2 },
  { text: 'Cruzando dados com a legislação vigente...', icon: Scale },
  { text: 'Calculando correção monetária retroativa...', icon: CalendarClock },
  { text: 'Estimando juros da taxa Selic...', icon: TrendingUp },
  { text: 'Compilando seu relatório final...', icon: CheckCircle },
];

const NO_CREDITS_MESSAGE = 'Você precisa de créditos ativos para iniciar um novo cálculo.';

const parseICMSValue = (value?: string): number => {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDateToIssueDate = (value?: string): string => {
  if (!value) {
    return '';
  }

  if (/^\d{2}\/\d{4}$/.test(value)) {
    const [month, year] = value.split('/');
    if (!month || !year) {
      return '';
    }

    const monthNumber = Number(month);
    if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return '';
    }

    return `${year}-${month.padStart(2, '0')}`;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [, month] = value.split('-');
    const monthNumber = Number(month);
    return Number.isFinite(monthNumber) && monthNumber >= 1 && monthNumber <= 12 ? value : '';
  }

  return '';
};

const formatDateForDisplay = (value?: string): string => {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-');
    return `${month}/${year}`;
  }

  return value;
};

const sanitizeCurrencyInput = (raw: string): string => {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) {
    return '';
  }

  const [integerPart = '', decimalPart = ''] = cleaned.split(',');
  const normalizedInteger = integerPart.replace(/\./g, '');
  const sanitizedDecimals = decimalPart.replace(/[^\d]/g, '').slice(0, 2);

  return sanitizedDecimals ? `${normalizedInteger},${sanitizedDecimals}` : normalizedInteger;
};

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

const StepSection: FC<{ id: string; active: boolean; children: ReactNode; className?: string }> = ({
  id,
  active,
  children,
  className,
}) => (
  <section id={id} className={classNames('calculator-step', active && 'active', className)}>
    {children}
  </section>
);

const MouseLight: FC = () => {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!lightRef.current) {
        return;
      }

      lightRef.current.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <div ref={lightRef} className="mouse-light" aria-hidden="true" />;
};

const Title3D: FC<{ children: ReactNode }> = ({ children }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!titleRef.current) {
      return;
    }

    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - left) / width - 0.5;
    const y = (event.clientY - top) / height - 0.5;

    titleRef.current.style.transform = `perspective(1000px) rotateX(${-y * 18}deg) rotateY(${x * 18}deg) scale3d(1.04, 1.04, 1.04)`;
  };

  const handleMouseLeave = () => {
    if (!titleRef.current) {
      return;
    }

    titleRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <h1 ref={titleRef} className="title-3d">
        {children}
      </h1>
    </div>
  );
};

const Carousel: FC<{ slides: CarouselSlideData[] }> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  return (
    <div className="carousel-container">
      <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {slides.map((slide, index) => (
          <div key={slide.title} className="carousel-slide" aria-hidden={currentIndex !== index}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imgSrc} alt={slide.imgAlt} />
            <p className="carousel-title">{slide.title}</p>
            <p className="carousel-description">{slide.description}</p>
          </div>
        ))}
      </div>
      <div className="carousel-dots" role="tablist" aria-label="Dicas rápidas">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            role="tab"
            aria-selected={currentIndex === index}
            aria-controls={`carousel-slide-${index}`}
            className={classNames('carousel-dot', currentIndex === index && 'active')}
            onClick={() => setCurrentIndex(index)}
          >
            <span className="sr-only">Ir para dica {index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const Confetti: FC = () => (
  <div className="confetti-container" aria-hidden="true">
    {Array.from({ length: 150 }).map((_, index) => {
      const style = {
        '--speed': Math.random() * 10 + 5,
        '--delay': Math.random() * 5,
        '--color': `hsl(${Math.random() * 360}, 70%, 60%)`,
        '--left': Math.random() * 100,
        '--angle': Math.random() * 360,
      } as React.CSSProperties;

      return <div key={index} className="confetti-piece" style={style} />;
    })}
  </div>
);

const MainCalculator: FC<MainCalculatorProps> = ({ onRequestBuyCredits, onNavigateToHistory, isVisible = true }) => {
  const [calculatorStep, setCalculatorStep] = useState(0);
  const [selectedBillCount, setSelectedBillCount] = useState(0);
  const [billData, setBillData] = useState<BillData[]>([]);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [loadingStep, setLoadingStep] = useState(-1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [timelineFinished, setTimelineFinished] = useState(false);
  const [calculationPhase, setCalculationPhase] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [calculationError, setCalculationError] = useState('');
  const [resultData, setResultData] = useState<CalcularResponse | null>(null);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);

  const { user, refresh } = useAuth();
  const creditsAvailable = useMemo(() => extractCreditsFromUser(user), [user]);
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    []
  );

  const currentMonthValue = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }, []);


  const confirmationStepIndex = 2 + selectedBillCount;
  const loadingStepIndex = confirmationStepIndex + 1;
  const resultStepIndex = loadingStepIndex + 1;

  const calcularMutation = useMutation<CalcularResponse, unknown, BillPayload[]>({
    mutationFn: (payload) => calcular({ bills: payload }),
    onSuccess: (data) => {
      setResultData(data);
      setCalculationError('');
      setCalculationPhase('success');
      setShowInsufficientCredits(false);
      void refresh();
    },
    onError: (error) => {
      const message = extractErrorMessage(error);
      setCalculationError(message);
      const normalized = message
        .normalize('NFD')
        .replace(/[^\w\s]/g, '')
        .toLowerCase();
      const mentionsCredit = normalized.includes('credito');
      const mentionsInsufficient =
        normalized.includes('insuficient') ||
        normalized.includes('esgotado') ||
        normalized.includes('disponivel');
      setShowInsufficientCredits(mentionsCredit && mentionsInsufficient);
      setCalculationPhase('error');
    },
  });

  useEffect(() => {
    if (creditsAvailable > 0) {
      setShowInsufficientCredits(false);
    }
  }, [creditsAvailable]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isVisible && isCalculating) {
      setCalculatorStep(loadingStepIndex);
      setLoadingStep(-1);
      setTimelineFinished(false);

      let currentProcessingIndex = 0;

      const processNextItem = () => {
        if (currentProcessingIndex < TIMELINE_ITEMS.length) {
          setLoadingStep(currentProcessingIndex);
          currentProcessingIndex += 1;
          timer = setTimeout(processNextItem, 1100);
        } else {
          setLoadingStep(currentProcessingIndex);
          timer = setTimeout(() => {
            setIsCalculating(false);
            setTimelineFinished(true);
          }, 500);
        }
      };

      processNextItem();
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isCalculating, isVisible, loadingStepIndex]);

  useEffect(() => {
    if (!timelineFinished) {
      return;
    }

    if (calculationPhase === 'success') {
      setCalculatorStep(resultStepIndex);
    }

    if (calculationPhase === 'error') {
      setCalculatorStep(confirmationStepIndex);
    }
  }, [timelineFinished, calculationPhase, confirmationStepIndex, resultStepIndex]);

  const handleBillCountSelection = (count: number) => {
    setCalculationPhase('idle');
    setCalculationError('');
    setTimelineFinished(false);
    setIsCalculating(false);
    setSelectedBillCount(count);
    setShowRecommendation(count <= 2);
    setShowInsufficientCredits(false);

    if (count > 2) {
      startFormFlow(count);
    }
  };

  const handleAcceptRecommendation = () => {
    setCalculationPhase('idle');
    setCalculationError('');
    setSelectedBillCount(3);
    setShowInsufficientCredits(false);
    startFormFlow(3);
  };

  const handleContinueAnyway = () => {
    setCalculationPhase('idle');
    setCalculationError('');
    setShowInsufficientCredits(false);
    startFormFlow(selectedBillCount);
  };

  const startFormFlow = (count: number) => {
    setBillData(Array.from({ length: count }, () => ({ date: '', icms: '' })));
    setShowRecommendation(false);
    setFormErrors([]);
    setCalculationPhase('idle');
    setCalculationError('');
    setTimelineFinished(false);
    setIsCalculating(false);
    setLoadingStep(-1);
    setResultData(null);
    setShowInsufficientCredits(false);
    setCalculatorStep(2);
  };

  const updateBillData = (index: number, field: keyof BillData, value: string) => {
    setBillData((previous) => {
      const updated = [...previous];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const clearFieldError = (index: number, field: keyof BillData) => {
    setFormErrors((previous) => previous.filter((error) => error !== `${field}-${index}`));
  };

  const handleBillDateChange = (index: number, value: string) => {
    updateBillData(index, 'date', value);
    clearFieldError(index, 'date');
  };

  const handleBillAmountChange = (index: number, value: string) => {
    updateBillData(index, 'icms', sanitizeCurrencyInput(value));
    clearFieldError(index, 'icms');
  };

  const handleFormNavigation = (direction: 'next' | 'prev') => {
    setCalculationPhase('idle');
    setCalculationError('');

    const currentFormIndex = calculatorStep - 2;

    if (direction === 'next') {
      const currentBill = billData[currentFormIndex];
      const normalizedDate = normalizeDateToIssueDate(currentBill?.date);
      const dateValid = Boolean(normalizedDate);
      const icmsValue = parseICMSValue(currentBill?.icms);
      const icmsValid = Number.isFinite(icmsValue) && icmsValue > 0;

      const errors: string[] = [];

      if (!dateValid) {
        errors.push(`date-${currentFormIndex}`);
      }

      if (!icmsValid) {
        errors.push(`icms-${currentFormIndex}`);
      }

      setFormErrors(errors);

      if (errors.length > 0) {
        const formElement = document.getElementById(`form-step-${currentFormIndex}`);
        formElement?.classList.add('shake');
        window.setTimeout(() => formElement?.classList.remove('shake'), 500);
        return;
      }

      setCalculatorStep((step) => step + 1);
      return;
    }

    if (currentFormIndex === 0) {
      setCalculatorStep(1);
      return;
    }

    setCalculatorStep((step) => step - 1);
  };

  const goToStep = (step: number) => {
    setCalculatorStep(step);
  };

  const startCalculation = () => {
    if (isCalculating || calcularMutation.isPending) {
      return;
    }

    setCalculationError('');
    setCalculationPhase('idle');

    if (creditsAvailable <= 0) {
      setCalculationPhase('error');
      setCalculationError(NO_CREDITS_MESSAGE);
      setShowInsufficientCredits(true);
      return;
    }

    const errors: string[] = [];

    const payloadBills: BillPayload[] = billData.map((bill, index) => {
      const issueDate = normalizeDateToIssueDate(bill.date);
      const icmsValue = parseICMSValue(bill.icms);

      if (!issueDate) {
        errors.push(`date-${index}`);
      }

      if (icmsValue <= 0) {
        errors.push(`icms-${index}`);
      }

      return {
        icms_value: icmsValue,
        issue_date: issueDate,
      };
    });

    if (errors.length > 0) {
      setFormErrors(errors);
      const firstError = errors[0] ?? '';
      const [, targetIndexString] = firstError.split('-');
      const targetIndex = Number(targetIndexString);
      const fallbackStep = Number.isNaN(targetIndex) ? confirmationStepIndex : 2 + targetIndex;
      setCalculatorStep(fallbackStep);
      setCalculationError('Preencha todos os campos obrigatórios antes de continuar.');
      setCalculationPhase('error');
      return;
    }

    if (payloadBills.length === 0) {
      setCalculationError('Adicione pelo menos uma fatura para prosseguir.');
      setCalculationPhase('error');
      return;
    }

    setFormErrors([]);
    setShowInsufficientCredits(false);
    setCalculationPhase('running');
    setCalculationError('');
    setTimelineFinished(false);
    setLoadingStep(-1);
    setIsCalculating(true);
    setResultData(null);
    calcularMutation.reset();
    calcularMutation.mutate(payloadBills);
  };

  const resetCalculator = () => {
    setCalculatorStep(1);
    setSelectedBillCount(0);
    setBillData([]);
    setShowRecommendation(false);
    setFormErrors([]);
    setIsCalculating(false);
    setLoadingStep(-1);
    setTimelineFinished(false);
    setCalculationPhase('idle');
    setCalculationError('');
    setResultData(null);
    setShowInsufficientCredits(false);
    calcularMutation.reset();
  };

  const handleBuyCreditsClick = () => {
    setShowInsufficientCredits(false);
    onRequestBuyCredits?.();
  };

  const handleGoToHistory = () => {
    setShowInsufficientCredits(false);
    onNavigateToHistory?.();
  };

  const getProgress = () => {
    if (calculatorStep === 0) return 0;
    if (calculatorStep === 1) return 25;
    if (calculatorStep >= 2 && calculatorStep < 2 + selectedBillCount) return 50;
    if (calculatorStep === 2 + selectedBillCount) return 75;
    if (calculatorStep === 3 + selectedBillCount) return 90;
    if (calculatorStep === 4 + selectedBillCount) return 100;
    return 0;
  };

  const progress = getProgress();
  const progressLabels = ['Seleção', 'Preenchimento', 'Confirmação', 'Resultado'];

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 via-white to-slate-200" aria-hidden="true" />
      {isVisible && <MouseLight />}

      {isVisible && showInsufficientCredits && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mb-4 flex justify-center">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Créditos insuficientes</h2>
            <p className="mt-3 text-sm text-slate-600">{calculationError || NO_CREDITS_MESSAGE}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleBuyCreditsClick}
                className="w-full rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:w-auto"
              >
                Comprar créditos
              </button>
              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={handleGoToHistory}
                  className="w-full rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 sm:w-auto"
                >
                  Ver histórico
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInsufficientCredits(false)}
                className="w-full rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-container font-sans">
        <div className={classNames('progress-bar-container', calculatorStep > 0 && selectedBillCount > 0 && 'visible')}>
          <div className="progress-bar">
            <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-labels">
            {progressLabels.map((label, index) => {
              const stepThresholds = [25, 50, 75, 100];
              const isActive = progress >= stepThresholds[index];
              return (
                <span key={label} className={isActive ? 'active' : undefined}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        <div id="calculate-container">
          <StepSection id="welcome-step" active={calculatorStep === 0}>
            <div className="welcome-content">
              <Title3D>É um prazer tê-lo aqui.</Title3D>
              <p className="welcome-subtitle">
                Vamos descobrir juntos o valor estimado que você pode ter a receber.
              </p>
              <button type="button" onClick={() => goToStep(1)} className="start-btn mt-8">
                Vamos começar
              </button>
            </div>
          </StepSection>

          <StepSection id="selection-step" active={calculatorStep === 1}>
            <button type="button" onClick={() => goToStep(0)} className="back-btn" aria-label="Voltar para a introdução">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="selection-shell">
              <h2 className="selection-title">Você tem quantas contas em mãos?</h2>
              <p className="selection-subtitle">Selecione o número de faturas que você usará para a simulação.</p>
              <div className="bill-grid">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleBillCountSelection(count)}
                    className="bill-option-card"
                  >
                    <FileText className="w-7 h-7 text-slate-500" />
                    <span className="bill-option-label">{count}</span>
                  </button>
                ))}
              </div>
              {showRecommendation && (
                <div id="recommendation-alert" className="recommendation-alert">
                  <div className="recommendation-content">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-bold">Recomendação</p>
                      <p className="text-sm">Para uma melhor estimativa, recomendamos iniciar com pelo menos três contas.</p>
                      <div className="recommendation-actions">
                        <button type="button" onClick={handleAcceptRecommendation} className="recommendation-primary">
                          Usar 3 faturas
                        </button>
                        <button type="button" onClick={handleContinueAnyway} className="recommendation-secondary">
                          Continuar mesmo assim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </StepSection>

          {billData.map((bill, formIndex) => (
            <StepSection key={formIndex} id={`form-step-${formIndex}`} active={calculatorStep === formIndex + 2}>
              <button
                type="button"
                className="back-btn"
                onClick={() => handleFormNavigation('prev')}
                aria-label="Voltar para a etapa anterior"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div className="form-content">
                <div className="form-fields">
                  <h2 className="form-title">
                    Fatura {formIndex + 1} de {selectedBillCount}
                  </h2>
                  <p className="form-subtitle">Preencha os dados desta fatura.</p>

                  <div className="input-group">
                    <CalendarClock className="input-icon" />
                    <input
                      type="month"
                      className={classNames('input-field', formErrors.includes(`date-${formIndex}`) && 'input-error')}
                      value={bill.date}
                      max={currentMonthValue}
                      onChange={(event) => handleBillDateChange(formIndex, event.target.value)}
                      aria-invalid={formErrors.includes(`date-${formIndex}`)}
                      aria-label="Selecione o mês da fatura"
                    />
                  </div>

                  <div className="input-group mt-4">
                    <FileText className="input-icon" />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Valor da fatura (R$)"
                      className={classNames('input-field', formErrors.includes(`icms-${formIndex}`) && 'input-error')}
                      value={bill.icms}
                      onChange={(event) => handleBillAmountChange(formIndex, event.target.value)}
                      aria-invalid={formErrors.includes(`icms-${formIndex}`)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFormNavigation('next')}
                    className="mt-6 calculate-btn-premium w-full py-3 font-semibold rounded-lg text-lg"
                  >
                    {formIndex === selectedBillCount - 1 ? 'Finalizar e Confirmar' : 'Próxima fatura'}
                  </button>

                  <div className="form-error-message" role="alert">
                    {formErrors.some((error) => error.endsWith(`-${formIndex}`)) &&
                      'Por favor, preencha todos os campos corretamente.'}
                  </div>
                </div>

                <div className="form-carousel">
                  <p className="carousel-hint">Dicas rápidas:</p>
                  <Carousel slides={CAROUSEL_SLIDES} />
                </div>
              </div>
            </StepSection>
          ))}

          <StepSection
            id="confirmation-step"
            active={calculatorStep === confirmationStepIndex && selectedBillCount > 0}
          >
            <button
              type="button"
              className="back-btn"
              onClick={() => setCalculatorStep((step) => step - 1)}
              aria-label="Voltar para o preenchimento"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="confirmation-content">
              <h2 className="confirmation-title">Resumo da simulação</h2>
              <p className="confirmation-subtitle">Confira os dados para prosseguir.</p>

              <div className="summary-cards-container">
                {billData.map((data, index) => (
                  <div key={index} className="summary-item">
                    <p className="summary-heading">Fatura {index + 1}</p>
                    <div className="summary-row">
                      <span>Data:</span>
                      <strong>{formatDateForDisplay(data.date) || 'N/A'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Valor:</span>
                      <strong>
                        {parseICMSValue(data.icms) > 0
                          ? currencyFormatter.format(parseICMSValue(data.icms))
                          : 'R$ 0,00'}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="confirmation-hint">
                <Info className="w-5 h-5 flex-shrink-0" />
                <span>
                  Esta simulação consumirá <strong>1 crédito</strong> do seu saldo.
                </span>
              </div>

              <button
                type="button"
                onClick={startCalculation}
                className="calculate-btn-premium w-full mt-6 py-3 text-lg font-semibold rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isCalculating || calcularMutation.isPending}
              >
                {calcularMutation.isPending ? 'Enviando...' : 'Confirmar e Calcular'}
              </button>

              {calculationError && calculationPhase === 'error' && !showInsufficientCredits && (
                <p className="confirmation-error" role="alert">
                  {calculationError}
                </p>
              )}
            </div>
          </StepSection>

          <StepSection id="loading-step" active={calculatorStep === loadingStepIndex && selectedBillCount > 0}>
            <div className="loading-content">
              <h2 className="loading-title">Processando sua simulação...</h2>
              <div className="timeline">
                {TIMELINE_ITEMS.map((item, index) => {
                  const isActive = loadingStep === index;
                  const isCompleted = loadingStep > index;
                  let IconComponent = item.icon;

                  if (isCompleted) {
                    IconComponent = CheckCircle;
                  } else if (isActive) {
                    IconComponent = Loader2;
                  }

                  return (
                    <div
                      key={item.text}
                      className={classNames('timeline-item', isCompleted && 'completed', isActive && 'active')}
                    >
                      <div className="timeline-content">
                        <IconComponent
                          className={classNames(
                            'loader-icon',
                            isActive && 'animate-spin',
                            isCompleted ? 'text-primary-accent' : 'text-slate-400'
                          )}
                        />
                        <span>{item.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {calculationError && calculationPhase === 'error' && !showInsufficientCredits && (
                <p className="loading-error" role="alert">
                  {calculationError}
                </p>
              )}
            </div>
          </StepSection>

          <StepSection id="result-step" active={calculatorStep === resultStepIndex && selectedBillCount > 0}>
            <Confetti />
            <div className="result-content">
              <p className="result-subtitle">Seu valor estimado de restituição é</p>
              <h2 className="result-value">
                {resultData ? currencyFormatter.format(resultData.valor_calculado) : currencyFormatter.format(0)}
              </h2>

              {resultData && (
                <div className="result-details">
                  <p>
                    Créditos restantes: <strong>{resultData.creditos_restantes}</strong>
                  </p>
                  {typeof resultData.processing_time_ms === 'number' && (
                    <p>Tempo de processamento: {resultData.processing_time_ms} ms</p>
                  )}
                </div>
              )}

              <div className="result-actions">
                <button type="button" onClick={resetCalculator} className="result-secondary">
                  Fazer novo cálculo
                </button>
                <button
                  type="button"
                  onClick={handleGoToHistory}
                  className="start-btn disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!onNavigateToHistory}
                >
                  Ver histórico
                </button>
              </div>
            </div>
          </StepSection>
        </div>
      </div>
    </>
  );
};

export default MainCalculator;