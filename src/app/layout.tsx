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

export const metadata: Metadata = {
  title: "TubeMap - 유튜브 맛집을 지도로 찾기",
  description: "수요미식회, 식객 허영만, 쯔양, 히밥 등 유명 유튜버와 방송에 소개된 맛집을 지도에서 한눈에 찾아보세요. 전국 검증된 맛집 정보를 제공합니다.",
  keywords: ["맛집", "유튜브 맛집", "지도", "수요미식회", "식객 허영만", "쯔양", "히밥", "먹방", "맛집 추천", "TubeMap"],
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
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
