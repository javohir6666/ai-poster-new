import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Send, Settings, LogOut, Bot, BarChart, CreditCard, Clock, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { useTranslation } from "react-i18next";

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const links = [
    { name: t('dashboard.overview'), href: "/dashboard", icon: LayoutDashboard },
    { name: t('dashboard.channels'), href: "/dashboard/channels", icon: Send },
    { name: t('dashboard.analytics'), href: "/dashboard/analytics", icon: BarChart },
    { name: t('dashboard.cron_jobs'), href: "/dashboard/automation", icon: Clock },
    { name: t('dashboard.posts'), href: "/dashboard/posts", icon: FileText },
    { name: t('dashboard.subscription'), href: "/dashboard/subscription", icon: CreditCard },
    { name: t('dashboard.settings'), href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="w-72 bg-slate-950 flex flex-col h-full border-r border-slate-800 relative z-50">
      <div className="p-6 flex items-center gap-3 text-white mb-4">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
          <Bot size={24} className="text-white" />
        </div>
        <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t('app_name')}</span>
      </div>

      <nav className="flex-1 px-4 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group relative overflow-hidden",
                isActive
                  ? "text-white bg-indigo-600/10 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full"></div>
              )}
              <Icon size={20} className={cn("transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
          <h4 className="text-sm font-bold text-white mb-1">Pro Tarif</h4>
          <p className="text-xs text-slate-400 mb-3">Cheksiz imkoniyatlar</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-[10px] text-slate-500">45% limit ishlatildi</p>
        </div>
        
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-left font-medium group"
        >
          <LogOut size={20} className="text-slate-500 group-hover:text-red-400 transition-colors" />
          {t('dashboard.logout')}
        </button>
      </div>
    </aside>
  );
};
