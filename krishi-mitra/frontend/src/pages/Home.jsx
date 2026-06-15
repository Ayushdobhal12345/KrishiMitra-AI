import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import Card from '../components/Card.jsx'

const FEATURES = [
  {
    icon: '🌿',
    title: 'Crop Disease Diagnosis',
    description: 'Describe symptoms or upload a photo — Krishi Mitra identifies diseases and pests affecting your hill crops in seconds.',
  },
  {
    icon: '🌱',
    title: 'Organic Remedy Guidance',
    description: "Get certified-organic treatment plans tailored to Uttarakhand's mountain climate, without synthetic chemicals.",
  },
  {
    icon: '🍎',
    title: 'Post-Harvest Advisory',
    description: 'Learn best practices for storing rajma, mandua, jhangora, apple, and other produce to minimise loss.',
  },
  {
    icon: '📋',
    title: 'Seasonal Planning',
    description: 'Season-specific guidance on sowing windows, fertilisation schedules, and crop rotation for organic certification.',
  },
  {
    icon: '📎',
    title: 'Document & Image Analysis',
    description: 'Attach soil reports, lab results, or field photos and receive structured advisory responses instantly.',
  },
  {
    icon: '💬',
    title: 'Conversation History',
    description: 'Every chat is saved per supervisor so you can revisit past queries and follow up on ongoing crop issues.',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <Navbar />

      {/* Hero */}
      <section className="bg-forest text-white px-6 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
          <h1 className="font-lora text-3xl md:text-5xl font-semibold leading-tight">
            नमस्ते, Field Supervisor 🙏
          </h1>
          <p className="font-mukta text-base md:text-lg text-white/70 leading-relaxed max-w-xl">
            Krishi Mitra is your AI-powered crop advisory assistant for the organic farms of Uttarakhand.
            Ask about diseases, pests, post-harvest handling, or seasonal planning — in Hindi or English.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 bg-amber hover:bg-amber-light text-white font-mukta font-semibold text-base px-8 py-3 rounded-xl transition-colors duration-150 hover:scale-105 transform"
          >
            Start Advisory Chat →
          </button>
        </div>
      </section>

      {/* Cards grid */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 py-14">
        <h2 className="font-lora text-2xl font-semibold text-forest text-center mb-8">
          What Krishi Mitra Can Help With
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Card key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
