import "./globals.css";
import Navbar from "../components/Navbar";
import Providers from "../components/Providers";
import Footer from "../components/Footer";

export const metadata = {
  title: "Fashion Store | Modern Apparel",
  description: "Clean responsive clothing e-commerce platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
