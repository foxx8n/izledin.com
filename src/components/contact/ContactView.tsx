'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  ArrowLeft, 
  ChevronDown, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { 
  MasterpieceLaurelIcon, 
} from '@/components/icons/CinemaIcons';
import { useTranslation } from '@/lib/i18n/context';

export function ContactView() {
  const { t, locale, href } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'genel',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(
          data.error || 
          (locale === 'en' 
            ? 'Message could not be sent. Please try again later.' 
            : 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.')
        );
      }
      
      setTicketId(data.ticketId);
      setSubmitted(true);
    } catch (error) {
      alert(
        error instanceof Error 
          ? error.message 
          : (locale === 'en' ? 'An unknown error occurred.' : 'Bilinmeyen bir hata oluştu.')
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = t.contact.faqs;

  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12 font-mono">
      
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-neutral-400">
        <Link 
          href={href('/')} 
          className="min-h-[44px] inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{t.contact.breadcrumbsHome}</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#FAFAFA] font-black" aria-current="page">
          {t.contact.breadcrumbsCurrent}
        </span>
      </nav>

      {/* Header Marquee Masthead */}
      <header className="relative overflow-hidden bg-[#0A0A0A] text-[#FAFAFA] border-2 sm:border-4 border-[#404040] shadow-[8px_8px_0px_#000000] p-8 sm:p-12 text-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider font-mono inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
            <MasterpieceLaurelIcon size={14} className="text-white" />
            <span>{t.contact.badge}</span>
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase font-sans tracking-tight text-[#FAFAFA]">
            {t.contact.title}
          </h1>
          <p className="text-xs sm:text-base text-[#D4D4D4] leading-relaxed max-w-xl mx-auto font-sans">
            {t.contact.subtitle}
          </p>
        </div>
      </header>

      {/* 2-Column Grid: Contact Information & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Direct Channels */}
        <section aria-labelledby="channels-heading" className="lg:col-span-5 space-y-4">
          <h2 id="channels-heading" className="text-sm font-black uppercase text-[#FAFAFA] flex items-center gap-2 border-b-2 border-[#404040] pb-2">
            <Mail className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
            <span>{t.contact.directChannelsTitle}</span>
          </h2>

          <address className="space-y-3 not-italic">
            <div className="bg-[#171717] border-2 border-[#404040] p-4 shadow-[4px_4px_0px_#000000] space-y-1">
              <span className="text-[11px] font-black uppercase text-[#EF4444] block">
                {t.contact.generalSupportLabel}
              </span>
              <a
                href="mailto:destek@izledin.com"
                className="text-xs font-bold text-[#FAFAFA] hover:underline block"
              >
                destek@izledin.com
              </a>
              <p className="text-[11px] text-neutral-500 font-sans">
                {t.contact.generalSupportDesc}
              </p>
            </div>

            <div className="bg-[#171717] border-2 border-[#404040] p-4 shadow-[4px_4px_0px_#000000] space-y-1">
              <span className="text-[11px] font-black uppercase text-amber-400 block">
                {t.contact.pressLabel}
              </span>
              <a
                href="mailto:topluluk@izledin.com"
                className="text-xs font-bold text-[#FAFAFA] hover:underline block"
              >
                topluluk@izledin.com
              </a>
              <p className="text-[11px] text-neutral-500 font-sans">
                {t.contact.pressDesc}
              </p>
            </div>

            <div className="bg-[#171717] border-2 border-[#404040] p-4 shadow-[4px_4px_0px_#000000] space-y-1">
              <span className="text-[11px] font-black uppercase text-neutral-400 block">
                {t.contact.legalLabel}
              </span>
              <a
                href="mailto:hukuk@izledin.com"
                className="text-xs font-bold text-[#FAFAFA] hover:underline block"
              >
                hukuk@izledin.com
              </a>
              <p className="text-[11px] text-neutral-500 font-sans">
                {t.contact.legalDesc}
              </p>
            </div>
          </address>

          <div className="bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#404040] p-4 shadow-[4px_4px_0px_#DC2626] space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#EF4444]">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.contact.responseTimeTitle}</span>
            </div>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              {t.contact.responseTimeDesc}
            </p>
          </div>
        </section>

        {/* Right Column: Contact Message Form */}
        <section aria-labelledby="form-heading" className="lg:col-span-7">
          <div className="bg-[#171717] border-2 border-[#404040] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] space-y-6">
            
            <div className="flex items-center justify-between border-b-2 border-[#404040] pb-3">
              <h2 id="form-heading" className="text-base sm:text-lg font-black uppercase text-[#FAFAFA] font-sans">
                {t.contact.formTitle}
              </h2>
              <span className="text-xs text-[#EF4444] font-black uppercase">
                {t.contact.formBadge}
              </span>
            </div>

            {submitted ? (
              <div 
                role="status" 
                aria-live="polite"
                className="p-8 text-center space-y-4 bg-emerald-950/30 border-2 border-emerald-500 animate-in zoom-in-95 duration-200"
              >
                <div className="w-16 h-16 bg-emerald-600 text-white mx-auto flex items-center justify-center border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#000000]">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase font-sans text-[#FAFAFA]">
                    {t.contact.successTitle}
                  </h3>
                  <p className="text-xs text-emerald-300 font-bold uppercase">
                    {t.contact.ticketCodeLabel} <span className="font-mono underline">{ticketId}</span>
                  </p>
                </div>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed max-w-sm mx-auto">
                  {t.contact.successDesc} ({form.email})
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', subject: 'genel', message: '' });
                  }}
                  className="mt-4 px-6 py-2.5 min-h-[44px] bg-white text-black text-xs font-black uppercase border-2 border-black cursor-pointer hover:bg-neutral-200 transition-colors"
                >
                  {t.contact.newMessageButton}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label htmlFor="contact-name" className="text-xs font-black uppercase text-[#FAFAFA]">
                      {t.contact.nameLabel}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t.contact.namePlaceholder}
                      autoComplete="name"
                      className="w-full h-11 bg-[#0A0A0A] text-[#FAFAFA] text-xs font-bold px-3 border-2 border-[#404040] focus:border-[#DC2626] focus:outline-none"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label htmlFor="contact-email" className="text-xs font-black uppercase text-[#FAFAFA]">
                      {t.contact.emailLabel}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={t.contact.emailPlaceholder}
                      autoComplete="email"
                      className="w-full h-11 bg-[#0A0A0A] text-[#FAFAFA] text-xs font-bold px-3 border-2 border-[#404040] focus:border-[#DC2626] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Subject Selector */}
                <div className="space-y-1">
                  <label htmlFor="contact-subject" className="text-xs font-black uppercase text-[#FAFAFA]">
                    {t.contact.subjectLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="contact-subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-11 bg-[#0A0A0A] text-[#FAFAFA] text-xs font-bold px-3 border-2 border-[#404040] focus:border-[#DC2626] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="genel">{t.contact.subjectOptions.general}</option>
                      <option value="hata">{t.contact.subjectOptions.bug}</option>
                      <option value="izdas">{t.contact.subjectOptions.matching}</option>
                      <option value="telif">{t.contact.subjectOptions.copyright}</option>
                      <option value="isbirligi">{t.contact.subjectOptions.partnership}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 pointer-events-none text-neutral-500" />
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-1">
                  <label htmlFor="contact-message" className="text-xs font-black uppercase text-[#FAFAFA]">
                    {t.contact.messageLabel}
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t.contact.messagePlaceholder}
                    className="w-full bg-[#0A0A0A] text-[#FAFAFA] text-xs font-bold p-3 border-2 border-[#404040] focus:border-[#DC2626] focus:outline-none font-sans"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 min-h-[48px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#000000] cursor-pointer flex items-center justify-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.contact.sending}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t.contact.sendButton}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.contact.kvkkNote}</span>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Sıkça Sorulan Sorular (FAQ) Accordion */}
      <section aria-labelledby="faq-section-heading" className="bg-[#171717] border-2 border-[#404040] shadow-[6px_6px_0px_#000000] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#404040] pb-3">
          <HelpCircle className="w-4 h-4 text-[#EF4444]" />
          <h2 id="faq-section-heading" className="text-base sm:text-lg font-black uppercase text-[#FAFAFA] font-sans">
            {t.contact.faqTitle}
          </h2>
        </div>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="border-2 border-[#333333] bg-neutral-900 transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  className="w-full p-4 min-h-[48px] text-left flex items-center justify-between gap-3 font-black text-xs sm:text-sm uppercase text-[#FAFAFA] cursor-pointer font-sans"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#DC2626] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-neutral-300 font-sans leading-relaxed border-t border-neutral-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </main>
  );
}
