import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF5733" />
      </head>
      <body>{children}</body>
    </html>
  );
}
