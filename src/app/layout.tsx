import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ILALI | Children's Activities in Cape Town",
    template: "%s | ILALI",
  },
  description:
    "Discover and book trusted children's extramural activities in your community. Every provider is background-checked for your peace of mind.",
  keywords:
    "kids activities cape town, children activities, extramural activities, after school activities, holiday programs, arts for kids, south africa",
  authors: [{ name: "ILALI" }],
  creator: "ILALI",
  publisher: "ILALI",
  openGraph: {
    title: "ILALI",
    description:
      "Find trusted children's activities in Cape Town. Every provider background-checked.",
    url: "https://preview.ilali.co",
    siteName: "ILALI",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ILALI",
    description:
      "Find trusted children's activities in Cape Town. Every provider background-checked.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
