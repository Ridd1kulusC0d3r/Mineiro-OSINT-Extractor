// Preset cards of the modal: icon and i18n keys (presentation only).
import { Globe, Layers, Mail, Zap } from 'lucide-react';
import type { ScanPreset } from '../../types';
import type { UiMessageKey } from '../../utils/i18n';

export const PRESET_CARDS: Array<{ preset: ScanPreset; icon: typeof Zap; name: UiMessageKey; desc: UiMessageKey }> = [
  { preset: 'quick', icon: Zap, name: 'modular.quickName', desc: 'modular.quickDesc' },
  { preset: 'standard', icon: Layers, name: 'modular.standardName', desc: 'modular.standardDesc' },
  { preset: 'deep', icon: Globe, name: 'modular.fullName', desc: 'modular.fullDesc' },
  { preset: 'email_only', icon: Mail, name: 'modular.emailName', desc: 'modular.emailDesc' },
];
