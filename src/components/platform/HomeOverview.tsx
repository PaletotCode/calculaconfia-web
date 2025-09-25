"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LucideIcon } from "@/components/LucideIcon";
import {
  getCreditsBalance,
  getCreditsHistory,
  getReferralStats,
  type CreditHistoryItem,
  type CreditsBalanceResponse,
  type ReferralStatsResponse,
} from "@/lib/api";

type CalculatorSection = "Home" | "calculate" | "history" | "credits";

interface HomeOverviewProps {
  onNavigate?: (section: CalculatorSection) => void;
  historyLimit?: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function HomeOverview({ onNavigate, historyLimit = 4 }: HomeOverviewProps) {
  const balanceQuery = useQuery<CreditsBalanceResponse>({
    queryKey: ["credits", "balance"],
    queryFn: getCreditsBalance,
  });

  const referralQuery = useQuery<ReferralStatsResponse>({
    queryKey: ["referral", "stats"],
    queryFn: getReferralStats,
  });

  const historyQuery = useQuery<CreditHistoryItem[]>({
    queryKey: ["credits", "history", "home", historyLimit],
    queryFn: () => getCreditsHistory({ limit: historyLimit }),
  });

  const totalCredits = useMemo(() => {
    const valid = balanceQuery.data?.valid_credits ?? 0;
    const legacy = balanceQuery.data?.legacy_credits ?? 0;
    return valid + legacy;
  }, [balanceQuery.data]);

  const recentHistory = useMemo(() => {
    if (!historyQuery.data) return [] as CreditHistoryItem[];
    return [...historyQuery.data]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, historyLimit);
  }, [historyQuery.data, historyLimit]);

  const handleNavigate = (section: CalculatorSection) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-12">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2 text-left">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-600">Visão geral</p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Bem-vindo de volta à CalculaConfia</h1>
          <p className="max-w-2xl text-sm text-slate-600 md:text-base">
            Acompanhe seu saldo, suas indicações e as últimas movimentações de créditos em um só lugar. Clique em qualquer card para acessar a visão detalhada.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleNavigate("credits")}
            className="group relative overflow-hidden rounded-3xl bg-white/80 p-6 text-left shadow-xl ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-slate-900/10 opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                  <LucideIcon name="Wallet" className="h-4 w-4" />
                  Saldo atual
                </span>
                <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                  {balanceQuery.isLoading ? (
                    <span className="text-base font-medium text-slate-400">Carregando...</span>
                  ) : balanceQuery.isError ? (
                    <span className="text-base font-medium text-red-500">Erro ao carregar</span>
                  ) : (
                    formatCurrency(totalCredits)
                  )}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {balanceQuery.data ? (
                    <>
                      {formatCurrency(balanceQuery.data.valid_credits)} em créditos ativos e {formatCurrency(balanceQuery.data.legacy_credits)} em créditos legados.
                    </>
                  ) : (
                    "Veja detalhes completos em Créditos."
                  )}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 transition group-hover:bg-teal-500/20">
                <LucideIcon name="PiggyBank" className="h-7 w-7" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("credits")}
            className="group relative overflow-hidden rounded-3xl bg-white/80 p-6 text-left shadow-xl ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-slate-900/10 opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  <LucideIcon name="Users" className="h-4 w-4" />
                  Indicações
                </span>
                <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                  {referralQuery.isLoading ? (
                    <span className="text-base font-medium text-slate-400">Carregando...</span>
                  ) : referralQuery.isError ? (
                    <span className="text-base font-medium text-red-500">Erro ao carregar</span>
                  ) : (
                    `${referralQuery.data?.total_referrals ?? 0} indicações`
                  )}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {referralQuery.data ? (
                    <>
                      Código <span className="font-semibold text-purple-600">{referralQuery.data.referral_code || "--"}</span> · {formatCurrency(referralQuery.data.referral_credits_earned)} ganhos
                    </>
                  ) : (
                    "Convide amigos e acompanhe seus resultados."
                  )}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 transition group-hover:bg-purple-500/20">
                <LucideIcon name="Gift" className="h-7 w-7" />
              </div>
            </div>
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <button
            type="button"
            onClick={() => handleNavigate("history")}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white/80 p-6 text-left shadow-xl ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-slate-900/10 opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <LucideIcon name="History" className="h-4 w-4" />
                    Histórico recente
                  </span>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-900 md:text-3xl">Movimentações de créditos</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 transition group-hover:bg-indigo-500/20">
                  <LucideIcon name="Activity" className="h-6 w-6" />
                </div>
              </div>

              <div className="relative mt-2 space-y-3">
                {historyQuery.isLoading ? (
                  <p className="text-sm text-slate-500">Carregando movimentações...</p>
                ) : historyQuery.isError ? (
                  <p className="text-sm font-medium text-red-500">Não foi possível carregar o histórico.</p>
                ) : recentHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma movimentação registrada recentemente.</p>
                ) : (
                  recentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50/70 px-4 py-3 text-sm transition group-hover:bg-white/90"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{item.transaction_type}</p>
                        <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${item.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {item.amount >= 0 ? "+" : ""}
                          {formatCurrency(Math.abs(item.amount))}
                        </p>
                        <p className="text-xs text-slate-500">Saldo: {formatCurrency(item.balance_after)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between pt-2 text-sm text-indigo-600">
                <span className="font-medium">Ver histórico completo</span>
                <LucideIcon name="ArrowUpRight" className="h-5 w-5" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate("calculate")}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-slate-900 p-6 text-left text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.45),transparent_55%)] opacity-60 transition group-hover:opacity-90" />
            <div className="relative flex flex-col gap-4">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-200">
                <LucideIcon name="Calculator" className="h-4 w-4" />
                Pronto para calcular?
              </span>
              <h2 className="text-2xl font-semibold leading-tight md:text-3xl">
                Inicie uma nova simulação e descubra o quanto você pode recuperar.
              </h2>
              <p className="text-sm text-slate-200/80">
                Leva menos de cinco minutos para cadastrar suas contas e gerar uma estimativa personalizada.
              </p>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm font-semibold text-teal-200">
              <span>Ir para calculadora</span>
              <LucideIcon name="ArrowRight" className="h-5 w-5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}