import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransitFlow - 대중교통 시간표 환승 및 실시간 알림",
  description: "시간표 기반의 대중교통 최적 환승 매칭 및 실시간 정상/주의/긴급 3단계 돌발 상황 알림 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

