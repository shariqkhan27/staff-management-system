"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface GlobalSettings {
  companyName: string;
  currency: string;
  timezone: string;
  defaultOvertimeRate: string;
  lateGraceMinutes: string;
  [key: string]: string;
}

const defaultSettings: GlobalSettings = {
  companyName: "Elegance Spaces",
  currency: "PKR",
  timezone: "Asia/Karachi",
  defaultOvertimeRate: "500",
  lateGraceMinutes: "15",
};

const GlobalSettingsContext = createContext<{ settings: GlobalSettings; loading: boolean }>({
  settings: defaultSettings,
  loading: true,
});

export function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/global")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <GlobalSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  return useContext(GlobalSettingsContext);
}
