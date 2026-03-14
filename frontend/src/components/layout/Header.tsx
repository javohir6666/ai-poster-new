import React, { useRef, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Bell, Globe, ChevronDown, LogOut, Settings, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white tracking-tight">{t("dashboard.overview")}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400 bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
          <Globe size={16} className="ml-2 mr-1 text-slate-500" />
          <button
            onClick={() => changeLanguage("uz")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              i18n.language === "uz" ? "bg-indigo-600 text-white shadow-md" : "hover:text-white hover:bg-slate-800"
            }`}
          >
            UZ
          </button>
          <button
            onClick={() => changeLanguage("ru")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              i18n.language === "ru" ? "bg-indigo-600 text-white shadow-md" : "hover:text-white hover:bg-slate-800"
            }`}
          >
            RU
          </button>
          <button
            onClick={() => changeLanguage("en")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              i18n.language === "en" ? "bg-indigo-600 text-white shadow-md" : "hover:text-white hover:bg-slate-800"
            }`}
          >
            EN
          </button>
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all relative"
            aria-label={t("header.notifications")}
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h3 className="font-semibold text-white">{t("header.notifications")}</h3>
                <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
                  {t("header.mark_all_read")}
                </span>
              </div>
              <div className="p-4 text-center text-sm text-slate-500 py-8">{t("header.no_notifications")}</div>
            </div>
          )}
        </div>

        <div className="relative pl-6 border-l border-slate-800" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none group">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                {user?.name || t("header.user_fallback")}
              </span>
              <span className="text-xs text-slate-500">{user?.email}</span>
            </div>
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 border-2 border-slate-900 group-hover:scale-105 transition-transform">
              <User size={20} />
            </div>
            <ChevronDown size={16} className={`text-slate-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("header.pro_plan")}</p>
              </div>
              <div className="p-2">
                <Link
                  to="/dashboard/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Settings size={16} /> {t("dashboard.settings")}
                </Link>
                <Link
                  to="/dashboard/subscription"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <CreditCard size={16} /> {t("dashboard.subscription")}
                </Link>
              </div>
              <div className="p-2 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut size={16} /> {t("dashboard.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
