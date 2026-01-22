// components/SelectorModel.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectorModelProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
  className?: string;
}

const SelectorModel: React.FC<SelectorModelProps> = ({
  value,
  options,
  onChange,
  disabled,
  placeholder = "Chọn...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full px-3 py-2.5 bg-white rounded-lg border transition-all outline-none text-sm ${
          disabled
            ? "opacity-60 border-slate-200 cursor-not-allowed bg-slate-50"
            : "border-slate-200 hover:border-indigo-300 hover:shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
        } ${isOpen ? "border-indigo-500 ring-2 ring-indigo-100" : ""}`}
      >
        <span
          className={`truncate ${!value ? "text-slate-400" : "text-slate-700"}`}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between group ${
                value === option.value
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-700"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectorModel;