'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown, Clock, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface WatchDateSelectorProps {
  value: string; // ISO Format: "YYYY-MM-DD"
  onChange: (isoDate: string) => void;
  className?: string;
  label?: string;
}

export function WatchDateSelector({
  value,
  onChange,
  className = '',
  label,
}: WatchDateSelectorProps) {
  const { t, locale } = useTranslation();
  const effectiveLabel = label || t.watchDate.stamp;
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Month values and translated labels
  const monthList = useMemo(() => {
    return t.watchDate.months.map((mLabel, idx) => ({
      value: String(idx + 1).padStart(2, '0'),
      label: mLabel,
    }));
  }, [t.watchDate.months]);

  // Today and Yesterday ISO strings
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Parse current value
  const [yearStr, monthStr, dayStr] = useMemo(() => {
    if (!value || typeof value !== 'string') return ['', '', ''];
    const parts = value.split('-');
    if (parts.length === 3) {
      return [parts[0], parts[1], parts[2]];
    }
    return ['', '', ''];
  }, [value]);

  // Compute days in selected month and year
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear; y >= 1950; y--) {
      arr.push(y);
    }
    return arr;
  }, [currentYear]);

  const daysInMonth = useMemo(() => {
    const y = parseInt(yearStr, 10) || currentYear;
    const m = parseInt(monthStr, 10) || 1;
    return new Date(y, m, 0).getDate();
  }, [yearStr, monthStr, currentYear]);

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return d < 10 ? `0${d}` : `${d}`;
    });
  }, [daysInMonth]);

  // Handle segmented change
  const handlePartChange = (part: 'day' | 'month' | 'year', val: string) => {
    let newDay = part === 'day' ? val : dayStr || '01';
    let newMonth = part === 'month' ? val : monthStr || '01';
    let newYear = part === 'year' ? val : yearStr || `${currentYear}`;

    // Verify day validity
    const maxDays = new Date(parseInt(newYear, 10), parseInt(newMonth, 10), 0).getDate();
    if (parseInt(newDay, 10) > maxDays) {
      newDay = `${maxDays}`.padStart(2, '0');
    }

    const nextDate = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
    onChange(nextDate);
  };

  // Format display text
  const formattedDisplay = useMemo(() => {
    if (!value) return t.watchDate.noDateSelected;
    if (value === todayStr) return t.watchDate.todayLabel;
    if (value === yesterdayStr) return t.watchDate.yesterdayLabel;
    
    try {
      const [y, m, d] = value.split('-');
      const monthObj = monthList.find((item) => item.value === m);
      const monthName = monthObj ? monthObj.label : m;
      return locale === 'en'
        ? `${monthName} ${parseInt(d, 10)}, ${y}`
        : `${parseInt(d, 10)} ${monthName} ${y}`;
    } catch {
      return value;
    }
  }, [value, todayStr, yesterdayStr, t.watchDate, monthList, locale]);

  const isToday = value === todayStr;
  const isYesterday = value === yesterdayStr;
  const isPreset = isToday || isYesterday;

  return (
    <div className={`space-y-2 font-mono ${className}`}>
      
      {/* Header & Quick Stamp Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-black uppercase text-[#FAFAFA] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#EF4444]" />
          <span>{effectiveLabel}:</span>
          <span className="text-[11px] font-bold text-neutral-500 font-sans">
            ({formattedDisplay})
          </span>
        </label>

        {/* Quick-select Pills */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-neutral-900 border border-[#404040]">
          <button
            type="button"
            onClick={() => {
              onChange(todayStr);
              setIsCustomMode(false);
            }}
            className={`px-2.5 py-1 min-h-[36px] text-[11px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
              isToday && !isCustomMode
                ? 'bg-[#DC2626] text-white shadow-[1px_1px_0px_#000000]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {isToday && !isCustomMode && <Check className="w-3 h-3 stroke-[3]" />}
            <span>{t.watchDate.today}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(yesterdayStr);
              setIsCustomMode(false);
            }}
            className={`px-2.5 py-1 min-h-[36px] text-[11px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
              isYesterday && !isCustomMode
                ? 'bg-[#DC2626] text-white shadow-[1px_1px_0px_#000000]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {isYesterday && !isCustomMode && <Check className="w-3 h-3 stroke-[3]" />}
            <span>{t.watchDate.yesterday}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCustomMode(!isCustomMode)}
            className={`px-2.5 py-1 min-h-[36px] text-[11px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
              (!isPreset || isCustomMode)
                ? 'bg-white text-black shadow-[1px_1px_0px_#000000]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{isCustomMode ? t.watchDate.close : t.watchDate.custom}</span>
          </button>
        </div>
      </div>

      {/* 35mm Fanzine Segmented Date Picker (when Custom Mode is active or non-preset date) */}
      {(isCustomMode || !isPreset) && (
        <div className="p-3 bg-[#171717] border-2 border-[#404040] shadow-[4px_4px_0px_#000000] space-y-2 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
            <span className="text-[10px] font-black uppercase text-[#EF4444] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full inline-block" />
              <span>{t.watchDate.stamp}</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {t.watchDate.canonical}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            {/* GÜN (Day) — 3 cols */}
            <div className="col-span-3">
              <label htmlFor="watch-date-day" className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                {t.watchDate.day}
              </label>
              <div className="relative">
                <select
                  id="watch-date-day"
                  value={dayStr || '01'}
                  onChange={(e) => handlePartChange('day', e.target.value)}
                  className="w-full appearance-none bg-[#0A0A0A] text-[#FAFAFA] font-mono font-black text-xs px-2.5 py-2 pr-6 border-2 border-[#404040] focus:border-[#EF4444] focus:outline-none cursor-pointer"
                >
                  {days.map((d) => (
                    <option key={d} value={d} className="bg-[#171717] text-white">
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#DC2626] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            {/* AY (Month) — 5 cols */}
            <div className="col-span-5">
              <label htmlFor="watch-date-month" className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                {t.watchDate.month}
              </label>
              <div className="relative">
                <select
                  id="watch-date-month"
                  value={monthStr || '01'}
                  onChange={(e) => handlePartChange('month', e.target.value)}
                  className="w-full appearance-none bg-[#0A0A0A] text-[#FAFAFA] font-mono font-black text-xs px-2.5 py-2 pr-6 border-2 border-[#404040] focus:border-[#EF4444] focus:outline-none cursor-pointer"
                >
                  {monthList.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#171717] text-white">
                      {m.value} - {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#DC2626] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            {/* YIL (Year) — 4 cols */}
            <div className="col-span-4">
              <label htmlFor="watch-date-year" className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                {t.watchDate.year}
              </label>
              <div className="relative">
                <select
                  id="watch-date-year"
                  value={yearStr || `${currentYear}`}
                  onChange={(e) => handlePartChange('year', e.target.value)}
                  className="w-full appearance-none bg-[#0A0A0A] text-[#FAFAFA] font-mono font-black text-xs px-2.5 py-2 pr-6 border-2 border-[#404040] focus:border-[#EF4444] focus:outline-none cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={`${y}`} className="bg-[#171717] text-white">
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#DC2626] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
