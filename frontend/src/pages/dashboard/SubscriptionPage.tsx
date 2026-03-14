import React from "react";
import { Check, Zap, Shield, Star } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/seo/SEO";

export const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();

  const plans = [
    {
      name: t('pricing.free_name'),
      price: '$0',
      period: t('pricing.period_month'),
      desc: t('pricing.free_desc'),
      icon: Shield,
      color: 'text-slate-400',
      bg: 'bg-slate-800',
      features: [t('pricing.free_f1'), t('pricing.free_f2'), t('pricing.free_f3'), t('pricing.free_f4')],
      button: t('pricing.free_btn_current'),
      variant: 'outline' as const,
    },
    {
      name: t('pricing.pro_name'),
      price: '$9.99',
      period: t('pricing.period_month'),
      desc: t('pricing.pro_desc'),
      icon: Zap,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/20',
      popular: true,
      features: [t('pricing.pro_f1'), t('pricing.pro_f2'), t('pricing.pro_f3'), t('pricing.pro_f4'), t('pricing.pro_f5')],
      button: t('pricing.pro_btn'),
      variant: 'default' as const,
    },
    {
      name: t('pricing.max_name'),
      price: '$29.99',
      period: t('pricing.period_month'),
      desc: t('pricing.max_desc'),
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
      features: [t('pricing.max_f1'), t('pricing.max_f2'), t('pricing.max_f3'), t('pricing.max_f4'), t('pricing.max_f5')],
      button: t('pricing.max_btn'),
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <SEO title={t('dashboard.subscription')} />
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6 border border-indigo-500/20">
          <Star size={14} /> {t("pricing.badge")}
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{t('dashboard.subscription')}</h2>
        <p className="text-slate-400 mt-4 text-lg">{t("pricing.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, i) => (
          <div key={i} className={`relative p-8 rounded-3xl bg-slate-900 border ${plan.popular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10' : 'border-slate-800'} flex flex-col`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-indigo-500/30">
                {t("pricing.popular")}
              </div>
            )}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${plan.bg} ${plan.color}`}>
              <plan.icon size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">{plan.desc}</p>
            <div className="mb-8 pb-8 border-b border-slate-800">
              <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
              <span className="text-slate-400 font-medium">{plan.period}</span>
            </div>
            <ul className="space-y-5 mb-8 flex-1">
              {plan.features.map((feat, j) => (
                <li key={j} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">{feat}</span>
                </li>
              ))}
            </ul>
            <Button variant={plan.variant} size="lg" className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/25' : 'bg-slate-950 text-white border-slate-700 hover:bg-slate-800'}`}>
              {plan.button}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
