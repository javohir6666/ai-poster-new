import React, { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { Channel, CronJob, Paginated, PostLog } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SEO } from "../../components/seo/SEO";
import { useTranslation } from "react-i18next";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useToast } from "../../context/ToastContext";

const LOGS_PAGE_SIZE = 20;

export const AutomationPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [postLogsPage, setPostLogsPage] = useState(1);
  const [postLogsResp, setPostLogsResp] = useState<Paginated<PostLog> | null>(null);
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

  const postLogs = postLogsResp?.results || [];

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const data = await api.getChannels();
      setChannels(data);
      if (data.length > 0) setSelectedChannelId((prev) => prev ?? data[0].id);
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.load_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      setLoading(false);
    }
  };

  const fetchCronJobs = async (channelId: number) => {
    setLoadingJobs(true);
    try {
      const data = await api.getCronJobs(channelId);
      setCronJobs(data);
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.load_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchPostLogs = async (channelId: number, page: number) => {
    setLoadingLogs(true);
    try {
      const data = await api.getPostLogs(channelId, page, LOGS_PAGE_SIZE);
      setPostLogsResp(data);
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.load_failed"), description: err?.message || t("toast.error_generic") });
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
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId) return;
    fetchPostLogs(selectedChannelId, postLogsPage);
  }, [selectedChannelId, postLogsPage]);

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
      toast.push({ variant: "success", title: t("toast.saved") });
      fetchCronJobs(selectedChannelId);
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.save_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!selectedChannelId) return;
    if (!window.confirm(t("automation.delete_confirm"))) return;
    try {
      await api.deleteCronJob(selectedChannelId, jobId);
      toast.push({ variant: "success", title: t("toast.deleted") });
      fetchCronJobs(selectedChannelId);
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.delete_failed"), description: err?.message || t("toast.error_generic") });
    }
  };

  const handleToggle = async (job: CronJob) => {
    if (!selectedChannelId) return;
    const nextStatus = job.status === "active" ? "inactive" : "active";
    try {
      await api.updateCronJob(selectedChannelId, job.id, { status: nextStatus });
      toast.push({ variant: "success", title: t("toast.saved") });
      fetchCronJobs(selectedChannelId);
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.save_failed"), description: err?.message || t("toast.error_generic") });
    }
  };

  const handleRunNow = async (job: CronJob) => {
    if (!selectedChannelId) return;
    try {
      const res = await api.runCronJobNow(selectedChannelId, job.id);
      if (!res.ok) {
        toast.push({ variant: "error", title: t("toast.run_failed"), description: res.detail || t("toast.error_generic") });
      } else {
        toast.push({ variant: "success", title: t("toast.run_started") });
      }
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.run_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      fetchCronJobs(selectedChannelId);
      setPostLogsPage(1);
      fetchPostLogs(selectedChannelId, 1);
    }
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
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedChannelId(id);
                setPostLogsPage(1);
              }}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-white">{t("automation.create_title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedChannel && !selectedChannel.isAdminVerified && (
                  <div className="mb-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-200 text-sm">
                    {t("automation.admin_warn")}
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-6">
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
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-sm font-medium text-white">{t("automation.with_images")}</div>
                      <div className="text-xs text-slate-500 mt-1">{t("automation.images")}: {withImages ? t("automation.yes") : t("automation.no")}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWithImages((v) => !v)}
                      className={`w-12 h-7 rounded-full border transition-colors relative ${
                        withImages
                          ? "bg-indigo-600/80 border-indigo-500/40"
                          : "bg-slate-800 border-slate-700"
                      }`}
                      aria-label={t("automation.with_images")}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                          withImages ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={saving} className="gap-2">
                      <Plus size={18} /> {saving ? t("automation.creating") : t("automation.create")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm mt-8">
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
                  onClick={() => selectedChannelId && fetchPostLogs(selectedChannelId, postLogsPage)}
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
                          <div className="text-white font-semibold truncate">{log.topic || t("automation.auto_topic")}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            <span className="text-slate-500">{t("automation.status")}:</span> {log.status}
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

                {postLogsResp && (
                  <PaginationControls
                    page={postLogsPage}
                    pageSize={LOGS_PAGE_SIZE}
                    count={postLogsResp.count}
                    hasPrev={!!postLogsResp.previous}
                    hasNext={!!postLogsResp.next}
                    onPrev={() => setPostLogsPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPostLogsPage((p) => p + 1)}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-white">{t("dashboard.analytics")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-sm text-slate-400">
                  {t("automation.desc")}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
