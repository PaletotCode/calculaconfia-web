"use client";

import { Suspense } from "react";
import AppProviders from "@/components/AppProviders";
import PaymentStatusPage from "../PaymentStatusPage";

export default function PaymentFailurePage() {
  return (
    <AppProviders>
      <Suspense fallback={null}>
        <PaymentStatusPage status="failure" />
      </Suspense>
    </AppProviders>
  );
}
