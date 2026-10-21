const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <p className="font-semibold text-brand-800">Mangez bio vous épargne de l'hôpital…</p>
        <p className="mt-1 text-sm text-slate-500">© {YEAR} AGRODIFA</p>
      </div>
    </footer>
  )
}
