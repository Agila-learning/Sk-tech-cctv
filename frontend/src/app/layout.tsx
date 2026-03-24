import type { Metadata } from "next";
import { Inter, Outfit, Poppins, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/components/providers/LocationProvider';
import GSAPInitializer from '@/components/providers/GSAPInitializer';
import { SocketProvider } from '@/context/SocketContext';
import FloatingActions from '@/components/common/FloatingActions';
import LocationPrompt from '@/components/common/LocationPrompt';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700', '900'], variable: '--font-poppins' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export const metadata: Metadata = {
  title: "SK Technology | Modern Security Solutions",
  description: "Enterprise-grade surveillance and security infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} ${poppins.variable} ${manrope.variable} font-inter antialiased`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <LocationProvider>
                <SocketProvider>
                  <GSAPInitializer />
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                  >
                    {children}
                    <FloatingActions />
                    <LocationPrompt />
                  </ThemeProvider>
                </SocketProvider>
              </LocationProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
