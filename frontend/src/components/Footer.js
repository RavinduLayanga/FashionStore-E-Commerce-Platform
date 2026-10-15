export default function Footer() {
  return (
    <footer className="border-t bg-zinc-50 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-zinc-500 space-y-4">
        <p className="text-red-600">
          <strong>Disclaimer:</strong> This website is a technical demonstration
          created by Ravindu Layanga. All products, prices, and inventory are
          simulated for portfolio purposes. Images are sourced from Unsplash for
          illustrative purposes only and do not imply commercial endorsement.
        </p>
        <p className="text-blue-600">
          <strong>Privacy & Cookies:</strong> This demo utilizes necessary
          cookies strictly for application functionality (such as maintaining
          your shopping cart and session). We do not collect, store, or process
          real personal data or financial information. Any data entered during
          the checkout simulation is routinely purged.
        </p>
        <p className="pt-4 border-t border-zinc-200 text-xs">
          © 2026 Ravindu Layanga. All rights reserved (Demo Version).
        </p>
      </div>
    </footer>
  );
}
