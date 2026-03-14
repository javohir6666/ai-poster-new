import React, { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { Channel, CronJob, PostLog } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SEO } from "../../components/seo/SEO";
import { useTranslation } from "react-i18next";

export const AutomationPage: React.FC = () => {
  const { t } = useTranslation();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [postLogs, setPostLogs] = useState<PostLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const intervalOptions = useMemo(
    () => [
      { value: "30m", label: t("automation.interval_30m"), cron: "*/30 * * * *" },
      { value: "1h", label: t("automation.interval_1h"), cron: "0 * * * *" },
      { value: "3h", label: t("automation.interval_3h"), cron: "0 */3 * * *" },
      { value: "6h", label: t("automation.interval_6h"), cron: "0 */6 * * *" },
      { value: "daily9", label: t("automation.interval_daily9"), cron: "0 9 * * *" },
    ],
    [t]
  );
  const [intervalValue, setIntervalValue] = useState<string>("1h");
  const selectedInterval = useMemo(
    () => intervalOptions.find((o) => o.value === intervalValue) || intervalOptions[1],
    [intervalOptions, intervalValue]
  );
  const [withImages, setWithImages] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) || null,
    [channels, selectedChannelId]
  );

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

  const fetchCronJobs = async (channelId: number) => {
    setLoadingJobs(true);
    try {
      const data = await api.getCronJobs(channelId);
      setCronJobs(data);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchPostLogs = async (channelId: number) => {
    setLoadingLogs(true);
    try {
      const data = await api.getPostLogs(channelId);
      setPostLogs((data || []).slice(0, 20));
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (!selectedChannelId) return;
    fetchCronJobs(selectedChannelId);
    fetchPostLogs(selectedChannelId);
  }, [selectedChannelId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId) return;
    if (!selectedInterval?.cron) return;

    setSaving(true);
    try {
      await api.createCronJob(selectedChannelId, {
        schedule: selectedInterval.cron,
        topic: "",
        with_images: withImages,
        status: "active",
      });
      fetchCronJobs(selectedChannelId);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!selectedChannelId) return;
    if (!window.confirm(t("automation.delete_confirm"))) return;
    await api.deleteCronJob(selectedChannelId, jobId);
    fetchCronJobs(selectedChannelId);
  };

  const handleToggle = async (job: CronJob) => {
    if (!selectedChannelId) return;
    const nextStatus = job.status === "active" ? "inactive" : "active";
    await api.updateCronJob(selectedChannelId, job.id, { status: nextStatus });
    fetchCronJobs(selectedChannelId);
  };

  const handleRunNow = async (job: CronJob) => {
    if (!selectedChannelId) return;
    const res = await api.runCronJobNow(selectedChannelId, job.id);
    if (!res.ok) {
      window.alert(res.detail || "Failed");
    }
    fetchCronJobs(selectedChannelId);
    fetchPostLogs(selectedChannelId);
  };

  return (
    <div className="space-y-8">
      <SEO title={t("dashboard.cron_jobs")} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t("dashboard.cron_jobs")}</h2>
          <p className="text-slate-400 mt-1">{t("automation.desc")}</p>
        </div>

        {channels.length > 0 && (
          <div className="w-full sm:w-96">
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={selectedChannelId || ""}
              onChange={(e) => setSelectedChannelId(Number(e.target.value))}
              disabled={loading}
            >
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name} ({ch.channelUsername})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : channels.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-10 text-slate-400">{t("automation.no_channels")}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-white">{t("automation.create_title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t("automation.interval")}</label>
                    <select
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={intervalValue}
                      onChange={(e) => setIntervalValue(e.target.value)}
                    >
                      {intervalOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      {t("automation.schedule_hint")} <span className="font-mono">{selectedInterval.cron}</span>
                    </p>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={withImages}
                      onChange={(e) => setWithImages(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                    />
                    {t("automation.with_images")}
                  </label>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={saving || !selectedChannelId} className="gap-2">
                      <Plus size={18} />
                      {saving ? t("automation.creating") : t("automation.create")}
                    </Button>
                  </div>
                </form>

                {selectedChannel && !selectedChannel.isAdminVerified && (
                  <div className="mt-5 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    {t("automation.admin_warn")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-800/50 flex flex-row items-center justify-between">
                <CardTitle className="text-white">{t("automation.jobs_title")}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => selectedChannelId && fetchCronJobs(selectedChannelId)}
                  disabled={!selectedChannelId || loadingJobs}
                >
                  <RefreshCw size={16} className={loadingJobs ? "animate-spin" : ""} />
                  {t("automation.refresh")}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loadingJobs ? (
                  <div className="p-6 text-slate-400">{t("automation.loading")}</div>
                ) : cronJobs.length === 0 ? (
                  <div className="p-6 text-slate-400">{t("automation.empty")}</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {cronJobs.map((job) => (
                      <div key={job.id} className="p-6 flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{job.topic || t("automation.auto_topic")}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            <span className="text-slate-500">{t("automation.schedule")}:</span> {job.schedule}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            <span className="text-slate-500">{t("automation.next_run")}:</span>{" "}
                            {job.nextRun ? new Date(job.nextRun).toLocaleString() : "—"}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            <span className="text-slate-500">{t("automation.images")}:</span>{" "}
                            {job.with_images ? t("automation.yes") : t("automation.no")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleRunNow(job)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/15 transition-colors"
                          >
                            {t("automation.run_now")}
                          </button>
                          <button
                            onClick={() => handleToggle(job)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              job.status === "active"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15"
                                : "bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800"
                            }`}
                          >
                            {job.status === "active" ? t("automation.active") : t("automation.inactive")}
                          </button>
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            aria-label={t("automation.delete")}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm mt-8">
              <CardHeader className="border-b border-slate-800/50 flex flex-row items-center justify-between">
                <CardTitle className="text-white">{t("automation.logs_title")}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => selectedChannelId && fetchPostLogs(selectedChannelId)}
                  disabled={!selectedChannelId || loadingLogs}
                >
                  <RefreshCw size={16} className={loadingLogs ? "animate-spin" : ""} />
                  {t("automation.refresh")}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loadingLogs ? (
                  <div className="p-6 text-slate-400">{t("automation.loading")}</div>
                ) : postLogs.length === 0 ? (
                  <div className="p-6 text-slate-400">{t("automation.logs_empty")}</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {postLogs.map((log) => (
                      <div key={log.id} className="p-6 flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">
                            {log.topic || t("automation.auto_topic")}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            <span className="text-slate-500">{t("automation.status")}:</span>{" "}
                            {log.status}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            <span className="text-slate-500">{t("automation.time")}:</span>{" "}
                            {new Date(log.posted_at || log.created_at).toLocaleString()}
                          </div>
                          {log.status === "failed" && log.error && (
                            <div className="text-sm text-red-300 mt-2 break-words">{log.error}</div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              log.status === "success"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-red-500/10 text-red-300 border-red-500/20"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
