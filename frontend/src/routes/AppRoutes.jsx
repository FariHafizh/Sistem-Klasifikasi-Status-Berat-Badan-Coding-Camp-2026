import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import InputPage from '../pages/InputPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import RecommendationPage from '../pages/RecommendationPage';
import HistoryPage from '../pages/HistoryPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/input" element={<InputPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/recommendation" element={<RecommendationPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}
