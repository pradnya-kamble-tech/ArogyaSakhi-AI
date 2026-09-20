import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/design/Editorial';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between selection:bg-[#C5D4C2] selection:text-[#2D5A3D]">
      <header className="flex justify-between items-center p-6 md:p-8">
        <div className="text-display-sm tracking-tighter text-[#2D5A3D]">
          ArogyaSakhi.<span className="text-[#C4704B]">*</span>
        </div>
        <div className="flex gap-2">
          {['en', 'hi', 'mr'].map(lang => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              className={`uppercase text-xs font-semibold px-2 py-1 rounded transition-colors ${i18n.language === lang ? 'bg-[#2C2C2C] text-[#FAF8F5]' : 'bg-[#F2EDE6] text-[#6B6B6B] hover:bg-[#DDD7CD]'}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 page-enter">
        <div className="max-w-3xl w-full text-center flex flex-col gap-8">
          <div className="inline-flex items-center justify-center space-x-2 bg-[#F2EDE6] text-[#6B6B6B] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest self-center">
            <span>Community Intelligence</span>
          </div>

          <h1 className="text-display-xl text-[#2C2C2C] leading-[1.1]">
            Empowering grassroots healthcare with precision AI.
          </h1>

          <p className="text-body text-[#6B6B6B] max-w-xl mx-auto leading-relaxed">
            A unified clinical intelligence platform designed for health workers, specialists, and communities to elevate care delivery across the last mile.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            <Button variant="primary" onClick={() => navigate('/login')} className="w-full sm:w-auto px-10">
              Go to Login
            </Button>
            <Button variant="secondary" onClick={() => navigate('/register')} className="w-full sm:w-auto px-10">
              Join Network
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-6 md:p-8 border-t border-[#E5E0D8] text-center md:text-left flex flex-col md:flex-row justify-between text-body-xs text-[#6B6B6B]">
        <span>© 2026 ArogyaSakhi Project.</span>
        <button onClick={() => navigate('/legacy/login')} className="hover:text-[#C4704B] underline mt-4 md:mt-0 transition-colors">
          Access Legacy System
        </button>
      </footer>
    </div>
  );
}
