import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "../../services/api";
import { Channel, Paginated, Post } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SEO } from "../../components/seo/SEO";
import { useTranslation } from "react-i18next";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useToast } from "../../context/ToastContext";

function telegramPostLink(channelUsername: string, messageId?: number | null): string | null {
  const u = (channelUsername || "").trim();
  if (!u.startsWith("@")) return null;
  const username = u.slice(1);
  if (!username || !messageId) return null;
  return `https://t.me/${username}/${messageId}`;
}

const PAGE_SIZE = 20;

export const PostsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [postsPage, setPostsPage] = useState(1);
  const [postsResp, setPostsResp] = useState<Paginated<Post> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) || null,
    [channels, selectedChannelId]
  );

  const posts = postsResp?.results || [];

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const data = await api.getChannels();
      setChannels(data);
      if (data.length > 0) {
        const firstId = data[0].id;
        setSelectedChannelId((prev) => prev ?? firstId);
      }
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.load_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (channelId: number, page: number) => {
    setLoadingPosts(true);
    try {
      const data = await api.getPosts(channelId, page, PAGE_SIZE);
      setPostsResp(data);
    } catch (err: any) {
      toast.push({ variant: "error", title: t("toast.load_failed"), description: err?.message || t("toast.error_generic") });
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (!selectedChannelId) return;
    fetchPosts(selectedChannelId, postsPage);
  }, [selectedChannelId, postsPage]);

  return (
    <div className="space-y-8">
      <SEO title={t("dashboard.posts")} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t("dashboard.posts")}</h2>
          <p className="text-slate-400 mt-1">{t("posts.desc")}</p>
        </div>

        {channels.length > 0 && (
          <div className="w-full sm:w-96">
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={selectedChannelId || ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedChannelId(id);
                setPostsPage(1);
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
          <CardContent className="p-10 text-slate-400">{t("posts.no_channels")}</CardContent>
        </Card>
      ) : (
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-800/50 flex flex-row items-center justify-between">
            <CardTitle className="text-white">{t("posts.title")}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => selectedChannelId && fetchPosts(selectedChannelId, postsPage)}
              disabled={!selectedChannelId || loadingPosts}
            >
              <RefreshCw size={16} className={loadingPosts ? "animate-spin" : ""} />
              {t("posts.refresh")}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingPosts ? (
              <div className="p-6 text-slate-400">{t("posts.loading")}</div>
            ) : posts.length === 0 ? (
              <div className="p-6 text-slate-400">{t("posts.empty")}</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {posts.map((post) => {
                  const link = selectedChannel
                    ? telegramPostLink(selectedChannel.channelUsername, post.telegram_message_id)
                    : null;
                  return (
                    <div key={post.id} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{post.title || t("posts.untitled")}</div>
                          <div className="text-sm text-slate-400 mt-1 flex flex-wrap gap-2">
                            {post.category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                {post.category}
                              </span>
                            )}
                            <span className="text-slate-500">
                              {t("posts.time")}: {new Date(post.posted_at || post.created_at).toLocaleString()}
                            </span>
                            {post.status && (
                              <span className="text-slate-500">
                                {t("posts.status")}: {post.status}
                              </span>
                            )}
                          </div>
                          {post.text_plain && (
                            <p className="text-sm text-slate-300 mt-3 whitespace-pre-line">
                              {post.text_plain.length > 450 ? post.text_plain.slice(0, 450) + "..." : post.text_plain}
                            </p>
                          )}

                          {post.images && post.images.length > 0 && (
                            <div className="mt-4 flex gap-3 overflow-x-auto">
                              {post.images.slice(0, 5).map((img) => (
                                <a key={img.id} href={img.url || "#"} target="_blank" rel="noreferrer">
                                  <img
                                    src={img.url || ""}
                                    alt={img.prompt || "image"}
                                    className="h-20 w-20 rounded-xl object-cover border border-slate-800"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-sm text-indigo-300 hover:text-indigo-200"
                          >
                            {t("posts.open_telegram")}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {postsResp && (
              <PaginationControls
                page={postsPage}
                pageSize={PAGE_SIZE}
                count={postsResp.count}
                hasPrev={!!postsResp.previous}
                hasNext={!!postsResp.next}
                onPrev={() => setPostsPage((p) => Math.max(1, p - 1))}
                onNext={() => setPostsPage((p) => p + 1)}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
