"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { backupLocalBusinessDataToBackend, hasPendingBackendSync, readBusinessData, syncBusinessDataFromBackend, type BusinessData } from "@/lib/business-store";

const hydrationSafeData: BusinessData = {
  products: [],
  categories: [],
  suppliers: [],
  expenses: [],
  debts: [],
  sales: [],
  cart: [],
  customerRequests: []
};

const BusinessDataContext = createContext<BusinessData | null>(null);

export function BusinessDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BusinessData>(hydrationSafeData);

  useEffect(() => {
    const sync = () => setData(readBusinessData());
    sync();
    const hasSessionToken = Boolean(window.localStorage.getItem("paytrack_token"));
    if (!hasSessionToken) {
      window.addEventListener("business-data-change", sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener("business-data-change", sync);
        window.removeEventListener("storage", sync);
      };
    }
    if (hasPendingBackendSync()) {
      void backupLocalBusinessDataToBackend();
      window.addEventListener("business-data-change", sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener("business-data-change", sync);
        window.removeEventListener("storage", sync);
      };
    }

    syncBusinessDataFromBackend()
      .then((backendData) => {
        if (backendData) {
          setData(backendData);
          return;
        }
        return undefined;
      })
      .catch(() => undefined);
    window.addEventListener("business-data-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("business-data-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const value = useMemo(() => data, [data]);

  return createElement(BusinessDataContext.Provider, { value }, children);
}

export function useBusinessData() {
  return useContext(BusinessDataContext) ?? hydrationSafeData;
}
