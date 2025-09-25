import React, { useState, useEffect, useRef, useMemo, FC, ReactNode } from 'react';
import { ArrowLeft, FileText, AlertTriangle, Info, FileSearch2, Scale, CalendarClock, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';

import { useMutation } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { calcular, type BillPayload, type CalcularResponse, extractErrorMessage } from '@/lib/api';
import { extractCreditsFromUser } from '@/utils/user-credits';

// --- TYPE DEFINITIONS ---
interface BillData {
  date?: string;
  icms?: string;
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



// --- CONSTANTS ---

const CAROUSEL_SLIDES: CarouselSlideData[] = [
    { imgSrc: "https://placehold.co/400x300/e2e8f0/64748b?text=Onde+encontrar+o+ICMS%3F", imgAlt: "[Imagem de Dica sobre ICMS na fatura]", title: "Onde encontrar o ICMS?", description: "Procure na seção 'Detalhes de Faturamento' ou 'Tributos' da sua conta de luz." },
    { imgSrc: "https://placehold.co/400x300/e2e8f0/64748b?text=Preencha+o+valor+exato", imgAlt: "[Imagem de Dica sobre preenchimento de valor]", title: "Preencha o valor exato", description: "Use a vírgula para centavos, como no exemplo: 45,78." },
    { imgSrc: "https://placehold.co/400x300/e2e8f0/64748b?text=Data+de+Vencimento", imgAlt: "[Imagem de Dica sobre data da fatura]", title: "Use a Data de Vencimento", description: "A data de vencimento ou de emissão pode ser usada como referência." },
];

const TIMELINE_ITEMS = [
  { text: "Analisando padroes de tributacao...", icon: FileSearch2 },
  { text: "Cruzando dados com a legislacao vigente...", icon: Scale },
  { text: "Calculando correcao monetaria retroativa...", icon: CalendarClock },
  { text: "Estimando juros da taxa Selic...", icon: TrendingUp },
  { text: "Compilando seu relatorio final...", icon: CheckCircle },
];

const parseICMSValue = (value?: string): number => {
  if (!value) {
    return 0;
  }
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDateToIssueDate = (value?: string): string => {
  if (!value) {
    return "";
  }
  const parts = value.split("/");
  if (parts.length !== 3) {
    return "";
  }
  const month = (parts[1] ?? "").trim().padStart(2, "0");
  const year = parts[2];
  if (!month || !year) {
    return "";
  }
  return `${year}-${month}`;
};

const isBillComplete = (bill: BillData | undefined): boolean => {
  if (!bill) {
    return false;
  }
  return Boolean(
    normalizeDateToIssueDate(bill.date) && parseICMSValue(bill.icms) > 0
  );
};

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();

const NO_CREDITS_MESSAGE =
  "Voce precisa de creditos ativos para iniciar um novo calculo.";




// --- UTILITY COMPONENTS & HOOKS ---
const useScript = (url: string, defer = true, onload?: () => void) => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = url;
        script.defer = defer;
        if (onload) script.onload = onload;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, [url, defer, onload]);
};

// Vanta.js Background
const VantaBackground: FC = () => {
    const vantaRef = useRef(null);
    const [vantaEffect, setVantaEffect] = useState<any>(null);

    useEffect(() => {
        if ((window as any).VANTA && !vantaEffect) {
            setVantaEffect((window as any).VANTA.CELLS({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                color1: 0xd4d4d4,
                color2: 0xececec,
                size: 2.00,
                speed: 1.0
            }));
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy();
        }
    }, [vantaEffect]);

    return <div ref={vantaRef} style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}></div>;
};

// Mouse Light Effect
const MouseLight: FC = () => {
    const lightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (lightRef.current) {
                lightRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return <div ref={lightRef} className="mouse-light"></div>;
};

// 3D Title
const Title3D: FC<{ children: ReactNode }> = ({ children }) => {
    const textRef = useRef<HTMLHeadingElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!textRef.current) return;
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        const rotateY = x * 20;
        const rotateX = -y * 20;
        textRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };
    
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
         if (textRef.current) {
             textRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
         }
    };

    return (
        <div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
             <h1 ref={textRef} className="text-4xl md:text-5xl font-bold text-slate-800" style={{ transition: 'transform 0.1s' }}>
                {children}
            </h1>
        </div>
    );
};


// Carousel component
const Carousel: FC<{ slides: CarouselSlideData[] }> = ({ slides }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 5000);
        return () => clearInterval(intervalId);
    }, [slides.length]);

    return (
        <div className="carousel-container aspect-video md:aspect-square">
            <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {slides.map((slide, index) => (
                    <div className="carousel-slide" key={index}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.imgSrc} alt={slide.imgAlt} />
                        <p className="font-semibold mt-2 text-sm sm:text-base text-slate-800">{slide.title}</p>
                        <p className="text-xs sm:text-sm text-slate-600">{slide.description}</p>
                    </div>
                ))}
            </div>
            <div className="carousel-dots">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        className={`carousel-dot ${currentIndex === i ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

// Confetti Component
const Confetti: FC = () => {
    return (
        <div className="confetti-container">
            {Array.from({ length: 150 }).map((_, i) => {
                const style = {
                    '--speed': (Math.random() * 10 + 5),
                    '--delay': (Math.random() * 5),
                    '--color': `hsl(${Math.random() * 360}, 70%, 60%)`,
                    '--left': (Math.random() * 100),
                    '--angle': (Math.random() * 360),
                } as React.CSSProperties;
                return <div key={i} className="confetti-piece" style={style}></div>;
            })}
        </div>
    );
};


// Main App Component
const MainCalculator: FC<MainCalculatorProps> = ({ onRequestBuyCredits, onNavigateToHistory, isVisible = true }) => {
    // --- STATE MANAGEMENT ---
    const [calculatorStep, setCalculatorStep] = useState<number>(0);
    const [selectedBillCount, setSelectedBillCount] = useState<number>(0);
    const [billData, setBillData] = useState<BillData[]>([]);
    const [showRecommendation, setShowRecommendation] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [loadingStep, setLoadingStep] = useState<number>(-1);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [timelineFinished, setTimelineFinished] = useState(false);
    const [calculationPhase, setCalculationPhase] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [calculationError, setCalculationError] = useState<string>('');
    const [resultData, setResultData] = useState<CalcularResponse | null>(null);
    const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
    const [libsLoaded, setLibsLoaded] = useState({ flatpickr: false, imask: false, three: false, vanta: false });

    const { user, refresh } = useAuth();
    const creditsAvailable = useMemo(() => extractCreditsFromUser(user), [user]);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);

    const confirmationStepIndex = 2 + selectedBillCount;
    const loadingStepIndex = confirmationStepIndex + 1;
    const resultStepIndex = loadingStepIndex + 1;

    // --- EXTERNAL LIBRARIES ---
    useScript("https://cdn.jsdelivr.net/npm/flatpickr", true, () => setLibsLoaded(prev => ({...prev, flatpickr: true})));
    useScript("https://npmcdn.com/flatpickr/dist/l10n/pt.js", true);
    useScript("https://unpkg.com/imask", true, () => setLibsLoaded(prev => ({...prev, imask: true})));
    useScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js", true, () => setLibsLoaded(prev => ({...prev, three: true})));
    useEffect(() => {
        if (libsLoaded.three) {
            const vantaScript = document.createElement('script');
            vantaScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.21/vanta.cells.min.js';
            vantaScript.defer = true;
            vantaScript.onload = () => setLibsLoaded(prev => ({...prev, vanta: true}));
            document.body.appendChild(vantaScript);

            return () => {
                document.body.removeChild(vantaScript);
            }
        }
    }, [libsLoaded.three]);
    
    // --- EFFECTS ---
    useEffect(() => {
       const currentFormIndex = calculatorStep - 2;
       if (calculatorStep > 1 && calculatorStep < (2 + selectedBillCount) && libsLoaded.flatpickr) {
           const currentFormStep = document.getElementById(`form-step-${currentFormIndex}`);
           if (currentFormStep) {
               const dateInput = currentFormStep.querySelector<HTMLInputElement>('[data-field="date"]');
               if (dateInput && !(dateInput as any)._flatpickr) {
                   (window as any).flatpickr(dateInput, {
                       dateFormat: "d/m/Y",
                       altInput: true,
                       altFormat: "d de F, Y",
                       locale: "pt",
                       onChange: function(selectedDates: Date[], dateStr: string) {
                           updateBillData(currentFormIndex, 'date', dateStr);
                       },
                   });
               }
           }
       }
    }, [calculatorStep, selectedBillCount, libsLoaded.flatpickr]);


    useEffect(() => {
        const masks: any[] = [];
        if (calculatorStep > 1 && calculatorStep < (2 + selectedBillCount) && libsLoaded.imask) {
            billData.forEach((_, index) => {
                const formStep = document.getElementById(`form-step-${index}`);
                if (formStep) {
                    const icmsInput = formStep.querySelector<HTMLInputElement>('[data-field="icms"]');
                    if (icmsInput && !(icmsInput as any).imask) {
                        const maskInstance = (window as any).IMask(icmsInput, {
                            mask: Number,
                            scale: 2,
                            thousandsSeparator: '.',
                            padFractionalZeros: true,
                            normalizeZeros: true,
                            radix: ','
                        });
                        maskInstance.on('accept', () => {
                            setBillData(prev => {
                                const newBillData = [...prev];
                                newBillData[index] = {...newBillData[index], icms: maskInstance.value};
                                return newBillData;
                            })
                        });
                        masks.push(maskInstance);
                    }
                }
            });
        }
        return () => {
            masks.forEach(mask => mask.destroy());
        }
    }, [calculatorStep, selectedBillCount, libsLoaded.imask, billData]);
    

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
                    currentProcessingIndex++;
                    timer = setTimeout(processNextItem, 1200 + Math.random() * 400);
                } else {
                    setLoadingStep(currentProcessingIndex);
                    timer = setTimeout(() => {
                        setIsCalculating(false);
                        setTimelineFinished(true);
                    }, 600);
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
        if (creditsAvailable > 0) {
            setShowInsufficientCredits(false);
        }
    }, [creditsAvailable]);

    useEffect(() => {
        if (!timelineFinished) {
            return;
        }
        if (calculationPhase === 'success') {
            setCalculatorStep(resultStepIndex);
        } else if (calculationPhase === 'error') {
            setCalculatorStep(confirmationStepIndex);
        }
    }, [timelineFinished, calculationPhase, confirmationStepIndex, resultStepIndex]);

    const calcularMutation = useMutation<CalcularResponse, unknown, BillPayload[]>({
        mutationFn: (payload) => calcular({ bills: payload }),
        onSuccess: (data) => {
            setResultData(data);
            setCalculationError('');
            setCalculationPhase('success');
            setShowInsufficientCredits(false);
            setIsCalculating(false);
            setTimelineFinished(true);
            setLoadingStep(TIMELINE_ITEMS.length);
            void refresh();
        },
        onError: (error) => {
            const message = extractErrorMessage(error);
            setCalculationError(message);
            const normalized = normalizeText(message);
            const mentionsCredit = normalized.includes('credito');
            const mentionsInsufficient =
                normalized.includes('insuficient') ||
                normalized.includes('esgotado') ||
                normalized.includes('disponivel');
            setShowInsufficientCredits(mentionsCredit && mentionsInsufficient);
            setCalculationPhase('error');
            setIsCalculating(false);
            setTimelineFinished(true);
            setLoadingStep(TIMELINE_ITEMS.length);
        },
    });

    const handleBuyCreditsClick = () => {
        setShowInsufficientCredits(false);
        if (onRequestBuyCredits) {
            onRequestBuyCredits();
        }
    };

    const handleGoToHistory = () => {
        setShowInsufficientCredits(false);
        if (onNavigateToHistory) {
            onNavigateToHistory();
        }
    };

    // --- HANDLERS & LOGIC ---
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
        setCalculationPhase('idle');
        setCalculationError('');
        setBillData(prevData => {
            const newData = [...prevData];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    const handleFormNavigation = (direction: 'next' | 'prev') => {
        setCalculationPhase('idle');
        setCalculationError('');
        const currentFormIndex = calculatorStep - 2;
        
        if (direction === 'next') {
            const currentBill = billData[currentFormIndex];
            const dateValid = currentBill?.date && currentBill.date.trim() !== '';
            const icmsValue = parseFloat((currentBill?.icms || '0').replace(/\./g, '').replace(',', '.'));
            const icmsValid = !isNaN(icmsValue) && icmsValue > 0;

            const errors: string[] = [];
            if (!dateValid) errors.push(`date-${currentFormIndex}`);
            if (!icmsValid) errors.push(`icms-${currentFormIndex}`);

            setFormErrors(errors);
            
            if (errors.length > 0) {
                 const formEl = document.getElementById(`form-step-${currentFormIndex}`);
                 formEl?.classList.add('shake');
                 setTimeout(() => formEl?.classList.remove('shake'), 500);
                return;
            }
            if (currentFormIndex === selectedBillCount - 1) {
                setCalculatorStep(calculatorStep + 1);
            } else {
                setCalculatorStep(calculatorStep + 1);
            }

        } else {
            if (currentFormIndex === 0) {
                setCalculatorStep(1);
            } else {
                setCalculatorStep(calculatorStep - 1);
            }
        }
    };
    
    const goToStep = (step: number) => {
        setCalculatorStep(step);
    }
    
    const startCalculation = () => {
        if (isCalculating || calcularMutation.isPending) {
            return;
        }

        setCalculationError("");
        setCalculationPhase("idle");

        if (creditsAvailable <= 0) {
            setCalculationPhase("error");
            setCalculationError(NO_CREDITS_MESSAGE);
            setShowInsufficientCredits(true);
            return;
        }

        const errors: string[] = [];
        const payloadBills: BillPayload[] = billData.map((bill, index) => {
            const issueDate = normalizeDateToIssueDate(bill.date);
            const icmsValue = parseICMSValue(bill.icms);
            if (!issueDate) {
                errors.push("date-" + index);
            }
            if (icmsValue <= 0) {
                errors.push("icms-" + index);
            }
            return {
                icms_value: icmsValue,
                issue_date: issueDate,
            };
        });

        if (errors.length > 0) {
            setFormErrors(errors);
            const firstError = errors[0] ?? "";
            const parts = firstError.split("-");
            const targetIndex = Number(parts[1] ?? "0");
            const fallbackStep = Number.isNaN(targetIndex) ? confirmationStepIndex : 2 + targetIndex;
            setCalculatorStep(fallbackStep);
            setCalculationError("Preencha todos os campos obrigatorios antes de continuar.");
            setCalculationPhase("error");
            return;
        }

        if (payloadBills.length === 0) {
            setCalculationError("Adicione pelo menos uma fatura para prosseguir.");
            setCalculationPhase("error");
            return;
        }

        setFormErrors([]);
        setShowInsufficientCredits(false);
        setCalculationPhase("running");
        setCalculationError("");
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
    
    const getProgress = () => {
        if (calculatorStep === 0) return 0;
        if (calculatorStep === 1) return 25;
        if (calculatorStep >= 2 && calculatorStep < (2 + selectedBillCount)) return 50;
        if (calculatorStep === (2 + selectedBillCount)) return 75;
        if (calculatorStep === (2 + selectedBillCount + 1)) return 90;
        if (calculatorStep === (2 + selectedBillCount + 2)) return 100;
        return 0;
    };


    // --- RENDER LOGIC ---
    const renderCalculatorStep = () => {
        return (
            <>
                {/* Step 0: Welcome */}
                <div id="welcome-step" className={`calculator-step ${calculatorStep === 0 ? 'active' : ''}`}>
                    <div className="welcome-content text-center z-10 p-4">
                        <Title3D>É um prazer tê-lo aqui.</Title3D>
                        <p className="text-slate-600 mt-4 max-w-md mx-auto">Vamos descobrir juntos o valor estimado que você pode ter a receber.</p>
                        <button onClick={() => goToStep(1)} className="start-btn mt-8">Vamos começar</button>
                    </div>
                </div>

                {/* Step 1: Bill Count Selection */}
                <div id="selection-step" className={`calculator-step ${calculatorStep === 1 ? 'active' : ''}`}>
                    <button onClick={() => goToStep(0)} className="back-btn"><ArrowLeft className="w-6 h-6 text-slate-600" /></button>
                    <div className="text-center w-full max-w-4xl">
                       <h2 className="text-3xl font-bold text-slate-800">Você tem quantas contas em mãos?</h2>
                       <p className="text-slate-500 mt-2">Selecione o número de faturas que você usará para a simulação.</p>
                       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 mt-8">
                           {Array.from({ length: 12 }, (_, i) => i + 1).map(count => (
                               <button key={count} onClick={() => handleBillCountSelection(count)} className="bill-option-card flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl cursor-pointer">
                                   <FileText className="w-6 h-6 sm:w-8 sm:h-8 pointer-events-none text-slate-500" />
                                   <span className="text-lg sm:text-xl font-bold pointer-events-none text-slate-700">{count}</span>
                               </button>
                           ))}
                       </div>
                       {showRecommendation && (
                           <div id="recommendation-alert" className="mt-6 max-w-lg mx-auto p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-lg shake">
                               <div className="flex items-start gap-3">
                                   <AlertTriangle className="w-6 h-6 mt-1 text-red-600 flex-shrink-0" />
                                   <div>
                                       <p className="font-bold">Recomendação</p>
                                       <p className="text-sm">Para uma melhor estimativa, recomendamos iniciar com pelo menos três contas.</p>
                                       <div className="mt-3 flex flex-col sm:flex-row items-stretch justify-center gap-3">
                                          <button onClick={handleAcceptRecommendation} className="bg-red-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">Usar 3 faturas</button>
                                          <button onClick={handleContinueAnyway} className="bg-slate-200 text-slate-700 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">Continuar mesmo assim</button>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}
                    </div>
                </div>
                
                {/* Steps 2 to 2+N: Form Steps */}
                {billData.map((_, formIndex) => (
                    <div id={`form-step-${formIndex}`} key={formIndex} className={`calculator-step form-step ${calculatorStep === formIndex + 2 ? 'active' : ''}`}>
                        <button className="back-btn" onClick={() => handleFormNavigation('prev')}><ArrowLeft className="w-6 h-6 text-slate-600" /></button>
                        <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">
                            {/* FORM CONTAINER */}
                            <div className="w-full md:w-1/2 order-2 md:order-1 text-center md:text-left flex flex-col justify-center">
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Fatura {formIndex + 1} de {selectedBillCount}</h2>
                                <p className="text-slate-500 mt-2 mb-6 text-sm sm:text-base">Preencha os dados desta fatura.</p>
                                
                                <div className="input-group">
                                    <CalendarClock className="input-icon w-5 h-5" />
                                    <input 
                                        type="text" 
                                        placeholder="Data da Fatura" 
                                        className={`input-field ${formErrors.includes(`date-${formIndex}`) ? 'border-red-500' : ''}`}
                                        data-field="date"
                                        readOnly
                                     />
                                </div>
                                
                                <div className="input-group mt-4">
                                    <FileText className="input-icon w-5 h-5" />
                                    <input 
                                        type="text" 
                                        placeholder="Valor do ICMS (R$)" 
                                        className={`input-field ${formErrors.includes(`icms-${formIndex}`) ? 'border-red-500' : ''}`}
                                        data-field="icms"
                                     />
                                </div>

                                <button onClick={() => handleFormNavigation('next')} className="mt-6 calculate-btn-premium w-full py-3 font-semibold rounded-lg text-lg">
                                    {formIndex === selectedBillCount - 1 ? 'Finalizar e Confirmar' : 'Próxima Fatura'}
                                </button>
                                <div className="form-error-message text-red-600 text-sm mt-4 h-5">
                                    {formErrors.length > 0 && formErrors.some(e => e.includes(`-${formIndex}`)) && 'Por favor, preencha todos os campos corretamente.'}
                                </div>
                            </div>
                          
                            {/* CAROUSEL CONTAINER */}
                            <div className="w-full md:w-1/2 order-1 md:order-2 mt-8 md:mt-0">
                                 <p className="md:hidden text-sm font-semibold text-slate-600 mb-2 text-center">Dicas Rápidas:</p>
                                 <Carousel slides={CAROUSEL_SLIDES} />
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Confirmation Step */}
                <div id="confirmation-step" className={`calculator-step ${calculatorStep === (2 + selectedBillCount) && selectedBillCount > 0 ? 'active' : ''}`}>
                    <button className="back-btn" onClick={() => setCalculatorStep(calculatorStep - 1)}>
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div className="text-center w-full max-w-lg">
                        <h2 className="text-2xl font-bold text-slate-800">Resumo da Simulação</h2>
                        <p className="text-slate-500 mt-2 mb-6">Confira os dados para prosseguir.</p>
                        <div className="summary-cards-container max-h-60 overflow-y-auto space-y-4 text-left p-4 bg-slate-100 rounded-lg border border-slate-200">
                            {billData.map((data, index) => (
                                <div key={index} className="summary-item border-b border-slate-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                                    <p className="font-bold text-md text-slate-700">Fatura {index + 1}</p>
                                    <div className="flex justify-between items-center mt-1 text-slate-600 text-sm"><span>Data:</span><strong className="font-medium text-slate-800">{data.date || 'N/A'}</strong></div>
                                    <div className="flex justify-between items-center mt-1 text-slate-600 text-sm"><span>ICMS:</span><strong className="font-medium text-slate-800">R$ {data.icms || 'N/A'}</strong></div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center gap-3"><Info className="w-5 h-5 flex-shrink-0" /><span>Esta simulação consumirá <strong>1 crédito</strong> do seu saldo.</span></div>
                        <button
                            onClick={startCalculation}
                            className="calculate-btn-premium w-full mt-6 py-3 text-lg font-semibold rounded-lg disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isCalculating || calcularMutation.isPending}
                        >
                            {calcularMutation.isPending ? "Enviando..." : "Confirmar e Calcular"}
                        </button>
                        {calculationError && calculationPhase === "error" && !showInsufficientCredits && (
                            <p className="mt-4 text-sm font-medium text-red-500" aria-live="polite">
                                {calculationError}
                            </p>
                        )}
                    </div>
                </div>

                {/* Loading Step */}
                <div id="loading-step" className={`calculator-step ${calculatorStep === (2 + selectedBillCount + 1) && selectedBillCount > 0 ? 'active' : ''}`}>
                    <div className="flex flex-col items-center justify-center text-center w-full max-w-md p-4 mx-auto">
                       <h2 className="text-3xl font-bold text-slate-800 mb-8">Processando sua simulação...</h2>
                       <div className="timeline w-full">
                           {TIMELINE_ITEMS.map((item, index) => {
                               const isActive = loadingStep === index;
                               const isCompleted = loadingStep > index;
                               let IconComp = item.icon;
                               if(isCompleted) IconComp = CheckCircle;
                               if(isActive) IconComp = Loader2;

                               return (
                                   <div key={index} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                      <div className="timeline-content flex items-center gap-3">
                                          <IconComp className={`loader-icon w-6 h-6 ${isActive ? 'animate-spin' : ''} ${isCompleted ? 'text-primary-accent' : 'text-slate-400'}`} />
                                          <span className="text-lg text-slate-700">{item.text}</span>
                                      </div>
                                   </div>
                               );
                           })}
                       </div>
                       {calculationError && calculationPhase === "error" && !showInsufficientCredits && (
                           <p className="mt-6 text-sm text-red-300" aria-live="polite">
                               {calculationError}
                           </p>
                       )}
                    </div>
                </div>

                {/* Result Step */}
                <div id="result-step" className={`calculator-step ${calculatorStep === (2 + selectedBillCount + 2) && selectedBillCount > 0 ? 'active' : ''}`}>
                    <Confetti />
                    <div className="result-content text-center">
                        <p className="text-2xl text-slate-600 mb-2">Seu valor estimado de restitui��o �</p>
                        <h2 className="result-value text-6xl md:text-7xl font-bold">{resultData ? currencyFormatter.format(resultData.valor_calculado) : currencyFormatter.format(0)}</h2>
                        {resultData && (
                            <div className="mt-6 space-y-1 text-sm text-slate-200/80">
                                <p>
                                    Cr�ditos restantes: <strong>{resultData.creditos_restantes}</strong>
                                </p>
                                {typeof resultData.processing_time_ms === 'number' && (
                                    <p>Tempo de processamento: {resultData.processing_time_ms} ms</p>
                                )}
                            </div>
                        )}
                        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={resetCalculator} className="bg-slate-200 text-slate-800 font-semibold py-3 px-6 rounded-full transition hover:bg-slate-300">Fazer novo c�lculo</button>
                            <button
                                onClick={() => handleGoToHistory()}
                                className="start-btn disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={!onNavigateToHistory}
                            >
                                Ver hist�rico
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )
    };
    
    const progress = getProgress();
    const progressLabels = ["Seleção", "Preenchimento", "Confirmação", "Resultado"];

    return (
        <>
            {isVisible && libsLoaded.vanta && <VantaBackground />}
            {isVisible && <MouseLight />}
            {isVisible && showInsufficientCredits && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl">
                        <div className="mb-4 flex justify-center">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-900">Cr�ditos insuficientes</h2>
                        <p className="mt-3 text-sm text-slate-600">
                            {calculationError || NO_CREDITS_MESSAGE}
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <button
                                type="button"
                                onClick={handleBuyCreditsClick}
                                className="w-full rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:w-auto"
                            >
                                Comprar cr�ditos
                            </button>
                            {onNavigateToHistory && (
                                <button
                                    type="button"
                                    onClick={handleGoToHistory}
                                    className="w-full rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 sm:w-auto"
                                >
                                    Ver hist�rico
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
            {/* Embedded Global Styles */}
            <style>{`
                @import url('https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css');
                .main-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: clamp(1rem, 2vw, 2rem); position: relative; z-index: 1; }
                #calculate-container { width: min(100%, 1180px); height: min(88vh, 860px); position: relative; perspective: 1000px; background-color: rgba(255, 255, 255, 0.75); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 1.5rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.2); border: 1px solid rgba(255, 255, 255, 0.2); }
                .calculator-step { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: absolute; top: 0; left: 0; padding: 1rem; opacity: 0; visibility: hidden; transform: scale(0.98); transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
                .calculator-step.active { opacity: 1; visibility: visible; z-index: 5; transform: scale(1); }

                .mouse-light { position: fixed; top: 0; left: 0; width: 400px; height: 400px; background: radial-gradient(circle, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0) 60%); border-radius: 50%; pointer-events: none; z-index: 999; transform-origin: center center; margin: -200px 0 0 -200px; transition: transform 0.1s ease-out; }

                .start-btn { position: relative; overflow: hidden; background-color: #0d9488; color: white; padding: 0.75rem 2rem; border-radius: 999px; font-weight: 600; box-shadow: 0 5px 20px rgba(13, 148, 136, 0.3); transition: all 0.3s ease; animation: pulse-glow 2.5s infinite; }
                .start-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(13, 148, 136, 0.4); animation-play-state: paused; }
                .start-btn::after { content: ''; position: absolute; top: 50%; left: 50%; width: 5px; height: 5px; background: rgba(255,255,255,0.7); border-radius: 50%; transform: translate(-50%, -50%) scale(0); transition: transform 0.8s, opacity 0.8s; }
                .start-btn:hover::after { transform: translate(-50%, -50%) scale(100); opacity: 0; }
                @keyframes pulse-glow { 0% { box-shadow: 0 5px 20px rgba(13, 148, 136, 0.3); } 50% { box-shadow: 0 5px 30px rgba(13, 148, 136, 0.4); } 100% { box-shadow: 0 5px 20px rgba(13, 148, 136, 0.3); } }
                .back-btn { position: absolute; top: 1.5rem; left: 1.5rem; background-color: #f1f5f9; border-radius: 50%; padding: 0.5rem; transition: background-color 0.2s; z-index: 10; border: none; cursor: pointer;}
                .back-btn:hover { background-color: #e2e8f0; }
                .bill-option-card { border: 2px solid #e2e8f0; transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); background-color: #f8fafc; }
                .bill-option-card:hover { transform: translateY(-4px); border-color: #0d9488; box-shadow: 0 10px 20px -5px rgba(13, 148, 136, 0.2); }
                .shake { animation: shake-anim 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes shake-anim { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
                .input-field { font-size: 1rem; padding: 0.75rem 1rem 0.75rem 3rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; width: 100%; transition: border-color 0.3s, box-shadow 0.3s; background-color: #ffffff; color: #0f172a; }
                .input-group { position: relative; }
                .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .input-field:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                .flatpickr-calendar { z-index: 10000 !important; }
                .carousel-container { position: relative; overflow: hidden; border-radius: 1rem; background-color: #f1f5f9; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;}
                .carousel-track { display: flex; transition: transform 0.5s ease-in-out; }
                .carousel-slide { flex-shrink: 0; width: 100%; padding: 1rem; text-align: center; }
                .carousel-slide img { max-width: 100%; height: auto; max-height: 150px; margin: 0 auto 0.5rem; object-fit: contain; }
                .carousel-dots { position: absolute; bottom: 0.75rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; }
                .carousel-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background-color: rgba(0,0,0,0.2); transition: background-color 0.3s; cursor: pointer; border: none; padding: 0;}
                .carousel-dot.active { background-color: #3b82f6; }
                .summary-cards-container { scrollbar-width: thin; scrollbar-color: #3b82f6 #e2e8f0; }
                .calculate-btn-premium { position: relative; overflow: hidden; background: linear-gradient(45deg, #0d9488, #3b82f6); color: white; transition: all 0.3s ease; border: none;}
                .calculate-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 7px 20px -5px rgba(13, 148, 136, 0.5); }
                .calculate-btn-premium::after { content: ''; position: absolute; top: 50%; left: 50%; width: 5px; height: 5px; background: rgba(255,255,255,0.7); border-radius: 50%; transform: translate(-50%, -50%) scale(0); transition: transform 0.8s, opacity 0.8s; }
                .calculate-btn-premium:hover::after { transform: translate(-50%, -50%) scale(100); opacity: 0; }
                .timeline { position: relative; padding-left: 2.5rem; text-align: left; }
                .timeline-item { position: relative; padding-bottom: 2rem; }
                .timeline-item::before { content: ''; position: absolute; left: -2.05rem; top: 0.25rem; width: 1.5rem; height: 1.5rem; border-radius: 50%; background-color: #e2e8f0; border: 3px solid #cbd5e1; transition: all 0.5s ease; }
                .timeline-item.completed::before { background-color: #0d9488; border-color: #0d9488; box-shadow: 0 0 10px #0d9488; }
                .timeline-item:not(:last-child)::after { content: ''; position: absolute; left: -1.4rem; top: 1.75rem; bottom: -0.5rem; width: 3px; background-color: #cbd5e1; }
                .timeline-content { opacity: 0.5; transition: opacity 0.5s ease; color: #475569; }
                .timeline-item.active .timeline-content { opacity: 1; }
                .timeline-item.completed .timeline-content { opacity: 1; }
                .loader-icon.animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .result-content { opacity: 0; transform: scale(0.8); animation: result-reveal 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; z-index: 5; position: relative;}
                .result-value { color: #0d9488; text-shadow: 0 0 25px rgba(13, 148, 136, 0.3), 0 0 10px rgba(13, 148, 136, 0.2); animation: result-glow-light 3s infinite alternate; }
                @keyframes result-reveal { to { opacity: 1; transform: scale(1); } }
                @keyframes result-glow-light { from { text-shadow: 0 0 25px rgba(13, 148, 136, 0.3); } to { text-shadow: 0 0 40px rgba(13, 148, 136, 0.5); } }
                .progress-bar-container { width: 100%; max-width: 600px; margin-bottom: 1rem; opacity: 0; transition: opacity 0.5s; }
                .progress-bar-container.visible { opacity: 1; }
                .progress-bar { width: 100%; height: 8px; background-color: #e2e8f0; border-radius: 99px; overflow: hidden; }
                .progress-bar-inner { height: 100%; background-color: #0d9488; transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
                .progress-labels { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.75rem; color: #64748b; }
                .progress-labels span { transition: color 0.5s; }
                .progress-labels span.active { color: #0d9488; font-weight: 600; }
                .confetti-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
                .confetti-piece { position: absolute; width: 8px; height: 16px; background: var(--color); top: -20px; opacity: 0; animation: drop var(--speed)s linear var(--delay)s forwards; }
                @keyframes drop { from { transform: translateY(0) rotate(0); opacity: 1; } to { transform: translateY(90vh) rotate(var(--angle)deg); opacity: 0; } }
            `}</style>

            <div className="main-container font-sans">
                <div className={`progress-bar-container ${calculatorStep > 0 && selectedBillCount > 0 ? 'visible' : ''}`}>
                    <div className="progress-bar">
                        <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="progress-labels">
                        {progressLabels.map((label, index) => {
                            const currentProgressPoint = getProgress();
                            const stepThresholds = [25, 50, 75, 100];
                            const isActive = currentProgressPoint >= stepThresholds[index];
                            return <span key={label} className={isActive ? 'active' : ''}>{label}</span>;
                        })}
                    </div>
                </div>
                <div id="calculate-container">
                    {renderCalculatorStep()}
                </div>
            </div>
        </>
    );
};

export default MainCalculator;



