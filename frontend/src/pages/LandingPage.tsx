import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, ChevronRight, Zap, Shield, BarChart3, Globe, Twitter, Github, Linkedin, Check, Star, Settings, Send, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useTranslation } from "react-i18next";
import { SEO } from "../components/seo/SEO";

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

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
      button: t('pricing.free_btn'),
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

  const faqs = [
    { q: t('home.faq_1_q'), a: t('home.faq_1_a') },
    { q: t('home.faq_2_q'), a: t('home.faq_2_a') },
    { q: t('home.faq_3_q'), a: t('home.faq_3_a') },
    { q: t('home.faq_4_q'), a: t('home.faq_4_a') },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <SEO title={t("home.seo_title")} />
      
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Bot size={28} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t('app_name')}</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">{t('home.nav_features')}</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">{t('home.nav_how')}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t('home.nav_pricing')}</a>
            <a href="#faq" className="hover:text-white transition-colors">{t('home.nav_faq')}</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400 bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
              <Globe size={16} className="ml-2 mr-1 text-slate-500" />
              <button onClick={() => changeLanguage('uz')} className={`px-3 py-1.5 rounded-lg transition-all ${i18n.language === 'uz' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white hover:bg-slate-800'}`}>UZ</button>
              <button onClick={() => changeLanguage('ru')} className={`px-3 py-1.5 rounded-lg transition-all ${i18n.language === 'ru' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white hover:bg-slate-800'}`}>RU</button>
              <button onClick={() => changeLanguage('en')} className={`px-3 py-1.5 rounded-lg transition-all ${i18n.language === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white hover:bg-slate-800'}`}>EN</button>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
                {t('home.login')}
              </Link>
              <Link to="/register">
                <Button size="md" className="shadow-lg shadow-indigo-500/20">{t('home.register')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Adjusted to fit above the fold */}
      <section className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto overflow-hidden py-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-300 text-sm font-bold tracking-wide mb-6 border border-indigo-500/20 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            {t('home.badge', { app: t('app_name') })}
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            {t('home.title').split('AI').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">AI</span>}
              </React.Fragment>
            ))}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 shadow-xl shadow-indigo-500/20">
                {t('home.start_now')} <ChevronRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 border-slate-700 hover:bg-slate-800 text-white">
              {t('home.demo')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-900 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">{t('home.features_title')}</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('home.features_subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: t('home.feat_auto_title'), desc: t('home.feat_auto_desc'), color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { icon: Shield, title: t('home.feat_sec_title'), desc: t('home.feat_sec_desc'), color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { icon: BarChart3, title: t('home.feat_stat_title'), desc: t('home.feat_stat_desc'), color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            ].map((feature, i) => (
              <div key={i} className={`p-8 rounded-3xl bg-slate-950 border ${feature.border} shadow-lg hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-2 group`}>
                <div className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-lg">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">{t('home.how_it_works_title')}</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('home.how_it_works_subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 z-0"></div>
            
            {[
              { icon: Bot, title: t('home.step1_title'), desc: t('home.step1_desc'), step: "1" },
              { icon: Settings, title: t('home.step2_title'), desc: t('home.step2_desc'), step: "2" },
              { icon: Send, title: t('home.step3_title'), desc: t('home.step3_desc'), step: "3" },
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-indigo-500/30 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/10 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center border-4 border-slate-950">
                    {item.step}
                  </div>
                  <item.icon size={40} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">{t('home.pricing_title')}</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t('home.pricing_subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-3xl bg-slate-950 border ${plan.popular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10' : 'border-slate-800'} flex flex-col`}>
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
                <Link to="/register" className="w-full">
                  <Button variant={plan.variant} size="lg" className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/25' : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'}`}>
                    {plan.button}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-950 relative">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">{t('home.faq_title')}</h2>
            <p className="text-lg text-slate-400">{t('home.faq_subtitle')}</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-800 rounded-2xl bg-slate-900/50 overflow-hidden transition-all">
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-white text-lg">{faq.q}</span>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/30 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">{t('home.cta_title')}</h2>
          <p className="text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto">
            {t('home.cta_desc')}
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-10 h-14 shadow-2xl shadow-indigo-500/30">
              {t('home.cta_btn')} <ChevronRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 text-white mb-6">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl">
                  <Bot size={24} />
                </div>
                <span className="text-2xl font-extrabold tracking-tight">{t('app_name')}</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-8 text-lg">
                {t('home.subtitle')}
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all"><Twitter size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all"><Github size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all"><Linkedin size={18} /></a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors">{t('home.nav_features')}</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-indigo-400 transition-colors">{t('home.nav_how')}</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-indigo-400 transition-colors">{t('home.nav_pricing')}</a></li>
                <li><a href="#faq" className="text-slate-400 hover:text-indigo-400 transition-colors">{t('home.nav_faq')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">Careers</a></li>
                <li><a href="#contact" className="text-slate-400 hover:text-indigo-400 transition-colors">{t('home.nav_contact')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500">© 2026 {t('app_name')}. Barcha huquqlar himoyalangan.</p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Maxfiylik siyosati</a>
              <a href="#" className="hover:text-white transition-colors">Foydalanish shartlari</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
