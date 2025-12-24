
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <header className="border-b border-slate-800 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <span className="text-black font-bold text-xl font-fantasy">A</span>
            </div>
            <h1 className="text-xl font-fantasy tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
              ARCANE STRATEGIST
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-amber-400 transition-colors">Trang chủ</a>
            <a href="#" className="text-sm font-medium hover:text-amber-400 transition-colors">Thư viện quân bài</a>
            <a href="#" className="text-sm font-medium hover:text-amber-400 transition-colors">Cài đặt</a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
