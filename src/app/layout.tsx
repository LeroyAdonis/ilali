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
    "kids activities cape town, children activities, extramural activities, after school activities, holiday programs, arts for kids, ballet classes, drama classes, coding for kids, south africa",
  authors: [{ name: "ILALI" }],
  creator: "ILALI",
  publisher: "ILALI",
  metadataBase: new URL("https://preview.ilali.co"),
  icons: {
    icon: [
      { url: "/images/brand/ilali-logo-38.png", sizes: "38x38", type: "image/png" },
      { url: "/images/brand/ilali-logo-cropped.png", sizes: "778x790", type: "image/png" },
    ],
    apple: "/images/brand/ilali-logo-cropped.png",
  },
  openGraph: {
    title: "ILALI",
    description:
      "Discover and book trusted children's arts and cultural activities in Cape Town. Find ballet, drama, art classes, coding workshops and more for kids aged 3-18.",
    url: "https://preview.ilali.co",
    siteName: "ILALI",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/images/brand/ilali-logo-cropped.png",
        width: 778,
        height: 790,
        alt: "ILALI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ILALI",
    description:
      "Discover and book trusted children's arts and cultural activities in Cape Town. Find ballet, drama, art classes, coding workshops and more for kids aged 3-18.",
    images: ["/images/brand/ilali-logo-cropped.png"],
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
