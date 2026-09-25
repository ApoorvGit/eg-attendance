import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Attendance",
  description: "Personal office-attendance compliance tracker",
  applicationName: "Attendance",
  appleWebApp: {
    // Launches fullscreen with no browser chrome from the iOS home screen.
    capable: true,
    title: "Attendance",
    // Lets the page's own background run under the status bar, so the gradient reaches
    // the top edge in dark mode rather than sitting below a grey bar.
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Deliberately NOT setting maximumScale/userScalable: blocking pinch-zoom fails WCAG
  // 1.4.4 and iOS Safari ignores it anyway. The zoom that actually looked broken was iOS
  // auto-zooming on sub-16px inputs, fixed by sizing those inputs at 16px instead.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
