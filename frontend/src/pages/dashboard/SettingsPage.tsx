import React, { useEffect, useState } from "react";
import { Save, User as UserIcon, Mail, Lock, Shield, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/seo/SEO";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { useToast } from "../../context/ToastContext";

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [loadingMe, setLoadingMe] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Sync local fields when auth context changes
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  useEffect(() => {
    (async () => {
      setLoadingMe(true);
      try {
        const me = await api.getMe();
        updateUser(me);
      } catch {
        // best-effort
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const me = await api.updateMe({ name: name.trim() });
      updateUser(me);
      toast.push({ variant: "success", title: t("toast.profile_saved") });
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.save_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.push({ variant: "error", title: t("toast.password_mismatch") });
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.push({ variant: "success", title: t("toast.password_updated") });
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.password_update_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <SEO title={t("dashboard.settings")} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t("dashboard.settings")}</h2>
          <p className="text-slate-400 mt-1">{t("settings.desc")}</p>
        </div>
        {loadingMe && (
          <div className="text-xs text-slate-500 inline-flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin" /> {t("common.loading")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon size={20} className="text-indigo-400" />
                {t("settings.profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t("settings.name")}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <UserIcon size={18} />
                      </div>
                      <Input className="pl-10" placeholder={t("settings.name_placeholder")} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t("auth.email")}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail size={18} />
                      </div>
                      <Input className="pl-10 opacity-80" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                    </div>
                    <div className="text-xs text-slate-500 mt-2">{t("settings.email_locked")}</div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={savingProfile} className="gap-2">
                    {savingProfile ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    {savingProfile ? t("settings.saving") : t("settings.save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <CardTitle className="text-white flex items-center gap-2">
                <Lock size={20} className="text-amber-400" />
                {t("settings.password")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t("settings.current_password")}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock size={18} />
                    </div>
                    <Input
                      type="password"
                      className="pl-10"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t("settings.new_password")}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock size={18} />
                      </div>
                      <Input
                        type="password"
                        className="pl-10"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t("settings.confirm_password")}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock size={18} />
                      </div>
                      <Input
                        type="password"
                        className="pl-10"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={savingPassword} className="gap-2">
                    {savingPassword ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    {savingPassword ? t("settings.saving") : t("settings.update_password")}
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
                {t("settings.security")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-sm font-medium text-white">{t("settings.2fa")}</h4>
                    <p className="text-xs text-slate-400 mt-1">{t("settings.coming_soon")}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    {t("settings.enable")}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-sm font-medium text-white">{t("settings.sessions")}</h4>
                    <p className="text-xs text-slate-400 mt-1">{t("settings.coming_soon")}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    {t("settings.view")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
