import React, { useEffect, useState } from "react";
import { Activity, Users, MessageSquare, Zap } from "lucide-react";
import { api } from "../../services/api";
import { Stats } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/seo/SEO";
import { useToast } from "../../context/ToastContext";

export const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getOverview();
        setStats(data);
      } catch (error: any) {
        toast.push({ variant: "error", title: t("toast.load_failed"), description: error?.message || t("toast.error_generic") });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-x-4 text-slate-400">{t("common.loading")}</div>;
  }

  const statCards = [
    {
      title: t("dashboard.total_channels"),
      value: stats?.totalChannels || 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: t("dashboard.active_bots"),
      value: stats?.activeBots || 0,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: t("dashboard.total_posts"),
      value: stats?.totalPosts || 0,
      icon: MessageSquare,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      title: t("dashboard.ai_interactions"),
      value: stats?.aiInteractions || 0,
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <SEO title={t("dashboard.overview")} />
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{t("dashboard.overview")}</h2>
        <p className="text-slate-400 mt-1">{t("dashboard.overview_desc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900 transition-colors"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">{t("dashboard.recent_activity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
              {t("dashboard.no_data")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">{t("dashboard.system_status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-emerald-500/80 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
              {t("dashboard.all_systems_normal")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
