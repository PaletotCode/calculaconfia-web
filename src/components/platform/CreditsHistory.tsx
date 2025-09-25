"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LucideIcon } from "@/components/LucideIcon";
import { getCreditsHistory, type CreditHistoryItem } from "@/lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(value: string | undefined | null) {
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

function formatDate(value: string | undefined | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function CreditsHistory() {
  const historyQuery = useQuery<CreditHistoryItem[]>({
    queryKey: ["credits", "history", "full"],
    queryFn: () => getCreditsHistory(),
  });

  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const sortedHistory = useMemo(() => {
    if (!historyQuery.data) return [] as CreditHistoryItem[];
    return [...historyQuery.data].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [historyQuery.data]);

  const toggleCard = (id: string | number) => {
    setExpandedId((previous) => (previous === id ? null : id));
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-12">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <header className="text-left">
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">Histórico</p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Movimentações de créditos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Consulte todas as transações relacionadas aos seus créditos. Clique em um item para ver detalhes, como descrição completa, saldo após a operação e data de expiração.
          </p>
        </header>

        <div className="flex-1 overflow-hidden rounded-3xl bg-white/80 p-4 shadow-xl ring-1 ring-slate-200 md:p-6">
          {historyQuery.isLoading ? (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-500">
              Carregando histórico...
            </div>
          ) : historyQuery.isError ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-medium text-red-500">Não foi possível carregar o histórico de créditos.</p>
              <button
                type="button"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                onClick={() => historyQuery.refetch()}
              >
                Tentar novamente
              </button>
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
              <LucideIcon name="Inbox" className="h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium text-slate-500">Nenhuma movimentação encontrada.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
              {sortedHistory.map((item) => {
                const isExpanded = expandedId === item.id;
                const amountIsPositive = item.amount >= 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCard(item.id)}
                    className="group flex flex-col gap-3 rounded-2xl bg-slate-50/80 p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 md:text-base">{item.transaction_type}</p>
                        <p className="text-xs text-slate-500 md:text-sm">{formatDateTime(item.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-semibold md:text-lg ${amountIsPositive ? "text-emerald-600" : "text-rose-600"}`}>
                          {amountIsPositive ? "+" : "-"}
                          {formatCurrency(Math.abs(item.amount))}
                        </p>
                        <p className="text-xs text-slate-500">Saldo após: {formatCurrency(item.balance_after)}</p>
                      </div>
                    </div>

                    <div className={`grid gap-3 text-sm text-slate-600 transition-all duration-300 ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70"}`}>
                      <div className="overflow-hidden">
                        <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-100">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                                <LucideIcon name="FileText" className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Descrição</p>
                                <p className="text-sm font-medium text-slate-800">{item.description || "--"}</p>
                              </div>
                            </div>
                            <div className="grid gap-1 text-right text-xs text-slate-500">
                              <span>
                                <span className="font-semibold text-slate-700">Criado em:</span> {formatDateTime(item.created_at)}
                              </span>
                              <span>
                                <span className="font-semibold text-slate-700">Expira em:</span> {formatDate(item.expires_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 text-xs font-medium text-indigo-600">
                      <span>{isExpanded ? "Recolher detalhes" : "Ver detalhes"}</span>
                      <LucideIcon
                        name={isExpanded ? "ChevronUp" : "ChevronDown"}
                        className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}