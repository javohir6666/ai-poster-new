import React from "react";
import { Link } from "react-router-dom";
import { Bot, Globe } from "lucide-react";
import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Bot size={28} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {t("app_name")}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="/#features" className="hover:text-white transition-colors">
              {t("home.nav_features")}
            </a>
            <a href="/#how-it-works" className="hover:text-white transition-colors">
              {t("home.nav_how")}
            </a>
            <a href="/#pricing" className="hover:text-white transition-colors">
              {t("home.nav_pricing")}
            </a>
            <a href="/#faq" className="hover:text-white transition-colors">
              {t("home.nav_faq")}
            </a>
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

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
                {t("home.login")}
              </Link>
              <Link to="/register">
                <Button size="md" className="shadow-lg shadow-indigo-500/20">
                  {t("home.register")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-800/50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-slate-500">{t("footer.copyright")}</div>
          <div className="text-sm text-slate-500">{t("footer.note")}</div>
        </div>
      </footer>
    </div>
  );
};
