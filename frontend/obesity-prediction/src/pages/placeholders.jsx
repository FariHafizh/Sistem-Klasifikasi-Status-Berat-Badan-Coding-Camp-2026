function PlaceholderPage({ emoji, title }) {
  return (
    <div className="min-h-screen bg-[#eaf2fc] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-10 text-center shadow">
        <p className="text-4xl mb-3">{emoji}</p>
        <p className="text-2xl font-bold text-[#1e3a6e]">{title}</p>
        <p className="text-gray-500 mt-2 text-sm">Coming soon — dalam pengerjaan</p>
      </div>
    </div>
  )
}

export function ResultPage()         { return <PlaceholderPage emoji="📊" title="Hasil Prediksi" /> }
export function LoginPage()          { return <PlaceholderPage emoji="🔐" title="Login" /> }
export function RegisterPage()       { return <PlaceholderPage emoji="📝" title="Register" /> }
export function DashboardPage()      { return <PlaceholderPage emoji="📈" title="Dashboard" /> }
export function RecommendationPage() { return <PlaceholderPage emoji="💡" title="Rekomendasi Kesehatan" /> }
export function HistoryPage()        { return <PlaceholderPage emoji="🗂️" title="Riwayat" /> }
