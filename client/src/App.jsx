import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStatsSocket } from './hooks/useStatsSocket'
import Overlay from './routes/Overlay'
import Admin from './routes/Admin'

function SocketProvider({ children }) {
  useStatsSocket()
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/overlay" element={<Overlay />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  )
}
