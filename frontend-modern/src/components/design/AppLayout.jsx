import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AppLayout({ children, user }) {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const navItems = [
        { label: t('Dashboard'), path: '/dashboard', icon: '⊞' },
        { label: t('Community'), path: '/community', icon: '👥' },
        { label: t('Maternal'), path: '/maternal', icon: '🤰' },
        { label: t('Emergency'), path: '/emergency-sos', icon: '🚨' },
    ];

    return (
        <div className="flex h-screen bg-[#FAF8F5] overflow-hidden selection:bg-[#C5D4C2] selection:text-[#2D5A3D]">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col justify-between w-[280px] border-r border-[#E5E0D8] p-8 shrink-0 relative bg-[#FDFCFA] z-20">
                <div className="flex flex-col gap-12">
                    {/* Logo */}
                    <div className="text-display-sm tracking-tighter text-[#2D5A3D]">
                        ArogyaSakhi.<span className="text-[#C4704B]">*</span>
                    </div>

                    <nav className="flex flex-col gap-6">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.path}
                                className={({ isActive }) => `text-left font-sans text-sm tracking-wide transition-all translate-x-0 ${isActive ? 'text-[#2C2C2C] font-semibold translate-x-2' : 'text-[#6B6B6B] hover:text-[#C4704B]'}`}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => `text-left font-sans text-sm tracking-wide transition-all mt-4 translate-x-0 ${isActive ? 'text-[#2C2C2C] font-semibold translate-x-2' : 'text-[#6B6B6B] hover:text-[#C4704B]'}`}
                        >
                            {t('Settings')}
                        </NavLink>
                    </nav>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex gap-2 text-xs">
                        {['en', 'hi', 'mr'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => changeLanguage(lang)}
                                className={`uppercase px-2 py-1 rounded transition-colors ${i18n.language === lang ? 'bg-[#2C2C2C] text-[#FAF8F5]' : 'bg-[#F2EDE6] text-[#6B6B6B] hover:bg-[#DDD7CD]'}`}
                            >
                                {lang === 'hi' ? 'HI' : lang === 'mr' ? 'MR' : 'EN'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-[#E5E0D8]">
                        <div className="w-10 h-10 rounded-full bg-[#E8C4B0] text-[#2C2C2C] flex items-center justify-center font-serif text-xl border border-[#C4704B] uppercase">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-sans text-sm font-medium text-[#2C2C2C]">{user?.name || 'Guest User'}</span>
                            <span className="text-label text-[#A3B8A0] capitalize">{user?.role?.toLowerCase() || 'Visitor'}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto scroll-smooth relative flex flex-col">

                {/* Mobile Header */}
                <header className="md:hidden flex flex-col p-4 border-b border-[#E5E0D8] sticky top-0 bg-[#FAF8F5]/90 backdrop-blur z-30">
                    <div className="flex items-center justify-between">
                        <div className="text-display-sm tracking-tighter text-[#2D5A3D]">ArogyaSakhi.</div>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1 text-[10px]">
                                {['en', 'hi', 'mr'].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => changeLanguage(lang)}
                                        className={`uppercase px-1.5 py-0.5 rounded transition-colors ${i18n.language === lang ? 'bg-[#2C2C2C] text-[#FAF8F5]' : 'bg-[#F2EDE6] text-[#6B6B6B]'}`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#E8C4B0] flex items-center justify-center font-serif uppercase">
                                {user?.name?.[0] || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {children}

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden sticky bottom-0 w-full bg-[#FDFCFA] border-t border-[#E5E0D8] z-30 flex justify-around p-2 pt-3 pb-safe">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#2D5A3D]' : 'text-[#6B6B6B]'}`}
                        >
                            <span className="text-xl leading-none block h-[20px]">{item.icon}</span>
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </main>
        </div>
    );
}
