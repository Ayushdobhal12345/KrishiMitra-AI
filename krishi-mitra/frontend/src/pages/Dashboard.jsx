import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-parchment">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-14 flex flex-col gap-5">
        <h1 className="font-lora text-3xl md:text-4xl font-semibold text-forest">Supervisor Dashboard</h1>
        <p className="font-mukta text-base text-gray-500 leading-relaxed">
          This dashboard will display an overview of your recent advisory sessions, common crop issues
          logged across your assigned farms, and seasonal alerts relevant to your region. Full
          analytics and reporting features are coming soon.
        </p>
      </main>
      <Footer />
    </div>
  )
}
