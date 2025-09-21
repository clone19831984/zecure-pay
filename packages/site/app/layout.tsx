import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import { WalletButton } from "@/components/WalletButton";
import { TabNavigation } from "@/components/TabNavigation";

export const metadata: Metadata = {
  title: "Zama FHEVM SDK Quickstart",
  description: "Zama FHEVM SDK Quickstart app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/@zama-fhe/relayer-sdk@0.2.0/dist/index.umd.js" async></script>
      </head>
      <body className="zama-bg text-foreground antialiased">
        <div className="fixed inset-0 w-full h-full zama-bg z-[-20] min-w-[850px]" />
        
        <main className="flex flex-col max-w-screen-lg mx-auto pb-20 min-w-[850px] min-h-screen">
          <Providers>
            {/* Header */}
            <header className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-screen-lg px-3 md:px-0 h-fit py-5 flex justify-between items-center zama-bg z-50">
              <div className="flex items-center gap-6">
                <Image
                  src="/zama-logo.svg"
                  alt="Zama Logo"
                  width={120}
                  height={120}
                  priority
                />
                <TabNavigation />
              </div>
              <WalletButton />
            </header>

            {/* Main */}
            <div className="main flex-1 w-full overflow-y-auto pb-24 pt-20">
              {children}
            </div>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 w-full py-6 text-center text-sm text-gray-400 bg-zama-bg">
              <p>© 2025 Zama. All rights reserved.</p>
              <div className="flex justify-center gap-4 mt-2">
                <a 
                  href="https://twitter.com/zama_fhe" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  Twitter
                </a>
                <a 
                  href="https://github.com/zama-ai" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
                <a 
                  href="https://zama.ai" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  Website
                </a>
              </div>
            </footer>
          </Providers>
        </main>
      </body>
    </html>
  );
}
