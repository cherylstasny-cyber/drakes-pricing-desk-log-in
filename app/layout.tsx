import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Drake's Pricing Desk",
  description: 'Private real estate pricing intelligence workspace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
