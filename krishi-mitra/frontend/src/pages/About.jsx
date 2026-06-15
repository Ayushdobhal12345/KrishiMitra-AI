import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-14 flex flex-col gap-5">
        <h1 className="font-lora text-3xl md:text-4xl font-semibold text-forest">About Krishi Mitra</h1>
        <p className="font-mukta text-base text-gray-500 leading-relaxed">
          Krishi Mitra is an AI-powered crop advisory platform built for the field supervisors of the
          Mandakini Organic Produce Collective in Uttarakhand. It provides real-time guidance on crop
          diseases, organic remedies, pest management, post-harvest handling, and seasonal planning —
          tailored specifically to the mountain agro-climatic zone of the Central Himalayas.
        </p>
        <p className="font-mukta text-base text-gray-500 leading-relaxed">
          All recommendations are generated with certified-organic inputs in mind and are intended
          as a first-response advisory tool. Supervisors are always encouraged to verify findings
          with the nearest KVK (Krishi Vigyan Kendra) or a licensed Agricultural Extension Officer
          before large-scale application.
        </p>
      </main>
      <Footer />
    </div>
  )
}
