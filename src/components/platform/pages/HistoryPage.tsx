"use client";

import React, { useCallback, useMemo, useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { ReactNode, TouchEvent, WheelEvent, FC } from "react";
import clsx from "clsx";

// --- START: Inlined Dependencies for Preview ---

// From: slides-navigation.ts
export interface SlidesNavigationState {
  goToNext(): void;
  goToPrevious(): void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  activeIndex: number;
  totalSlides: number;
}
export type SlidesNavigationStateChange = (state: SlidesNavigationState | null) => void;


// From: FullscreenSlides.tsx
export type Slide = {
  id: string;
  content: ReactNode;
  ariaLabel?: string;
};

export interface FullscreenSlidesProps {
  slides: Slide[];
  initial?: number;
  onChange?(index: number): void;
  onSlideStateChange?: SlidesNavigationStateChange;
}

const SWIPE_THRESHOLD = 48;
const WHEEL_THRESHOLD = 48;
const WHEEL_COOLDOWN_MS = 400;

export interface FullscreenSlidesHandle {
  goToIndex(index: number): void;
  goToNext(): void;
  goToPrevious(): void;
  getActiveIndex(): number;
}

const FullscreenSlides = forwardRef<FullscreenSlidesHandle, FullscreenSlidesProps>(
  ({ slides, initial = 0, onChange, onSlideStateChange }, ref) => {
    const sanitizedSlides = useMemo(() => slides.filter(Boolean), [slides]);
    const [activeIndex, setActiveIndex] = useState(() => {
      if (sanitizedSlides.length === 0) return 0;
      return Math.min(Math.max(initial, 0), sanitizedSlides.length - 1);
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartY = useRef<number | null>(null);
    const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
    const lastWheelAt = useRef(0);
    const isWheelLocked = useRef(false);
    const wheelUnlockTimeout = useRef<NodeJS.Timeout | null>(null);

    const goToIndex = useCallback(
      (index: number) => {
        if (sanitizedSlides.length === 0) return;
        setActiveIndex((previous) => {
          const clamped = Math.min(Math.max(index, 0), sanitizedSlides.length - 1);
          return clamped === previous ? previous : clamped;
        });
      },
      [sanitizedSlides.length],
    );

    const goToNext = useCallback(() => goToIndex(activeIndex + 1), [activeIndex, goToIndex]);
    const goToPrevious = useCallback(() => goToIndex(activeIndex - 1), [activeIndex, goToIndex]);

    useEffect(() => {
      if (sanitizedSlides.length === 0) {
        onSlideStateChange?.(null);
        return;
      }
      const clamped = Math.min(Math.max(activeIndex, 0), sanitizedSlides.length - 1);
      if (clamped !== activeIndex) {
        setActiveIndex(clamped);
        return;
      }
      onChange?.(clamped);
      const navigationState: SlidesNavigationState = {
        goToNext,
        goToPrevious,
        canGoNext: clamped < sanitizedSlides.length - 1,
        canGoPrevious: clamped > 0,
        activeIndex: clamped,
        totalSlides: sanitizedSlides.length,
      };
      onSlideStateChange?.(navigationState);
    }, [activeIndex, goToNext, goToPrevious, onChange, onSlideStateChange, sanitizedSlides.length]);

    useImperativeHandle(ref, () => ({
        goToIndex,
        goToNext,
        goToPrevious,
        getActiveIndex: () => activeIndex,
      }), [activeIndex, goToIndex, goToNext, goToPrevious]);
    
    const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
        if (sanitizedSlides.length === 0 || isWheelLocked.current) return;
        if (Math.abs(event.deltaY) > WHEEL_THRESHOLD) {
            if (event.deltaY > 0) goToNext();
            else goToPrevious();
            isWheelLocked.current = true;
            setTimeout(() => { isWheelLocked.current = false; }, WHEEL_COOLDOWN_MS);
        }
    }, [goToNext, goToPrevious, sanitizedSlides.length]);

    if (sanitizedSlides.length === 0) return null;

    return (
      <div
        ref={containerRef}
        className="relative flex h-full w-full flex-col"
        role="group"
        aria-roledescription="carousel"
        tabIndex={0}
        onWheel={handleWheel}
      >
        <div className="relative h-full w-full overflow-hidden">
          {sanitizedSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={clsx(
                "absolute inset-0 flex h-full w-full flex-col items-center justify-center p-6 text-center transition-transform duration-500 ease-out",
                index === activeIndex ? "opacity-100" : "opacity-0",
              )}
              style={{ transform: `translateY(${(index - activeIndex) * 100}%)` }}
              role="group"
              aria-roledescription="slide"
              aria-label={slide.ariaLabel}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
FullscreenSlides.displayName = "FullscreenSlides";

// From: FullscreenModal.tsx (Placeholder)
interface FullscreenModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const FullscreenModal: FC<FullscreenModalProps> = ({ open, onClose, title, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-2xl">&times;</button>
                </header>
                <main className="p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
};


// From: LucideIcon (Placeholder)
interface LucideIconProps {
    name: string;
    className?: string;
}
const LucideIcon: FC<LucideIconProps> = ({ name, className }) => (
    <div className={className}>
        {name === 'Inbox' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>}
    </div>
);


// Mock API and Utils
type CreditHistoryItem = {
    id: string;
    created_at: string;
    transaction_type: string;
    amount: number;
    description?: string;
    metadata?: any;
};

const MOCK_HISTORY_DATA: CreditHistoryItem[] = Array.from({ length: 18 }, (_, i) => ({
    id: `id_${i}`,
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    transaction_type: i % 3 === 0 ? "Compra de Créditos" : "Cálculo de Tributo",
    amount: i % 3 === 0 ? 50 + i : - (2 + (i % 5)),
    description: i % 3 !== 0 ? `Simulação para cliente ${String.fromCharCode(65 + i)}` : undefined,
    metadata: {
        calculationValue: i % 3 !== 0 ? (2 + (i % 5)) * 1234.56 : 0,
        creditsUsed: i % 3 !== 0 ? 2 + (i % 5) : 0,
    }
}));

const parseHistoryMetadata = (item: CreditHistoryItem) => item.metadata || {};

// --- END: Inlined Dependencies ---


// --- Props Interface ---
interface HistoryPageProps {
  onSlideStateChange?: SlidesNavigationStateChange;
}

// --- Helper Formatters ---
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const creditsFormatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatCredits(value: number) {
    return creditsFormatter.format(value);
}

function formatDateTime(value: string | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

// --- SVG Icons for New UI ---
const CalculatorIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><line x1="16" y1="10" x2="12" y2="10" /><line x1="12" y1="10" x2="12" y2="18" /><line x1="8" y1="10" x2="8" y2="18" /></svg>);
const BoltIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
const ChevronDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><polyline points="6 9 12 15 18 9"></polyline></svg>);

// --- Components for New UI ---
interface StatCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon: ReactNode;
    valueColorClass: string;
    borderColorClass: string;
}
const StatCard: FC<StatCardProps> = ({ title, value, subtext, icon, valueColorClass, borderColorClass }) => (
    <div className={`bg-white rounded-2xl flex-1 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 border-t-4 ${borderColorClass}`}>
        <div className="p-6">
            <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100">{icon}</div>
            </div>
            <div className="mt-5">
                <p className={`text-5xl font-bold ${valueColorClass}`}>{value}</p>
                <p className="text-sm text-slate-500 mt-2">{subtext}</p>
            </div>
        </div>
    </div>
);

interface ScrollIndicatorProps {
    onClick: () => void;
}
const ScrollIndicator: FC<ScrollIndicatorProps> = ({ onClick }) => (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer" onClick={onClick}>
        <div className="animate-pulse-down"><ChevronDownIcon /></div>
    </div>
);

// --- Main Page Component ---
export default function HistoryPage({ onSlideStateChange }: HistoryPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [historyData, setHistoryData] = useState<CreditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const slidesRef = useRef<FullscreenSlidesHandle>(null);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setHistoryData(MOCK_HISTORY_DATA);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const sortedHistory = useMemo(() => {
    if (!historyData) return [];
    return [...historyData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [historyData]);
  
  const recentHistory = sortedHistory.slice(0, 5);

  const calculateStats = useCallback((items: CreditHistoryItem[]) => {
    return items.reduce((accumulator, item) => {
        const metadata = parseHistoryMetadata(item);
        const recovered = Math.max(metadata.calculationValue ?? 0, 0);
        const credits = Math.max(metadata.creditsUsed ?? 0, 0);
        return {
          totalRecovered: accumulator.totalRecovered + recovered,
          totalCreditsUsed: accumulator.totalCreditsUsed + credits,
        };
      }, { totalRecovered: 0, totalCreditsUsed: 0 });
  }, []);
  
  const overallStats = useMemo(() => calculateStats(sortedHistory), [calculateStats, sortedHistory]);
  const averageRecovered = sortedHistory.length ? overallStats.totalRecovered / sortedHistory.length : 0;

  const slides = [
    {
      id: "history-summary",
      ariaLabel: "Resumo do histórico",
      content: (
        <div className="relative flex items-center justify-center min-h-screen w-screen bg-gradient-to-br from-gray-50 to-slate-100 font-sans p-4 overflow-hidden">
            <style>{`@keyframes pulse-down { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(10px); opacity: 0.5; } } .animate-pulse-down { animation: pulse-down 2.5s ease-in-out infinite; }`}</style>
            <main className="w-full max-w-4xl mx-auto text-center">
                <header className="mb-12"><h1 className="text-5xl font-bold text-slate-800 tracking-tight">Histórico de Cálculos</h1><p className="text-slate-600 mt-3 max-w-lg mx-auto">Visualize métricas consolidadas e explore os detalhes de cada simulação.</p></header>
                <section className="flex flex-col md-flex-row gap-8">
                    <StatCard title="TOTAL DE CÁLCULOS" value={isLoading ? '...' : sortedHistory.length} subtext="Total de registros processados." icon={<CalculatorIcon />} valueColorClass="text-slate-800" borderColorClass="border-indigo-500" />
                    <StatCard title="CRÉDITOS UTILIZADOS" value={isLoading ? '...' : formatCredits(overallStats.totalCreditsUsed)} subtext="Total de créditos consumidos." icon={<BoltIcon />} valueColorClass="text-sky-600" borderColorClass="border-sky-500" />
                </section>
            </main>
            <ScrollIndicator onClick={() => slidesRef.current?.goToNext()} />
        </div>
      ),
    },
    {
      id: "history-details",
      ariaLabel: "Detalhes e estatísticas do histórico",
      content: (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="w-full space-y-6">
            <header className="space-y-2"><h2 className="text-2xl font-semibold text-slate-900">Últimos cálculos</h2><p className="text-sm text-slate-600">Revise os cinco registros mais recentes.</p></header>
            <div className="grid gap-3">
              {isLoading ? (<p className="text-sm text-slate-500">Carregando histórico...</p>) : recentHistory.length === 0 ? (<div className="flex flex-col items-center gap-3 text-center"><LucideIcon name="Inbox" className="h-10 w-10 text-slate-400" /><p className="text-sm text-slate-500">Nenhum registro disponível.</p></div>) : (recentHistory.map((item) => {
                  const metadata = parseHistoryMetadata(item);
                  const recovered = metadata.calculationValue ?? Math.max(item.amount, 0);
                  const creditsUsed = metadata.creditsUsed ?? Math.abs(item.amount);
                  return (<div key={item.id} className="rounded-2xl bg-white/80 p-4 text-left shadow ring-1 ring-slate-200"><div className="flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between"><div><p className="text-base font-semibold text-slate-900">{item.transaction_type}</p><p>{formatDateTime(item.created_at)}</p></div><div className="text-right"><p className="text-base font-semibold text-emerald-600">{currencyFormatter.format(Math.max(recovered, 0))}</p><p className="text-xs text-slate-500">Créditos: {creditsFormatter.format(creditsUsed)}</p></div></div></div>);
                }))}
            </div>
            <button type="button" onClick={() => setShowModal(true)} className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 focus-visible:outline-none">Ver tudo</button>
          </div>
          <div className="w-full space-y-5">
            <header className="space-y-2"><h2 className="text-2xl font-semibold text-slate-900">Insights rápidos</h2><p className="text-sm text-slate-600">Indicadores para suas próximas ações.</p></header>
            <div className="grid gap-4">
              <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket médio</p><p className="mt-2 text-2xl font-semibold text-slate-900">{currencyFormatter.format(averageRecovered)}</p><p className="mt-1 text-xs text-slate-500">Baseado em {sortedHistory.length} simulações.</p></div>
               <div className="rounded-2xl bg-white/80 p-5 shadow ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valor Total Recuperado</p><p className="mt-2 text-2xl font-semibold text-emerald-600">{currencyFormatter.format(overallStats.totalRecovered)}</p><p className="mt-1 text-xs text-slate-500">Somatório desde o início.</p></div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <FullscreenSlides ref={slidesRef} slides={slides} onSlideStateChange={onSlideStateChange} />
      <FullscreenModal open={showModal} onClose={() => setShowModal(false)} title="Todos os cálculos">
        <div className="space-y-3">
          {sortedHistory.length === 0 ? (<p className="text-sm text-slate-500">Sem registros para exibir.</p>) : (sortedHistory.map((item) => {
              const metadata = parseHistoryMetadata(item);
              const recovered = metadata.calculationValue ?? Math.max(item.amount, 0);
              const creditsUsed = metadata.creditsUsed ?? Math.abs(item.amount);
              return (<div key={`modal-${item.id}`} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 shadow"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="text-base font-semibold text-slate-900">{item.transaction_type}</p><p>{formatDateTime(item.created_at)}</p></div><div className="text-right"><p className="text-base font-semibold text-emerald-600">{currencyFormatter.format(Math.max(recovered, 0))}</p><p className="text-xs text-slate-500">Créditos: {creditsFormatter.format(creditsUsed)}</p></div></div>{item.description && <p className="mt-2 text-xs text-slate-500">{item.description}</p>}</div>);
            }))}
        </div>
      </FullscreenModal>
    </>
  );
}