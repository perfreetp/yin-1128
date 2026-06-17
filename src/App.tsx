import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import UploadPage from '@/pages/UploadPage'
import RecognizePage from '@/pages/RecognizePage'
import VerifyPage from '@/pages/VerifyPage'
import ExceptionsPage from '@/pages/ExceptionsPage'
import RulesPage from '@/pages/RulesPage'
import StatisticsPage from '@/pages/StatisticsPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/recognize" element={<RecognizePage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/exceptions" element={<ExceptionsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}
