import "@/styles/globals.css";

export const metadata = {
  title: "ThinkOva",
  description: "Ask a question. Watch the web teach you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
