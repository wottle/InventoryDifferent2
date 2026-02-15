"use client";

import { useState, useEffect } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--muted-foreground)]">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="input-retro w-full pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
      />
      <button
        onClick={() => handleChange('')}
        className={`absolute inset-y-0 right-0 pr-3 flex items-center ${localValue ? '' : 'pointer-events-none opacity-0'}`}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
