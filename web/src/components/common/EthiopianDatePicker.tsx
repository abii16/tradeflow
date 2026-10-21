import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Check, X } from 'lucide-react';
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_DAYS_SHORT,
  EthiopianDate,
  toEthiopian,
  toGregorian,
  getDaysInEthiopianMonth,
  getEthiopianDayOfWeek,
  formatEthiopian,
} from '@/lib/ethiopianCalendar';

interface EthiopianDatePickerProps {
  value?: string; // Standard ISO date string e.g. "2026-10-21T09:00"
  onChange: (isoString: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function EthiopianDatePicker({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'ቀንና ሰዓት ይምረጡ (e.g. ጥቅምት 11, 2017)',
}: EthiopianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected or today's date in Ethiopian Calendar
  const todayEth = toEthiopian(new Date());

  const getInitialEth = (): EthiopianDate => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return toEthiopian(d);
      }
    }
    return {
      year: todayEth.year,
      month: todayEth.month,
      day: todayEth.day,
      hour: 9,
      minute: 0,
    };
  };

  const [selectedEth, setSelectedEth] = useState<EthiopianDate>(getInitialEth);
  const [viewYear, setViewYear] = useState<number>(getInitialEth().year);
  const [viewMonth, setViewMonth] = useState<number>(getInitialEth().month);

  // Sync when value prop changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const eth = toEthiopian(d);
        setSelectedEth(eth);
        setViewYear(eth.year);
        setViewMonth(eth.month);
      }
    }
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalDaysInMonth = getDaysInEthiopianMonth(viewYear, viewMonth);
  const startDayOfWeek = getEthiopianDayOfWeek(viewYear, viewMonth, 1); // 0=Sunday, 6=Saturday

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(13);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 13) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const updated: EthiopianDate = {
      ...selectedEth,
      year: viewYear,
      month: viewMonth,
      day,
    };
    setSelectedEth(updated);

    // Convert to ISO string and trigger onChange
    const gDate = toGregorian(updated.year, updated.month, updated.day, updated.hour, updated.minute);
    const isoStr = formatToInputIso(gDate);
    onChange(isoStr);
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: number) => {
    const updated: EthiopianDate = {
      ...selectedEth,
      [type]: val,
    };
    setSelectedEth(updated);

    const gDate = toGregorian(updated.year, updated.month, updated.day, updated.hour, updated.minute);
    const isoStr = formatToInputIso(gDate);
    onChange(isoStr);
  };

  const handlePresetQuick = (preset: 'today' | 'tomorrow' | 'in2days') => {
    const d = new Date();
    if (preset === 'tomorrow') d.setDate(d.getDate() + 1);
    if (preset === 'in2days') d.setDate(d.getDate() + 2);
    d.setHours(selectedEth.hour || 9, selectedEth.minute || 0, 0, 0);

    const eth = toEthiopian(d);
    setSelectedEth(eth);
    setViewYear(eth.year);
    setViewMonth(eth.month);

    const isoStr = formatToInputIso(d);
    onChange(isoStr);
  };

  const formatToInputIso = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Compute corresponding Gregorian representation for tooltip / preview
  const currentGregorian = toGregorian(
    selectedEth.year,
    selectedEth.month,
    selectedEth.day,
    selectedEth.hour,
    selectedEth.minute
  );

  const displayString = value ? formatEthiopian(selectedEth, { includeTime: true, amharic: true }) : '';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Input Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 pl-9 pr-20 bg-[#1C1C1C] border ${
          isOpen ? 'border-[#3ECF8E] ring-2 ring-[#3ECF8E]/20' : 'border-[#2E2E2E] hover:border-[#3E3E3E]'
        } h-10 text-xs font-medium rounded-lg text-[#EDEDED] transition-all cursor-pointer flex items-center select-none ${className}`}
      >
        <Calendar size={15} className="absolute left-3 text-[#8F8F8F] pointer-events-none" />

        {displayString ? (
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-[#EDEDED] truncate">{displayString}</span>
          </div>
        ) : (
          <span className="text-[#666666] truncate">{placeholder}</span>
        )}

        <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20">
            ዓ.ም.
          </span>
        </div>
      </div>

      {/* Hidden input for HTML form compliance */}
      <input
        type="hidden"
        name="earliest_pickup"
        value={value || ''}
        required={required}
      />

      {/* Ethiopian Calendar Dropdown Picker */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-80 bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl shadow-2xl shadow-black/80 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Month & Year Selector with Navigation */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#2E2E2E]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#2A2A2A] transition-colors"
              title="ያለፈው ወር"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-[#2A2A2A] border border-[#3E3E3E] rounded px-2 py-1 text-xs font-bold text-[#EDEDED] focus:outline-none focus:border-[#3ECF8E] cursor-pointer"
              >
                {ETHIOPIAN_MONTHS.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-[#2A2A2A] border border-[#3E3E3E] rounded px-2 py-1 text-xs font-mono font-bold text-[#EDEDED] focus:outline-none focus:border-[#3ECF8E] cursor-pointer"
              >
                {[viewYear - 2, viewYear - 1, viewYear, viewYear + 1, viewYear + 2].map((y) => (
                  <option key={y} value={y}>
                    {y} ዓ.ም.
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#2A2A2A] transition-colors"
              title="ቀጣይ ወር"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 justify-between">
            <button
              type="button"
              onClick={() => handlePresetQuick('today')}
              className="flex-1 py-1 px-2 rounded text-[11px] font-semibold bg-[#262626] hover:bg-[#333333] text-[#EDEDED] border border-[#333333] transition-colors text-center"
            >
              ዛሬ
            </button>
            <button
              type="button"
              onClick={() => handlePresetQuick('tomorrow')}
              className="flex-1 py-1 px-2 rounded text-[11px] font-semibold bg-[#262626] hover:bg-[#333333] text-[#EDEDED] border border-[#333333] transition-colors text-center"
            >
              ነገ
            </button>
            <button
              type="button"
              onClick={() => handlePresetQuick('in2days')}
              className="flex-1 py-1 px-2 rounded text-[11px] font-semibold bg-[#262626] hover:bg-[#333333] text-[#EDEDED] border border-[#333333] transition-colors text-center"
            >
              በ48 ሰዓት
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {ETHIOPIAN_DAYS_SHORT.map((d, i) => (
              <span
                key={d}
                className={`text-[10px] font-bold py-0.5 ${i === 0 ? 'text-amber-400/80' : 'text-[#8F8F8F]'}`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty offset spaces before 1st day of month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {/* Days 1 to 30 (or 5/6 for Pagume) */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedEth.day === day &&
                selectedEth.month === viewMonth &&
                selectedEth.year === viewYear;
              const isToday =
                todayEth.day === day &&
                todayEth.month === viewMonth &&
                todayEth.year === viewYear;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#3ECF8E] text-[#1C1C1C] font-bold shadow-md shadow-[#3ECF8E]/30 scale-105'
                      : isToday
                      ? 'border border-[#3ECF8E] text-[#3ECF8E] hover:bg-[#2A2A2A]'
                      : 'text-[#EDEDED] hover:bg-[#2A2A2A] hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Bar */}
          <div className="pt-2 border-t border-[#2E2E2E] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8F8F8F] flex items-center gap-1.5 font-medium">
                <Clock size={13} className="text-[#3ECF8E]" />
                የመጫኛ ሰዓት (Pickup Time):
              </span>
              <div className="flex items-center gap-1 font-mono">
                <select
                  value={selectedEth.hour}
                  onChange={(e) => handleTimeChange('hour', Number(e.target.value))}
                  className="bg-[#2A2A2A] border border-[#3E3E3E] rounded px-1.5 py-0.5 text-xs text-[#EDEDED] cursor-pointer"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <span className="text-[#8F8F8F]">:</span>
                <select
                  value={selectedEth.minute}
                  onChange={(e) => handleTimeChange('minute', Number(e.target.value))}
                  className="bg-[#2A2A2A] border border-[#3E3E3E] rounded px-1.5 py-0.5 text-xs text-[#EDEDED] cursor-pointer"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gregorian Conversion Hint */}
            <div className="text-[10px] font-mono text-[#8F8F8F] bg-[#161616] px-2.5 py-1.5 rounded border border-[#262626] flex items-center justify-between">
              <span>G.C. Equivalent:</span>
              <span className="text-zinc-300">
                {currentGregorian.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                {String(selectedEth.hour).padStart(2, '0')}:{String(selectedEth.minute).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-[#3ECF8E] hover:bg-[#34b27b] text-[#1C1C1C] px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              <span>አረጋግጥ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
