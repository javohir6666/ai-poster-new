import React, { useEffect, useState } from "react";
import { Plus, Trash2, Settings, Bot, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../../services/api";
import { Channel } from "../../types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent } from "../../components/ui/Card";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/seo/SEO";
import { useToast } from "../../context/ToastContext";

export const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();

  // Modal states
  const [channelUsername, setChannelUsername] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "success" | "error">("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [channelName, setChannelName] = useState("");
  
  const [aiModel, setAiModel] = useState("gemini-pro");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiModelId, setAiModelId] = useState<number | null>(null);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [editingChannelId, setEditingChannelId] = useState<number | null>(null);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await api.getChannels();
      setChannels(data);
    } catch (error) {
      const msg = (error as any)?.message || t("toast.error_generic");
      toast.push({ variant: "error", title: t("toast.load_failed"), description: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    // fetch available AI models
    (async () => {
      try {
        // @ts-ignore
        const models = await api.getAIModels();
        setAiModels(models || []);
        if (models && models.length > 0) {
          setAiModel(models[0].name);
          setAiModelId(models[0].id);
        }
      } catch (e) {
        toast.push({ variant: "error", title: t("toast.load_failed"), description: (e as any)?.message || t("toast.error_generic") });
      }
    })();
  }, []);

  const handleVerify = async () => {
    if (!channelUsername) return;
    setIsVerifying(true);
    setVerifyStatus("idle");
    setVerifyMessage("");

    try {
      const res = await api.verifyAdmin(channelUsername);
      if (res.verified) {
        setVerifyStatus("success");
        // Only auto-fill if user hasn't typed a name yet.
        if (res.channel) {
          setEditingChannelId(res.channel.id);
          setChannelUsername(res.channel.channelUsername);
          setChannelName(res.channel.name);
        } else {
          setChannelName((prev) => prev || res.channelName || channelUsername);
        }
        setVerifyMessage(t('channel.verified_success'));
        toast.push({ variant: "success", title: t("toast.channel_verified") });
      } else {
        setVerifyStatus("error");
        setVerifyMessage(res.message || t('channel.verify_error'));
        toast.push({ variant: "error", title: t("toast.verify_failed"), description: res.message || t("channel.verify_error") });
      }
    } catch (error: any) {
      setVerifyStatus("error");
      setVerifyMessage(error.message || t('channel.verify_error'));
      toast.push({ variant: "error", title: t("toast.verify_failed"), description: error.message || t("channel.verify_error") });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyStatus !== "success") return;

    const payload: any = {
      channelUsername,
      name: (channelName || "").trim() || channelUsername,
      customPrompt,
      isAdminVerified: true,
      status: 'active'
    };
    if (aiModelId) {
      payload.ai_model = aiModelId;
      const sel = aiModels.find(m => m.id === aiModelId);
      if (sel) payload.aiModel = sel.name;
    } else {
      payload.aiModel = aiModel;
    }

    try {
      if (editingChannelId) {
        await api.updateChannel(editingChannelId, payload);
      } else {
        await api.createChannel(payload);
      }
      closeModal();
      fetchChannels();
    } catch (error) {
      const msg = (error as any)?.message || t("toast.error_generic");
      toast.push({ variant: "error", title: t("toast.save_failed"), description: msg });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setChannelUsername("");
    setVerifyStatus("idle");
    setVerifyMessage("");
    setChannelName("");
    setAiModel(aiModels && aiModels.length ? aiModels[0].name : 'gemini-pro');
    setAiModelId(aiModels && aiModels.length ? aiModels[0].id : null);
    setCustomPrompt("");
    setEditingChannelId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('channel.delete_confirm'))) return;
    try {
      await api.deleteChannel(id);
      fetchChannels();
    } catch (error) {
      const msg = (error as any)?.message || t("toast.error_generic");
      toast.push({ variant: "error", title: t("toast.delete_failed"), description: msg });
    }
  };

  return (
    <div className="space-y-8">
      <SEO title={t('dashboard.channels')} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t('dashboard.channels')}</h2>
          <p className="text-slate-400 mt-1">{t('dashboard.channels_desc')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={18} /> {t('channel.add_new')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed backdrop-blur-sm">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t('channel.no_channels')}</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">{t('channel.no_channels_desc')}</p>
          <Button onClick={() => setIsModalOpen(true)}>{t('channel.add_btn')}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <Card key={channel.id} className="overflow-hidden hover:shadow-lg hover:shadow-indigo-500/5 transition-all border-slate-800 bg-slate-900">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-600"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{channel.name}</h3>
                    <p className="text-sm text-slate-400">{channel.channelUsername}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 mt-3 border border-emerald-500/20">
                      {channel.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setIsModalOpen(true);
                      setEditingChannelId(channel.id);
                      setChannelUsername(channel.channelUsername);
                      setChannelName(channel.name);
                      setAiModel(channel.aiModel || (aiModels.length ? aiModels[0].name : ''));
                      setAiModelId((channel as any).ai_model ?? (channel as any).aiModelId ?? null);
                      setCustomPrompt(channel.customPrompt || '');
                      setVerifyStatus('success');
                    }} className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(channel.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm mt-6">
                  <div className="flex justify-between border-b border-slate-800 pb-3">
                    <span className="text-slate-500">{t('channel.model')}:</span>
                    <span className="font-medium text-slate-300">{channel.aiModel}</span>
                  </div>
                  <div className="flex justify-between pb-1 pt-1">
                    <span className="text-slate-500">{t('channel.admin')}:</span>
                    <span className="font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> {t('channel.verified')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-lg font-bold text-white">{t('channel.add_modal_title')}</h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Step 1: Verify Admin */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">1</div>
                  <h4 className="font-semibold text-white">{t('channel.step_1')}</h4>
                </div>
                <p className="text-sm text-slate-400 pl-11">{t('channel.step_1_desc')}</p>
                
                <div className="flex gap-3 pl-11">
                  <Input
                    value={channelUsername}
                    onChange={(e) => setChannelUsername(e.target.value)}
                    placeholder="@my_channel"
                    disabled={verifyStatus === "success"}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleVerify} 
                    disabled={!channelUsername || isVerifying || verifyStatus === "success"}
                    variant={verifyStatus === "success" ? "outline" : "default"}
                  >
                    {isVerifying ? <RefreshCw className="animate-spin" size={18} /> : t('channel.verify_admin')}
                  </Button>
                </div>

                {verifyMessage && (
                  <div className={`ml-11 flex items-center gap-2 text-sm p-3 rounded-xl border ${verifyStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {verifyStatus === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {verifyMessage}
                  </div>
                )}
              </div>

              {/* Step 2: Settings (Only visible if verified) */}
              <div className={`space-y-4 transition-all duration-300 ${verifyStatus === 'success' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex items-center gap-3 pt-6 border-t border-slate-800">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${verifyStatus === 'success' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>2</div>
                  <h4 className="font-semibold text-white">{t('channel.step_2')}</h4>
                </div>

                <form onSubmit={handleCreate} className="space-y-5 pl-11">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('channel.name')}</label>
                    <Input
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder={t('channel.name_placeholder')}
                      disabled={verifyStatus !== "success"}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('channel.ai_model')}</label>
                    <select
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={aiModels.length ? (aiModelId ?? '') : aiModel}
                      onChange={(e) => {
                        if (!aiModels.length) {
                          setAiModel(e.target.value);
                          return;
                        }
                        const id = e.target.value ? parseInt(e.target.value, 10) : null;
                        setAiModelId(id);
                        const sel = aiModels.find(m => m.id === id);
                        if (sel) setAiModel(sel.name);
                      }}
                      disabled={verifyStatus !== "success"}
                    >
                      {aiModels.length === 0 ? (
                        <>
                          <option value="gemini-pro">Gemini Pro</option>
                          <option value="gemini-flash">Gemini Flash</option>
                          <option value="gpt-4">GPT-4</option>
                        </>
                      ) : (
                        <>
                          <option value="">{t('channel.select_model')}</option>
                          {aiModels.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('channel.custom_prompt')}</label>
                    <textarea
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={t('channel.custom_prompt_placeholder')}
                      disabled={verifyStatus !== "success"}
                    />
                  </div>
                  <div className="pt-2 flex gap-3 justify-end">
                    <Button type="button" variant="ghost" onClick={closeModal}>
                      {t('channel.cancel')}
                    </Button>
                    <Button type="submit" disabled={verifyStatus !== "success"}>
                      {t('channel.save')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
