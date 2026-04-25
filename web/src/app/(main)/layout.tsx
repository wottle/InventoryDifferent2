import { NavBar } from '../../components/NavBarNew';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-transparent light:bg-[#e5e5e5]/80 dark:bg-[#2d2d2d] font-inter">
      <style>{`
        body { background-color: #e5e5e5 !important; }
        @media (prefers-color-scheme: dark) { body { background-color: #111318 !important; } }
      `}</style>
      <NavBar />
      <main className="max-w-[1440px] mx-auto px-8 pt-6 pb-32 md:pb-12">
        {children}
      </main>
    </div>
  );
}
