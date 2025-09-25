"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LucideIcon } from "@/components/LucideIcon";
import {
  getCreditsBalance,
  getReferralStats,
  type CreditsBalanceResponse,
  type ReferralStatsResponse,
} from "@/lib/api";

interface CreditsOverviewProps {
  onBuyCredits?: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(value: string | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function CreditsOverview({ onBuyCredits }: CreditsOverviewProps) {
  const balanceQuery = useQuery<CreditsBalanceResponse>({
    queryKey: ["credits", "balance"],
    queryFn: getCreditsBalance,
  });

  const referralQuery = useQuery<ReferralStatsResponse>({
    queryKey: ["referral", "stats"],
    queryFn: getReferralStats,
  });

  const totals = useMemo(() => {
    const valid = balanceQuery.data?.valid_credits ?? 0;
    const legacy = balanceQuery.data?.legacy_credits ?? 0;
    return {
      valid,
      legacy,
      total: valid + legacy,
    };
  }, [balanceQuery.data]);

  const buttonDisabled = balanceQuery.isLoading || balanceQuery.isError;

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-12">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <header className="text-left">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-600">Créditos</p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Gerencie seu saldo e adquira novos créditos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Acompanhe em tempo real o seu saldo disponível, visualize os créditos obtidos por indicação e compre mais créditos sempre que precisar.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-white/80 p-6 shadow-xl ring-1 ring-slate-200">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-slate-900/10" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    <LucideIcon name="Wallet" className="h-4 w-4" />
                    Saldo disponível
                  </span>
                  {balanceQuery.data?.timestamp ? (
                    <span className="text-xs text-slate-500">Atualizado em {formatDateTime(balanceQuery.data.timestamp)}</span>
                  ) : null}
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-slate-900 md:text-5xl">
                    {balanceQuery.isLoading ? (
                      <span className="text-base font-medium text-slate-400">Carregando...</span>
                    ) : balanceQuery.isError ? (
                      <span className="text-base font-medium text-red-500">Erro ao carregar saldo</span>
                    ) : (
                      formatCurrency(totals.total)
                    )}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Créditos válidos: <span className="font-semibold text-emerald-600">{formatCurrency(totals.valid)}</span>
                    {" · "}
                    Créditos legados: <span className="font-semibold text-slate-700">{formatCurrency(totals.legacy)}</span>
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <LucideIcon name="CircleCheck" className="h-5 w-5" />
                    </div>
                    <p>
                      Seus créditos válidos podem ser utilizados imediatamente para novas simulações. Créditos legados ficam reservados para ajustes realizados pela equipe.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onBuyCredits}
                    disabled={!onBuyCredits || buttonDisabled}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:bg-amber-300"
                  >
                    <LucideIcon name="ShoppingCart" className="h-5 w-5" />
                    Comprar créditos
                  </button>
                  <button
                    type="button"
                    onClick={() => balanceQuery.refetch()}
                    className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-white"
                  >
                    <LucideIcon name="RefreshCcw" className="h-4 w-4" />
                    Atualizar saldo
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white/80 p-5 shadow-lg ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <LucideIcon name="Sparkles" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Créditos válidos</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(totals.valid)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Utilize estes créditos para realizar novas simulações imediatamente.
                </p>
              </div>
              <div className="rounded-3xl bg-white/80 p-5 shadow-lg ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600">
                    <LucideIcon name="Layers" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Créditos legados</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(totals.legacy)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Mantemos aqui ajustes e bônus especiais aplicados ao seu histórico.
                </p>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-200">
                <LucideIcon name="Users" className="h-4 w-4" />
                Programa de indicação
              </span>
              <h2 className="text-2xl font-semibold">Compartilhe seu código e ganhe créditos extras</h2>
              <p className="text-sm text-slate-200/80">
                A cada amigo indicado que finalize uma compra, você ganha créditos bônus para utilizar nas próximas simulações.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-5 text-sm">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-200">
                <span>Código</span>
                <span className="font-semibold text-white">
                  {referralQuery.isLoading
                    ? "Carregando..."
                    : referralQuery.isError
                      ? "Indisponível"
                      : referralQuery.data?.referral_code || "--"}
                </span>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span>Total de indicações</span>
                  <span className="font-semibold text-white">
                    {referralQuery.data?.total_referrals ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Créditos ganhos</span>
                  <span className="font-semibold text-emerald-300">
                    {referralQuery.data
                      ? formatCurrency(referralQuery.data.referral_credits_earned)
                      : formatCurrency(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Créditos disponíveis</span>
                  <span className="font-semibold text-amber-200">
                    {referralQuery.data
                      ? formatCurrency(referralQuery.data.referral_credits_remaining)
                      : formatCurrency(0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto rounded-2xl bg-white/10 p-5 text-sm text-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-200">
                  <LucideIcon name="Megaphone" className="h-4 w-4" />
                </div>
                <p>
                  Compartilhe seu código nas redes sociais ou diretamente com amigos para maximizar seus ganhos. Toda indicação aprovada adiciona novos créditos ao seu saldo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}