import "@/styles/globals.css";

export const metadata = {
  title: "Visualizer",
  description: "Nova Web Agent Interface",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
