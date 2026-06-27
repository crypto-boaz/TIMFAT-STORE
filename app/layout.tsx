import type { Metadata } from "next";
import { BusinessDataProvider } from "@/lib/use-business-data";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayTrack - Business Management",
  description: "Retail POS, inventory, receipt, ledger, and payment management system for growing businesses"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeScript = `
    (() => {
      try {
        const stored = localStorage.getItem("paytrack_theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", stored ? stored === "dark" : prefersDark);
      } catch {
        document.documentElement.classList.remove("dark");
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <BusinessDataProvider>{children}</BusinessDataProvider>
      </body>
    </html>
  );
}
