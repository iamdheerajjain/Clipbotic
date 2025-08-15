import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";
import "@/lib/chunk-loader";
import DevHardReload from "@/components/DevHardReload";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Clipbotic - AI YouTube Short Video Generator",
  description: "Generate AI-powered YouTube short videos up to 20 seconds",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ChunkErrorBoundary>
          <ErrorBoundary>
            <Providers>{children}</Providers>
          </ErrorBoundary>
        </ChunkErrorBoundary>

        {process.env.NODE_ENV === "development" && <DevHardReload />}
      </body>
    </html>
  );
}
