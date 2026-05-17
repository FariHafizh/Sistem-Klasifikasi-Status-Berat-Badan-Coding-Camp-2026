import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import InputPage from '../pages/InputPage'
import {
  ResultPage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  RecommendationPage,
  HistoryPage,
} from '../pages/placeholders'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/input" element={<InputPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/recommendation" element={<RecommendationPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  )
}
