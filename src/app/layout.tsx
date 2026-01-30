import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "TubeMap(튜브맵) - 유튜브 맛집을 지도로 찾기",
  description: "수요미식회, 식객 허영만, 쯔양, 히밥 등 유명 유튜버와 방송에 소개된 맛집을 튜브맵(TubeMap) 지도에서 한눈에 찾아보세요. 전국 검증된 맛집 정보를 제공합니다.",
  keywords: ["튜브맵", "TubeMap", "맛집", "유튜브 맛집", "지도", "수요미식회", "식객 허영만", "쯔양", "히밥", "먹방", "맛집 추천"],
  authors: [{ name: "TubeMap" }],
  openGraph: {
    title: "TubeMap - 유튜브 맛집을 지도로 찾기",
    description: "유명 유튜버와 방송에 소개된 검증된 맛집을 지도에서 쉽게 찾아보세요",
    url: "https://tubemap.kr",
    siteName: "TubeMap",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "E4aDpmJIu_-D6Xjzzz5qg4SH3Z0gZ3uIKRJlm9GFKkE",
    other: {
      "naver-site-verification": ["a0d97b40bed752af0e46f6578daaa45dddc2a604"],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // e.g., ca-pub-123...

  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <head>
        {isAdsenseEnabled && adsenseClient ? (
          <Script
            id="adsense-auto-ads"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
