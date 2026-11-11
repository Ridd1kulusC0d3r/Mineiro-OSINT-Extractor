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
        className={`tabs tabs-sm tabs-seg hidden sm:flex ${
          variant === 'dropdown' ? '!hidden' : ''
        }`}
        role="group"
        aria-label={tr('lang.select')}
      >
        <div className="flex items-center text-ink-3 pl-2 pr-1" title={tr('lang.select')}>
          <Globe className="w-3.5 h-3.5" />
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
                className="tab select-none"
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
          className="btn btn-icon gap-1.5 px-3"
          title={`${tr('lang.active')}: ${currentOption.nativeLabel}`}
        >
          <Globe className="w-3.5 h-3.5 text-ink" />
          <span className="uppercase text-[11px] font-bold">{currentOption.code}</span>
          <ChevronDown
            className={`w-3 h-3 text-ink-2 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-ink' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            id="language-selector-menu"
            role="listbox"
            aria-label={tr('lang.available')}
            className="dialog absolute right-0 top-full mt-1.5 w-44 p-1 z-50 divide-y divide-rule-2"
          >
            <div className="px-2.5 py-1.5 text-[10px] text-ink-2 uppercase tracking-wider font-semibold">
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
                        ? 'bg-paper text-ink font-bold border border-ink/30'
                        : 'text-ink hover:bg-card hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-[10px] px-1 py-0.2 bg-paper border border-rule rounded-sm text-ink-2 font-bold">
                        {option.code}
                      </span>
                      <span className="truncate">{option.nativeLabel}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-ink shrink-0" />}
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
