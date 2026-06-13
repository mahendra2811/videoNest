// Root passthrough layout. The real <html>/<body> live in app/[locale]/layout.tsx
// so the document lang and direction can vary per locale (next-intl, D3).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
