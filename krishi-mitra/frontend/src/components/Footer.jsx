export default function Footer() {
  return (
    <footer className="bg-forest text-parchment mt-auto">
      <div className="max-w-4xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mukta text-sm">
        <span className="font-bold text-base text-amber-light">🌾 Krishi Mitra</span>
        <span className="text-white/50 flex-1">Mandakini Organic Produce Collective · Uttarakhand</span>
        <span className="text-white/30 text-xs whitespace-nowrap">
          © {new Date().getFullYear()} · AI Advisory Tool · For field use only
        </span>
      </div>
    </footer>
  )
}
