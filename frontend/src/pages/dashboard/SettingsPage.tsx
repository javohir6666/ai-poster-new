import React, { useState } from "react";
import { Save, User, Mail, Lock, Shield } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/seo/SEO";
import { useAuth } from "../../context/AuthContext";

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock save
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-8">
      <SEO title={t('dashboard.settings')} />
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{t('dashboard.settings')}</h2>
        <p className="text-slate-400 mt-1">{t('settings.desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <CardTitle className="text-white flex items-center gap-2">
                <User size={20} className="text-indigo-400" />
                {t('settings.profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings.name')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User size={18} />
                      </div>
                      <Input 
                        className="pl-10" 
                        placeholder="John Doe" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('auth.email')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail size={18} />
                      </div>
                      <Input 
                        className="pl-10" 
                        placeholder="admin@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('settings.new_password')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock size={18} />
                    </div>
                    <Input 
                      type="password" 
                      className="pl-10" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={loading} className="gap-2">
                    <Save size={18} /> {loading ? t('settings.saving') : t('settings.save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield size={20} className="text-emerald-400" />
                Xavfsizlik
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-sm font-medium text-white">Ikki bosqichli autentifikatsiya</h4>
                    <p className="text-xs text-slate-400 mt-1">Hozircha o'chirilgan</p>
                  </div>
                  <Button variant="outline" size="sm">Yoqish</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-sm font-medium text-white">Faol seanslar</h4>
                    <p className="text-xs text-slate-400 mt-1">2 ta qurilma</p>
                  </div>
                  <Button variant="outline" size="sm">Ko'rish</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
