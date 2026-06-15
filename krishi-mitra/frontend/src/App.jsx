import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home      from './pages/Home.jsx'
import Chat      from './pages/Chat.jsx'
import About     from './pages/About.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login     from './pages/Login.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/chat"      element={<Chat />} />
        <Route path="/about"     element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login"     element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
