export const metadata = {
  title: "Store Admin Portal",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <main>{children}</main>
    </div>
  );
}
