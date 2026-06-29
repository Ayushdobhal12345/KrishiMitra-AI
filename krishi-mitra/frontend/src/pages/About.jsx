import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const CROPS = [
  { name: 'Rajma', hindi: 'राजमा', emoji: '🫘' },
  { name: 'Mandua', hindi: 'मंडुआ', emoji: '🌾' },
  { name: 'Jhangora', hindi: 'झंगोरा', emoji: '🌿' },
  { name: 'Potato', hindi: 'आलू', emoji: '🥔' },
  { name: 'Garlic', hindi: 'लहसुन', emoji: '🧄' },
  { name: 'Apple', hindi: 'सेब', emoji: '🍎' },
  { name: 'Ginger', hindi: 'अदरक', emoji: '🫚' },
  { name: 'Amaranth', hindi: 'चौलाई', emoji: '🌱' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Describe the problem',
    desc: 'Type your crop issue in Hindi or English, or attach a field photo, soil report, or CSV data for analysis.',
  },
  {
    step: '02',
    title: 'AI analyses & diagnoses',
    desc: 'Krishi Mitra uses Google Gemini AI trained on mountain agri-context to identify diseases, pests, or deficiencies.',
  },
  {
    step: '03',
    title: 'Get structured guidance',
    desc: 'Receive a diagnosis, immediate action steps, organic remedies using locally available inputs, and severity rating.',
  },
  {
    step: '04',
    title: 'Verify & apply',
    desc: 'Always cross-check critical advice with your nearest KVK or licensed Agricultural Extension Officer before large-scale application.',
  },
]

const ZONES = [
  { range: '700–1500m', label: 'Lower Hills', crops: 'Ginger, garlic, tomato, mustard' },
  { range: '1500–2200m', label: 'Mid Hills', crops: 'Rajma, potato, apple, pear' },
  { range: '2200m+', label: 'Upper Hills', crops: 'Mandua, jhangora, amaranth, stone fruits' },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <Navbar />

      {/* Hero */}
      <section className="bg-forest text-white px-6 py-14 md:py-18">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <span className="font-mukta text-xs tracking-widest uppercase text-white/50">About Krishi Mitra</span>
          <h1 className="font-lora text-3xl md:text-4xl font-semibold leading-snug">
            AI-powered crop advisory for Uttarakhand's organic mountain farmers
          </h1>
          <p className="font-mukta text-base text-white/70 leading-relaxed max-w-2xl">
            Krishi Mitra is a field advisory tool built for the supervisors of the
            <strong className="text-white/90"> Mandakini Organic Produce Collective</strong> in the
            Central Himalayas. It combines Google Gemini AI with deep agri-context specific to
            Uttarakhand's mountain climate zones, crop varieties, and organic farming practices.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 self-start bg-amber hover:bg-amber-light text-white font-mukta font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors duration-150"
          >
            Open Advisory Chat →
          </button>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-4">
        <span className="font-mukta text-xs tracking-widest uppercase text-gray-400">Our Mission</span>
        <h2 className="font-lora text-2xl font-semibold text-forest">
          Bringing expert agricultural knowledge to every field supervisor
        </h2>
        <p className="font-mukta text-base text-gray-500 leading-relaxed">
          Mountain farmers in Uttarakhand face unique challenges — erratic rainfall, thin soils, altitude-specific pests,
          and limited access to agricultural extension services. Krishi Mitra bridges this gap by providing
          instant, contextual, organic-first advisory guidance available 24/7, even in low-connectivity conditions.
        </p>
        <p className="font-mukta text-base text-gray-500 leading-relaxed">
          The platform is designed specifically for field supervisors managing multiple farms across the
          Mandakini valley. Every response is tailored to the organic certification requirements of the
          Collective — no synthetic chemicals, no generic advice.
        </p>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-forest-border px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <span className="font-mukta text-xs tracking-widest uppercase text-gray-400">How it works</span>
          <h2 className="font-lora text-2xl font-semibold text-forest mt-2 mb-8">From field problem to action plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="font-lora text-3xl font-semibold text-forest/20 leading-none flex-shrink-0 w-10">{step}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-mukta text-sm font-semibold text-forest">{title}</h3>
                  <p className="font-mukta text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Altitude zones */}
      <section className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-4">
        <span className="font-mukta text-xs tracking-widest uppercase text-gray-400">Coverage</span>
        <h2 className="font-lora text-2xl font-semibold text-forest">Three altitude zones, one platform</h2>
        <p className="font-mukta text-sm text-gray-500 leading-relaxed mb-2">
          Krishi Mitra understands the distinct agro-climatic differences across Uttarakhand's elevation bands.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ZONES.map(({ range, label, crops }) => (
            <div key={range} className="bg-white border border-forest-border rounded-xl p-4 flex flex-col gap-1.5">
              <span className="font-lora text-lg font-semibold text-forest">{range}</span>
              <span className="font-mukta text-xs font-semibold text-forest/60 uppercase tracking-wide">{label}</span>
              <span className="font-mukta text-xs text-gray-500 leading-relaxed mt-1">{crops}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Supported crops */}
      <section className="bg-white border-y border-forest-border px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <span className="font-mukta text-xs tracking-widest uppercase text-gray-400">Crops covered</span>
          <h2 className="font-lora text-2xl font-semibold text-forest mt-2 mb-6">
            Specialised in Uttarakhand hill crops
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CROPS.map(({ name, hindi, emoji }) => (
              <div key={name} className="bg-parchment border border-forest-border rounded-xl px-4 py-3 flex flex-col gap-0.5">
                <span className="text-xl">{emoji}</span>
                <span className="font-mukta text-sm font-semibold text-forest">{name}</span>
                <span className="font-mukta text-xs text-gray-400">{hindi}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-3">
        <span className="font-mukta text-xs tracking-widest uppercase text-gray-400">Important notice</span>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex gap-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div className="flex flex-col gap-1.5">
            <h3 className="font-mukta text-sm font-semibold text-yellow-800">Advisory tool — not a replacement for experts</h3>
            <p className="font-mukta text-sm text-yellow-700 leading-relaxed">
              Krishi Mitra provides AI-generated first-response guidance only. Always verify recommendations
              with your nearest <strong>KVK (Krishi Vigyan Kendra)</strong> or a licensed
              <strong> Agricultural Extension Officer</strong> before large-scale application.
              The Mandakini Organic Produce Collective does not take responsibility for outcomes
              based solely on AI-generated advice.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest text-white px-6 py-12">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-lora text-2xl font-semibold">Ready to get started?</h2>
            <p className="font-mukta text-sm text-white/60 mt-1">Log in and ask your first crop question today.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="flex-shrink-0 bg-amber hover:bg-amber-light text-white font-mukta font-semibold text-sm px-7 py-3 rounded-xl transition-colors duration-150 whitespace-nowrap"
          >
            Open Advisory Chat →
          </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
