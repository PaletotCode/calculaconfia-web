"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LucideIcon } from "@/components/LucideIcon";
import {
  getCreditsBalance,
  getCreditsHistory,
  type CreditHistoryItem,
  type CreditsBalanceResponse,
} from "@/lib/api";
import { parseHistoryMetadata } from "@/utils/history-metadata";
import FullscreenSlides from "./FullscreenSlides";
import FullscreenModal from "./FullscreenModal";
import type { SlidesNavigationStateChange } from "./slides-navigation";

interface CreditsPageProps {
  onRequestBuyCredits?: () => void;
  onSlideStateChange?: SlidesNavigationStateChange;
}

const creditsFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCredits(value: number | undefined) {
  if (typeof value !== "number") return "--";
  const suffix = Math.abs(value) === 1 ? "crédito" : "créditos";
  return `${creditsFormatter.format(value)} ${suffix}`;
}

function formatDate(value: string | undefined | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CreditsPage({ onRequestBuyCredits, onSlideStateChange }: CreditsPageProps) {
  const [showModal, setShowModal] = useState(false);

  const balanceQuery = useQuery<CreditsBalanceResponse>({
    queryKey: ["credits", "balance", "slides"],
    queryFn: getCreditsBalance,
  });

  const historyQuery = useQuery<CreditHistoryItem[]>({
    queryKey: ["credits", "history", "credits"],
    queryFn: () => getCreditsHistory({ limit: 25 }),
  });

  const totalCredits = useMemo(() => {
    const valid = balanceQuery.data?.valid_credits ?? 0;
    const legacy = balanceQuery.data?.legacy_credits ?? 0;
    return valid + legacy;
  }, [balanceQuery.data]);

  const creditTransactions = useMemo(() => {
    if (!historyQuery.data) return [] as CreditHistoryItem[];
    return historyQuery.data
      .filter((item) => item.amount > 0)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [historyQuery.data]);

  const recentCredits = creditTransactions.slice(0, 5);

  const slides = [
    {
      id: "credits-overview",
      ariaLabel: "Visão geral dos créditos",
      content: (
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 text-center">
          <header className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900">Créditos</h2>
            <p className="text-sm text-slate-600 md:text-base">
              Acompanhe seu saldo, visualize o histórico recente e compre novos créditos sem sair desta tela.
            </p>
          </header>

          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-200">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Saldo disponível</p>
              <p className="text-4xl font-bold text-slate-900">
                {balanceQuery.isLoading ? "--" : formatCredits(totalCredits)}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Atualizado automaticamente com base nas últimas movimentações.
            </p>
            <button
              type="button"
              onClick={onRequestBuyCredits}
              className="w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Comprar créditos
            </button>
          </div>
        
          <section className="w-full max-w-xl space-y-4">
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Histórico recente</h3>
              <p className="text-sm text-slate-600">
                Confira as últimas entradas de créditos na sua conta.
              </p>
            </div>
            {historyQuery.isLoading ? (
              <p className="text-sm text-slate-500">Carregando histórico...</p>
            ) : historyQuery.isError ? (
              <p className="text-sm font-semibold text-red-500">Não foi possível carregar o histórico.</p>
            ) : recentCredits.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <LucideIcon name="Wallet" className="h-10 w-10 text-slate-400" />
                <p className="text-sm text-slate-500">Nenhum crédito adicionado recentemente.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recentCredits.map((item) => {
                  const metadata = parseHistoryMetadata(item);
                  const creditsAdded = Math.max(item.amount, 0);
                  const note = item.description || metadata.notes;
                  return (
                    <div key={item.id} className="rounded-2xl bg-white/80 p-4 text-left shadow ring-1 ring-slate-200">
                      <div className="flex flex-col gap-2 text-sm text-slate-600">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{item.transaction_type}</p>
                          <p>{formatDate(item.created_at)}</p>
                        </div>
                        <div className="flex items-end justify-between gap-3">
                          <p className="text-base font-semibold text-amber-600">{formatCredits(creditsAdded)}</p>
                          <p className="text-xs text-slate-500">Saldo após: {formatCredits(item.balance_after ?? 0)}</p>
                        </div>
                      </div>
                      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Ver tudo
            </button>
          </section>
        </div>
      ),
    },
  ];

  return (
    <>
      <FullscreenSlides slides={slides} onSlideStateChange={onSlideStateChange} />
      <FullscreenModal open={showModal} onClose={() => setShowModal(false)} title="Todos os créditos">
        <div className="space-y-3">
          {creditTransactions.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum registro de crédito encontrado.</p>
          ) : (
            creditTransactions.map((item) => {
              const metadata = parseHistoryMetadata(item);
              const creditsAdded = Math.max(item.amount, 0);
              const note = item.description || metadata.notes;
              return (
                <div key={`credit-${item.id}`} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 shadow">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.transaction_type}</p>
                      <p>{formatDate(item.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-amber-600">{formatCredits(creditsAdded)}</p>
                      <p className="text-xs text-slate-500">Saldo após: {formatCredits(item.balance_after ?? 0)}</p>
                    </div>
                  </div>
                  {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
                </div>
              );
            })
          )}
        </div>
      </FullscreenModal>
    </>
  );
}