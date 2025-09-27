import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import { WalletButton } from "@/components/WalletButton";
import { TabNavigation } from "@/components/TabNavigation";

export const metadata: Metadata = {
  title: "ZecurePay - Secure Payroll Platform",
  description: "ZecurePay - Secure payroll platform powered by FHE technology",
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
            <header className="fixed top-0 left-0 right-0 w-full h-fit py-5 zama-bg z-50 border-b border-gray-400">
              <div className="max-w-screen-lg mx-auto px-3 md:px-0 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <h1 className="text-3xl font-bold text-white flex items-center h-10">
                    ZecurePay
                  </h1>
                  <TabNavigation />
                </div>
                <WalletButton />
              </div>
            </header>

            {/* Main */}
            <div className="main flex-1 w-full overflow-y-auto pb-24 pt-20">
              {children}
            </div>

            {/* Footer */}
            <footer className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-screen-lg px-3 md:px-0 py-6 flex justify-between items-center text-sm text-gray-400 bg-zama-bg">
              <div className="flex gap-4">
                <a 
                  href="https://x.com/buiminhphat21" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  <button className="p-2 rounded bg-gray-400 hover:bg-orange-500 transition-colors" style={{ borderRadius: '4px' }}>
                    <Image
                      src="/x.svg"
                      alt="Twitter"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </button>
                </a>
                <a 
                  href="https://github.com/clone19831984" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  <button className="p-2 rounded bg-gray-400 hover:bg-orange-500 transition-colors" style={{ borderRadius: '4px' }}>
                    <Image
                      src="/github.svg"
                      alt="GitHub"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </button>
                </a>
                <a 
                  href="https://zama.ai" 
                  target="_blank" 
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  <button className="p-2 rounded bg-gray-400 hover:bg-orange-500 transition-colors" style={{ borderRadius: '4px' }}>
                    <Image
                      src="/discord.svg"
                      alt="Website"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </button>
                </a>
              </div>
              <div className="text-center">
                <p className="text-base text-gray">© 2025 ZecurePay. All rights reserved.</p>
                <p className="text-xs mt-1 text-gray">Secure payroll and private payments powered by Zama&apos;s FHE technology.</p>
              </div>
            </footer>
          </Providers>
        </main>
      </body>
    </html>
  );
}
