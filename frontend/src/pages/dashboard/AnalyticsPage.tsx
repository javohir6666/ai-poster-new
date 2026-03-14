import React, { useEffect, useMemo, useState } from "react";
import { Activity, BarChart, Clock, RefreshCw, TriangleAlert, Zap } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart as RBarChart,
  Bar,
} from "recharts";
import { api } from "../../services/api";
import { Channel, ChannelAnalytics, DailyMetric, RunError } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/seo/SEO";

function fmtDay(value: string) {
  // value is YYYY-MM-DD
  try {
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  } catch {
    return value;
  }
}

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null);
  const [timeseries, setTimeseries] = useState<DailyMetric[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [errors, setErrors] = useState<RunError[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const days = 14;

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) || null,
    [channels, selectedChannelId]
  );

  const kpis = useMemo(() => {
    const totalRuns = timeseries.reduce((acc, r) => acc + (r.runs_total || 0), 0);
    const okRuns = timeseries.reduce((acc, r) => acc + (r.runs_success || 0), 0);
    const failedRuns = timeseries.reduce((acc, r) => acc + (r.runs_failed || 0), 0);
    const tokens = timeseries.reduce((acc, r) => acc + (r.tokens_total || 0), 0);
    const durMs = timeseries.reduce((acc, r) => acc + (r.duration_total_ms || 0), 0);
    const avgSec = totalRuns > 0 ? Math.round((durMs / totalRuns) / 100) / 10 : 0;
    const successRate = totalRuns > 0 ? Math.round((okRuns / totalRuns) * 100) : 0;
    return { totalRuns, okRuns, failedRuns, tokens, avgSec, successRate };
  }, [timeseries]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const data = await api.getChannels();
      setChannels(data);
      if (data.length > 0) setSelectedChannelId((prev) => prev ?? data[0].id);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelAnalytics = async (channelId: number) => {
    setLoadingAnalytics(true);
    try {
      const a = await api.getChannelAnalytics(channelId);
      setAnalytics(a);

      const ts = await api.getChannelTimeseries(channelId, days);
      setTimeseries(ts || []);

      const cats = await api.getChannelCategories(channelId);
      setCategories(cats || []);

      const errs = await api.getRecentErrors();
      setErrors((errs || []).slice(0, 20));
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (!selectedChannelId) return;
    fetchChannelAnalytics(selectedChannelId);
  }, [selectedChannelId]);

  if (loading) {
    return <div className="animate-pulse flex space-x-4 text-slate-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-8">
      <SEO title={t("dashboard.analytics")} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t("dashboard.analytics")}</h2>
          <p className="text-slate-400 mt-1">{t("dashboard.analytics_desc")}</p>
        </div>

        <div className="flex gap-3 items-center">
          {channels.length > 0 && (
            <div className="w-full sm:w-80">
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={selectedChannelId || ""}
                onChange={(e) => setSelectedChannelId(Number(e.target.value))}
              >
                <option value="" disabled className="text-slate-500">
                  {t("analytics.select_channel")}
                </option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.channelUsername})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => selectedChannelId && fetchChannelAnalytics(selectedChannelId)}
            disabled={!selectedChannelId || loadingAnalytics || loadingMore}
          >
            <RefreshCw size={16} className={loadingAnalytics ? "animate-spin" : ""} />
            {t("automation.refresh")}
          </Button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed backdrop-blur-sm">
          <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t("channel.no_channels")}</h3>
          <p className="text-slate-400 max-w-md mx-auto">{t("channel.no_channels_desc")}</p>
        </div>
      ) : loadingAnalytics ? (
        <div className="animate-pulse flex space-x-4 text-slate-400">Analitika yuklanmoqda...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-400">
                  <Activity size={28} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{t("analytics.posts_today")}</p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{analytics?.postsToday ?? 0}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                  <BarChart size={28} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{t("automation.status")}</p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{kpis.successRate}%</h3>
                  <p className="text-xs text-slate-500 mt-1">{days}d: {kpis.okRuns}/{kpis.totalRuns} runs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-400">
                  <Zap size={28} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{t("analytics.tokens_used")}</p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{kpis.tokens}</h3>
                  <p className="text-xs text-slate-500 mt-1">{days}d</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                  <Clock size={28} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Avg run</p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{kpis.avgSec}s</h3>
                  <p className="text-xs text-slate-500 mt-1">{days}d</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="border-slate-800 bg-slate-900/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">{selectedChannel ? selectedChannel.name : ""} | {days}d timeseries</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {timeseries.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                    Ma'lumotlar yetarli emas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeseries.map((r) => ({ ...r, day: fmtDay(r.date) }))} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 12 }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Line type="monotone" dataKey="posts_published" stroke="#22c55e" strokeWidth={2} dot={false} name="Posts" />
                      <Line type="monotone" dataKey="runs_failed" stroke="#ef4444" strokeWidth={2} dot={false} name="Fails" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Top categories</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {categories.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                    Hozircha category yo'q
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RBarChart data={categories.slice(0, 8)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 12 }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </RBarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <TriangleAlert size={18} className="text-amber-400" /> Recent errors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {errors.length === 0 ? (
                <div className="p-6 text-slate-400">Xatoliklar yo'q</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {errors.map((e) => (
                    <div key={e.id} className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="text-slate-200 text-sm font-semibold truncate">{e.error || "Error"}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(e.started_at).toLocaleString()} | channelId: {e.channelId} | cronJobId: {e.cronJobId ?? "-"}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 shrink-0">{(e.duration_ms ?? 0) / 1000}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
