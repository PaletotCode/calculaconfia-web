import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import AppProviders from "@/components/AppProviders";
import "./globals.css";
import { type ReactNode } from "react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "CalculaConfia - Descubra sua restituição de ICMS",
  description:
    "Calcule de forma rápida e segura o valor estimado que você pode receber de restituição do ICMS da conta de luz.",
  metadataBase: new URL("https://calculaconfia.com.br"),
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
        <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />
      </body>
    </html>
  );
}