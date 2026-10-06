import "./globals.css";

export const metadata = {
  title: "Fashion Store | Modern Apparel",
  description: "Clean responsive clothing e-commerce platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
