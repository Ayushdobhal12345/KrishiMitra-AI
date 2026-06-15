export default function Card({ icon, title, description }) {
  return (
    <div className="bg-white border border-forest-border rounded-2xl p-6 flex flex-col gap-3 shadow-card hover:-translate-y-1 hover:shadow-md transition-transform duration-150">
      <div className="text-3xl leading-none">{icon}</div>
      <h3 className="font-lora text-base font-semibold text-forest m-0">{title}</h3>
      <p className="font-mukta text-sm text-gray-500 leading-relaxed m-0">{description}</p>
    </div>
  )
}
