import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#dce9f8] flex">
      <Sidebar />
      {/* Konten utama  */}
      <main className="flex-1 ml-56 p-10 min-h-screen">{children}</main>
    </div>
  );
}
