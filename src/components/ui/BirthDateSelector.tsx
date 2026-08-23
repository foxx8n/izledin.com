'use client';

import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { CinemaCalendarIcon } from '@/components/icons/CinemaIcons';

interface BirthDateSelectorProps {
  value: string; // Format: "YYYY-MM-DD" or ""
  onChange: (isoDate: string) => void;
  className?: string;
  required?: boolean;
}

const MONTHS = [
  { value: '01', label: '01 - Ocak' },
  { value: '02', label: '02 - Şubat' },
  { value: '03', label: '03 - Mart' },
  { value: '04', label: '04 - Nisan' },
  { value: '05', label: '05 - Mayıs' },
  { value: '06', label: '06 - Haziran' },
  { value: '07', label: '07 - Temmuz' },
  { value: '08', label: '08 - Ağustos' },
  { value: '09', label: '09 - Eylül' },
  { value: '10', label: '10 - Ekim' },
  { value: '11', label: '11 - Kasım' },
  { value: '12', label: '12 - Aralık' },
];

export function BirthDateSelector({
  value,
  onChange,
  className = '',
  required = false,
}: BirthDateSelectorProps) {
  // Parse current value
  const [yearStr, monthStr, dayStr] = useMemo(() => {
    if (!value || typeof value !== 'string') return ['', '', ''];
    const parts = value.split('-');
    if (parts.length === 3) {
      return [parts[0], parts[1], parts[2]];
    }
    return ['', '', ''];
  }, [value]);

  // Compute available years (from current year - 18 down to 1930)
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 18;
  const minYear = 1930;
  
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [maxYear, minYear]);

  // Calculate days in selected month and year
  const daysInMonth = useMemo(() => {
    const y = parseInt(yearStr, 10) || maxYear;
    const m = parseInt(monthStr, 10) || 1;
    return new Date(y, m, 0).getDate();
  }, [yearStr, monthStr, maxYear]);

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return d < 10 ? `0${d}` : `${d}`;
    });
  }, [daysInMonth]);

  // Update handler
  const handlePartChange = (part: 'day' | 'month' | 'year', val: string) => {
    let newDay = part === 'day' ? val : dayStr;
    let newMonth = part === 'month' ? val : monthStr;
    let newYear = part === 'year' ? val : yearStr;

    // Default helpers if one is chosen first
    if (!newYear) newYear = `${maxYear}`;
    if (!newMonth) newMonth = '01';
    if (!newDay) newDay = '01';

    // Verify day is within valid range for selected month
    const maxDays = new Date(parseInt(newYear, 10), parseInt(newMonth, 10), 0).getDate();
    if (parseInt(newDay, 10) > maxDays) {
      newDay = `${maxDays}`;
    }

    // Enforce a TRUE 18+ gate on the full date. A year-only check
    // (currentYear - 18) let users pick a date late in their 18th year and
    // pass at 17.
    const now = new Date();
    const picked = new Date(
      parseInt(newYear, 10),
      parseInt(newMonth, 10) - 1,
      parseInt(newDay, 10),
    );
    const cutoff = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    if (picked > cutoff) {
      const pad = (n: number) => String(n).padStart(2, '0');
      newYear = `${cutoff.getFullYear()}`;
      newMonth = pad(cutoff.getMonth() + 1);
      newDay = pad(cutoff.getDate());
    }

    onChange(`${newYear}-${newMonth}-${newDay}`);
  };

  // Compute Age & Generation metadata for cinephile profile
  const cinephileAgeInfo = useMemo(() => {
    if (!yearStr || !monthStr || !dayStr) return null;
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);
    if (!y || !m || !d) return null;

    const today = new Date();
    let age = today.getFullYear() - y;
    const monthDiff = today.getMonth() + 1 - m;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
      age--;
    }

    let era = '';
    if (y < 1970) era = 'Klasik Dönem Sinefili';
    else if (y < 1980) era = '70’ler Yeni Hollywood Kuşağı';
    else if (y < 1990) era = '80’ler Kült Sinema Kuşağı';
    else if (y < 2000) era = '90’lar Selüloit Kuşağı';
    else if (y < 2010) era = '2000’ler Dijital Sinema Kuşağı';
    else era = 'Genç Sinefil Kuşağı';

    return { age, era };
  }, [yearStr, monthStr, dayStr]);

  return (
    <div className={`space-y-2 font-mono ${className}`}>
      {/* 3-Column Custom Grid */}
      <div className="grid grid-cols-12 gap-2">
        
        {/* GÜN (Day) — 3 cols */}
        <div className="col-span-3 relative">
          <label className="block text-[10px] font-black uppercase  text-[#A3A3A3] mb-1">
            GÜN
          </label>
          <div className="relative">
            <select
              value={dayStr || '01'}
              onChange={(e) => handlePartChange('day', e.target.value)}
              required={required}
              className="w-full appearance-none  bg-[#171717]  text-[#FAFAFA] font-mono font-black text-xs px-2.5 py-2.5 pr-6 border-2  border-[#404040]  focus:border-[#EF4444]  shadow-[2px_2px_0px_#000000] focus:outline-none cursor-pointer transition-colors"
            >
              {days.map((d) => (
                <option key={d} value={d} className=" bg-[#171717]  text-[#FAFAFA]">
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#DC2626] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>
        </div>

        {/* AY (Month) — 5 cols */}
        <div className="col-span-5 relative">
          <label className="block text-[10px] font-black uppercase  text-[#A3A3A3] mb-1">
            AY
          </label>
          <div className="relative">
            <select
              value={monthStr || '01'}
              onChange={(e) => handlePartChange('month', e.target.value)}
              required={required}
              className="w-full appearance-none  bg-[#171717]  text-[#FAFAFA] font-mono font-black text-xs px-2.5 py-2.5 pr-6 border-2  border-[#404040]  focus:border-[#EF4444]  shadow-[2px_2px_0px_#000000] focus:outline-none cursor-pointer transition-colors"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className=" bg-[#171717]  text-[#FAFAFA]">
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#DC2626] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>
        </div>

        {/* YIL (Year) — 4 cols */}
        <div className="col-span-4 relative">
          <label className="block text-[10px] font-black uppercase  text-[#A3A3A3] mb-1">
            YIL
          </label>
          <div className="relative">
            <select
              value={yearStr || `${maxYear}`}
              onChange={(e) => handlePartChange('year', e.target.value)}
              required={required}
              className="w-full appearance-none  bg-[#171717]  text-[#FAFAFA] font-mono font-black text-xs px-2.5 py-2.5 pr-6 border-2  border-[#404040]  focus:border-[#EF4444]  shadow-[2px_2px_0px_#000000] focus:outline-none cursor-pointer transition-colors"
            >
              {years.map((y) => (
                <option key={y} value={`${y}`} className=" bg-[#171717]  text-[#FAFAFA]">
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#DC2626] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
          </div>
        </div>

      </div>

      {/* Cinephile Age & Generation Micro Stamp */}
      {cinephileAgeInfo && (
        <div className="flex items-center justify-between px-2.5 py-1  bg-[#171717] border  border-[#404040] text-[10px] font-bold  text-[#A3A3A3] select-none">
          <div className="flex items-center gap-1.5">
            <CinemaCalendarIcon size={12} className="text-[#DC2626]" />
            <span>Yaş: <strong className=" text-[#FAFAFA]">{cinephileAgeInfo.age}</strong></span>
          </div>
          <span className=" text-[#EF4444] font-black uppercase tracking-tight">
            {cinephileAgeInfo.era}
          </span>
        </div>
      )}
    </div>
  );
}
