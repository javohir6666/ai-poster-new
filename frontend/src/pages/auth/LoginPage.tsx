import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/seo/SEO";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      // store access and refresh
      login(data.access, data.refresh, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <SEO title={t('auth.login_btn')} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative z-10">
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <Link to="/">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform">
                <Bot size={32} />
              </div>
            </Link>
          </div>
          <h2 className="text-3xl font-extrabold text-center text-white mb-2 tracking-tight">{t('auth.welcome')}</h2>
          <p className="text-center text-slate-400 mb-8">{t('auth.login_desc')}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm rounded-r-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('auth.email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-indigo-500/20" disabled={loading}>
              {loading ? t('auth.logging_in') : t('auth.login_btn')} <ArrowRight className="ml-2" size={18} />
            </Button>
          </form>
        </div>
        <div className="px-10 py-6 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            {t('auth.no_account')}{" "}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              {t('auth.register_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
