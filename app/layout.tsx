import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarmLedger — Farm Inventory & Expenses",
  description: "Bilingual farm stock, usage and expense management."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
