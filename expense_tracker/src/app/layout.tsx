import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Auspify Expense Tracker | Master Your Personal Finances",
    template: "%s | Auspify Expense Tracker",
  },
  description:
    "Production-grade personal finance and cash flow intelligence platform. Real-time MongoDB aggregations, automated budget alerts, and total privacy with isolated multi-tenant storage.",
  keywords: [
    "Expense Tracker",
    "Personal Finance",
    "Budget Manager",
    "Cash Flow Intelligence",
    "MongoDB Aggregations",
    "Financial Dashboard",
  ],
  authors: [{ name: "Auspify" }],
  creator: "Auspify",
  publisher: "Auspify",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "Auspify Expense Tracker | Master Your Personal Finances",
    description:
      "Production-grade personal finance with sub-second MongoDB aggregations, integer monetary precision, and automated budget caps.",
    siteName: "Auspify Expense Tracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auspify Expense Tracker",
    description:
      "Production-grade personal finance with sub-second MongoDB aggregations and automated budget caps.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F3" },
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Auspify Expense Tracker",
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  description:
    "Enterprise-grade multi-tenant expense tracker with sub-second MongoDB aggregations and automated budget alerts.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
