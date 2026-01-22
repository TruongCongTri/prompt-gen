// components/ModelSelector.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Bot } from "lucide-react";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  disabled,
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

  const models = [
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview)" },
  ];

  const selectedLabel =
    models.find((m) => m.value === value)?.label || "Chọn Model";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border transition-all w-full md:w-auto outline-none ${
          disabled
            ? "opacity-50 border-slate-200 cursor-not-allowed"
            : "border-slate-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer"
        } ${isOpen ? "ring-2 ring-indigo-100 border-indigo-300" : ""}`}
      >
        <Bot
          className={`w-4 h-6 ml-1 flex-shrink-0 ${disabled ? "text-slate-400" : "text-emerald-500"}`}
        />
        <span className="text-xs font-medium text-slate-700 w-32 md:w-40 text-left truncate">
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={() => {
                onChange(model.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between group ${
                value === model.value
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-700"
              }`}
            >
              <span className="truncate">{model.label}</span>
              {value === model.value && (
                <Check className="w-3 h-3 text-indigo-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;