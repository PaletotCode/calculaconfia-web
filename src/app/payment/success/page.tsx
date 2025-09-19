"use client";

import { Suspense } from "react";
import AppProviders from "@/components/AppProviders";
import PaymentStatusPage from "../PaymentStatusPage";

export default function PaymentSuccessPage() {
  return (
    <AppProviders>
      <Suspense fallback={null}>
        <PaymentStatusPage status="success" />
      </Suspense>
    </AppProviders>
  );
}
