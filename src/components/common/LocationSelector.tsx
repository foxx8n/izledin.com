'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { 
  TURKEY_LOCATIONS, 
  getAllProvinces, 
  getDistricts, 
  parseLocationString, 
  formatLocationString 
} from '@/data/locations';

interface LocationSelectorProps {
  value?: string;
  onChange: (locationStr: string) => void;
  className?: string;
  allowAllDistricts?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  className = '',
  allowAllDistricts = false,
}: LocationSelectorProps) {
  const initial = parseLocationString(value);
  const [selectedProvince, setSelectedProvince] = useState<string>(initial.province || 'İstanbul');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initial.district || 'Kadıköy');

  const provinces = getAllProvinces();
  const districts = getDistricts(selectedProvince);

  useEffect(() => {
    if (value) {
      const parsed = parseLocationString(value);
      setSelectedProvince(parsed.province || 'İstanbul');
      setSelectedDistrict(parsed.district || '');
    }
  }, [value]);

  const handleProvinceChange = (newProvince: string) => {
    setSelectedProvince(newProvince);
    const newDistricts = getDistricts(newProvince);
    const defaultDistrict = newDistricts.length > 0 ? (allowAllDistricts ? 'Tüm İlçeler' : newDistricts[0]) : '';
    setSelectedDistrict(defaultDistrict);
    onChange(formatLocationString(defaultDistrict, newProvince));
  };

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    onChange(formatLocationString(newDistrict, selectedProvince));
  };

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono ${className}`}>
      {/* Province Select */}
      <div className="relative flex-1">
        <label className="block text-xs font-black uppercase  text-[#FAFAFA] mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5  text-[#EF4444]" aria-hidden="true" />
          <span>ŞEHİR (İL)</span>
        </label>
        <div className="relative">
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            aria-label="Şehir Seçimi"
            className="w-full appearance-none px-3 py-2.5  bg-[#171717]  text-[#FAFAFA] text-xs font-black uppercase border-2  border-[#404040] focus:outline-none focus:border-[#DC2626] cursor-pointer pr-8  shadow-[2px_2px_0px_#000000]"
          >
            {provinces.map((prov) => (
              <option key={prov} value={prov} className=" bg-[#171717]  text-[#FAFAFA]">
                {prov}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4  text-[#FAFAFA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" aria-hidden="true" />
        </div>
      </div>

      {/* District Select */}
      <div className="relative flex-1">
        <label className="block text-xs font-black uppercase  text-[#FAFAFA] mb-1.5">
          İLÇE / BÖLGE
        </label>
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={districts.length === 0}
            aria-label="İlçe Seçimi"
            className="w-full appearance-none px-3 py-2.5  bg-[#171717]  text-[#FAFAFA] text-xs font-black uppercase border-2  border-[#404040] focus:outline-none focus:border-[#DC2626] cursor-pointer pr-8  shadow-[2px_2px_0px_#000000] disabled:opacity-50"
          >
            {allowAllDistricts && (
              <option value="Tüm İlçeler" className=" bg-[#171717]  text-[#FAFAFA]">
                Tüm İlçeler
              </option>
            )}
            {districts.map((dist) => (
              <option key={dist} value={dist} className=" bg-[#171717]  text-[#FAFAFA]">
                {dist}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4  text-[#FAFAFA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
