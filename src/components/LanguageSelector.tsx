import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n, Language } from '../utils/i18n';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', region: 'US/UK' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', region: 'BR/PT' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', region: 'ES/LATAM' },
];

interface LanguageSelectorProps {
  variant?: 'segmented' | 'dropdown' | 'auto';
  className?: string;
}

export function LanguageSelector({ variant = 'auto', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, tr } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (newLang: Language) => {
    setLanguage(newLang);
    // Explicit double safety persistence in localStorage
    try {
      localStorage.setItem('mineiro_language_preference', newLang);
    } catch (e) {
      console.warn('Unable to persist language in localStorage', e);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      id="language-selector-container"
      className={`relative inline-flex items-center font-mono ${className}`}
    >
      {/* Segmented View for Tablet & Desktop (or explicit segmented variant) */}
      <div
        id="language-selector-segmented"
        className={`hidden sm:flex items-center bg-[#1B1915] border border-[#37332B] rounded-md p-0.5 text-xs ${
          variant === 'dropdown' ? '!hidden' : ''
        }`}
        role="group"
        aria-label={tr('lang.select')}
      >
        <div className="flex items-center text-[#B9B4A6] px-1.5 py-1" title={tr('lang.select')}>
          <Globe className="w-3.5 h-3.5 text-[#ECE8DD]" />
        </div>

        <div className="flex items-center gap-0.5">
          {SUPPORTED_LANGUAGES.map((option) => {
            const isSelected = language === option.code;
            return (
              <button
                key={option.code}
                id={`lang-btn-${option.code}`}
                type="button"
                onClick={() => handleSelectLanguage(option.code)}
                aria-pressed={isSelected}
                className={`px-2 py-1 uppercase rounded-sm text-[11px] font-bold tracking-wider transition-all select-none ${
                  isSelected
                    ? 'bg-[#F0885A] text-[#131210] shadow-[0_0_8px_rgba(236,232,221,0.3)]'
                    : 'text-[#B9B4A6] hover:text-[#ECE8DD] hover:bg-[#131210]'
                }`}
                title={`${option.label} (${option.nativeLabel})`}
              >
                {option.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Dropdown Trigger for Mobile (or when variant is dropdown) */}
      <div className={`sm:hidden ${variant === 'dropdown' ? '!block' : ''}`}>
        <button
          id="language-selector-trigger"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="flex items-center gap-1.5 px-2.5 h-8.5 bg-[#1B1915] border border-[#37332B] hover:border-[#908B7D] rounded-md text-xs text-[#ECE8DD] font-bold tracking-wider transition-colors"
          title={`${tr('lang.active')}: ${currentOption.nativeLabel}`}
        >
          <Globe className="w-3.5 h-3.5 text-[#ECE8DD]" />
          <span className="uppercase text-[11px] font-bold">{currentOption.code}</span>
          <ChevronDown
            className={`w-3 h-3 text-[#B9B4A6] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#ECE8DD]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            id="language-selector-menu"
            role="listbox"
            aria-label={tr('lang.available')}
            className="absolute right-0 top-full mt-1.5 w-44 bg-[#1B1915] border border-[#37332B] rounded-md shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#37332B]/40"
          >
            <div className="px-2.5 py-1.5 text-[10px] text-[#B9B4A6] uppercase tracking-wider font-semibold">
              {tr('lang.select')}
            </div>
            <div className="py-0.5 space-y-0.5">
              {SUPPORTED_LANGUAGES.map((option) => {
                const isSelected = language === option.code;
                return (
                  <button
                    key={option.code}
                    id={`lang-menu-item-${option.code}`}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelectLanguage(option.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs text-left transition-colors font-mono ${
                      isSelected
                        ? 'bg-[#131210] text-[#ECE8DD] font-bold border border-[#ECE8DD]/30'
                        : 'text-[#ECE8DD] hover:bg-[#221F1A] hover:text-[#ECE8DD]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-[10px] px-1 py-0.2 bg-[#131210] border border-[#37332B] rounded-sm text-[#B9B4A6] font-bold">
                        {option.code}
                      </span>
                      <span className="truncate">{option.nativeLabel}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#ECE8DD] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
