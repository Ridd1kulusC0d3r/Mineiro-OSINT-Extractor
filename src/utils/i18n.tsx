import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'pt' | 'es';

export interface Translations {
  // Brand & Header
  appTitle: string;
  appSubtitle: string;
  liveScan: string;
  standby: string;
  hits: string;
  scanned: string;
  history: string;
  historyTitle: string;
  themeTooltip: string;
  themeDark: string;
  themeBone: string;
  themeHighContrast: string;
  apiKey: string;
  aboutEngine: string;
  architecture: string;

  // Navigation & Views
  viewDashboard: string;
  viewGrid: string;
  viewTable: string;
  viewDossier: string;
  viewLinkage: string;
  viewHeatmap: string;
  viewRisk: string;
  viewWorldMap: string;
  viewConsole: string;
  viewBatch: string;

  // Target Bar
  targetPlaceholder: string;
  modeUsername: string;
  modeEmail: string;
  btnStartRecon: string;
  btnStopRecon: string;
  btnModularConfig: string;
  btnQuickPresets: string;
  allCategories: string;
  scopeAll: string;
  concurrencyLabel: string;
  activeScope: string;
  scanDepthLabel: string;
  scanDepthFast: string;
  scanDepthDeep: string;
  scanDepthFastDesc: string;
  scanDepthDeepDesc: string;
  scanDepthTimeout: string;
  scanDepthWafStrategy: string;

  // Stats Bar
  statVerified: string;
  statUncertain: string;
  statScanned: string;
  statScope: string;
  statTime: string;
  statRate: string;

  // Console / Terminal
  consoleTitle: string;
  consoleSubtitle: string;
  consoleLive: string;
  consoleIdle: string;
  consoleEvents: string;
  consoleAutoScroll: string;
  consoleScrollOn: string;
  consoleScrollOff: string;
  consoleCopy: string;
  consoleCopied: string;
  consoleClear: string;
  consoleSearchPlaceholder: string;
  consoleFilterAll: string;
  consoleFilterInfo: string;
  consoleFilterSuccess: string;
  consoleFilterWarn: string;
  consoleFilterError: string;
  consoleEmptyNotice: string;
  consoleNoFilteredEvents: string;
  consoleReadyMsg: string;

  // Dashboard Cards & KPIs
  kpiVerifiedHits: string;
  kpiDetectionRate: string;
  kpiUncertainProtected: string;
  kpiWafChallenge: string;
  kpiConfidenceIndex: string;
  kpiConfidenceDesc: string;
  kpiDominantCategory: string;
  btnDownloadDossier: string;
  btnAiProfile: string;
  btnConsoleCli: string;
  activeSourcesTitle: string;
  wafWatchlistTitle: string;
  wafWatchlistDesc: string;

  // Common Actions
  close: string;
  cancel: string;
  save: string;
  export: string;
  copyUrl: string;
  openProfile: string;
  filter: string;
  search: string;
  clear: string;

  // Snapshot
  snapshotTitle: string;
  snapshotSigned: string;
  snapshotPending: string;
  snapshotExplainer: string;
  takeSnapshot: string;
  reTakeSnapshot: string;
  signingSnapshot: string;
  copySnapshotBlock: string;
  copied: string;

  // Keyboard Shortcuts
  shortcutsTitle: string;
  shortcutsSubtitle: string;
  shortcutCatRecon: string;
  shortcutCatViews: string;
  shortcutCatModals: string;
  shortcutFocusTarget: string;
  shortcutStartScan: string;
  shortcutEsc: string;
  shortcutFilterSearch: string;
  shortcutToggleDepth: string;
  shortcutViewDashboard: string;
  shortcutViewGrid: string;
  shortcutViewTable: string;
  shortcutViewDossier: string;
  shortcutViewLinkages: string;
  shortcutViewConsole: string;
  shortcutViewBatch: string;
  shortcutExport: string;
  shortcutBulk: string;
  shortcutHistory: string;
  shortcutModular: string;
  shortcutHelp: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Mineiro Username Intelligence',
    appSubtitle: 'Unified OSINT Reconnaissance Engine // Large Local Public-Endpoint Catalog',
    liveScan: 'ACTIVE SCAN',
    standby: 'STANDBY',
    hits: 'HITS',
    scanned: 'SCANNED',
    history: 'History',
    historyTitle: 'Investigation History (Cached in localStorage)',
    themeTooltip: 'Theme: Dark Obsidian / Bone Light / High Contrast',
    themeDark: 'Dark Obsidian',
    themeBone: 'Bone / Light',
    themeHighContrast: 'High Contrast',
    apiKey: 'Gemini AI Key',
    aboutEngine: 'About Architecture',
    architecture: 'Modular OSINT Engine Architecture',

    viewDashboard: 'Dashboard',
    viewGrid: 'Profile Grid',
    viewTable: 'Data Table',
    viewDossier: 'AI Dossier',
    viewLinkage: 'Linkages & Pivots',
    viewHeatmap: 'Heatmap',
    viewRisk: 'Risk Matrix',
    viewWorldMap: 'Threat Map',
    viewConsole: 'Console',
    viewBatch: 'Batch Queue',

    targetPlaceholder: 'Enter target username, email or identifier...',
    modeUsername: 'Username',
    modeEmail: 'Email',
    btnStartRecon: 'START RECON',
    btnStopRecon: 'HALT SCAN',
    btnModularConfig: 'Engine Config',
    btnQuickPresets: 'Quick Presets',
    allCategories: 'All Categories',
    scopeAll: 'All Platforms (985)',
    concurrencyLabel: 'Concurrency',
    activeScope: 'Active Scope',
    scanDepthLabel: 'Scan Depth',
    scanDepthFast: 'Fast',
    scanDepthDeep: 'Deep',
    scanDepthFastDesc: '2,500ms timeout • Single-pass • No WAF retry',
    scanDepthDeepDesc: '6,500ms timeout • Adaptive retry with browser-like headers',
    scanDepthTimeout: 'Timeout Threshold',
    scanDepthWafStrategy: 'WAF Retry Strategy',

    statVerified: 'Verified Hits',
    statUncertain: 'Protected / WAF',
    statScanned: 'Platforms Scanned',
    statScope: 'Total Scope',
    statTime: 'Elapsed Time',
    statRate: 'Speed',

    consoleTitle: 'Mineiro Username Intelligence RECON CONSOLE',
    consoleSubtitle: 'Real-time asynchronous forensic probe stream',
    consoleLive: 'LIVE',
    consoleIdle: 'IDLE',
    consoleEvents: 'events',
    consoleAutoScroll: 'Auto-scroll',
    consoleScrollOn: 'Scroll ON',
    consoleScrollOff: 'Scroll OFF',
    consoleCopy: 'COPY',
    consoleCopied: 'COPIED',
    consoleClear: 'Clear Console',
    consoleSearchPlaceholder: 'Search events...',
    consoleFilterAll: 'All',
    consoleFilterInfo: 'Info',
    consoleFilterSuccess: 'Success',
    consoleFilterWarn: 'Warn',
    consoleFilterError: 'Error',
    consoleEmptyNotice: 'No console events recorded. Launch a scan to stream live probes.',
    consoleNoFilteredEvents: 'No matching events found for current filter.',
    consoleReadyMsg: 'Engine ready. Enter target handle or email and initiate scan.',

    kpiVerifiedHits: 'Verified Hits',
    kpiDetectionRate: 'detection rate',
    kpiUncertainProtected: 'Protected / WAF',
    kpiWafChallenge: 'Cloudflare / Anti-Bot challenge',
    kpiConfidenceIndex: 'Confidence Index',
    kpiConfidenceDesc: 'Zero-false-positive validation',
    kpiDominantCategory: 'Dominant Category',
    btnDownloadDossier: 'Download Dossier',
    btnAiProfile: 'AI Dossier',
    btnConsoleCli: 'Console CLI',
    activeSourcesTitle: 'Active Reconnaissance Modules (local direct endpoints)',
    wafWatchlistTitle: 'WAF & Anti-Bot Protection Watchlist',
    wafWatchlistDesc: 'These platforms returned Cloudflare WAF challenges or strict anti-bot responses. Flagged as Uncertain rather than false negatives.',

    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    export: 'Export',
    copyUrl: 'Copy URL',
    openProfile: 'Open Profile',
    filter: 'Filter',
    search: 'Search',
    clear: 'Clear',

    snapshotTitle: 'Cryptographic Investigation Snapshot',
    snapshotSigned: 'SIGNED (SHA-256)',
    snapshotPending: 'PENDING SEAL',
    snapshotExplainer: 'Captures the current scan state, generates a deterministic SHA-256 hash seal, and appends it to all subsequent forensic exports.',
    takeSnapshot: 'Take Snapshot',
    reTakeSnapshot: 'Re-sign Snapshot',
    signingSnapshot: 'Computing SHA-256...',
    copySnapshotBlock: 'Copy Snapshot Block',
    copied: 'Copied!',

    // Keyboard Shortcuts
    shortcutsTitle: 'Keyboard Shortcuts',
    shortcutsSubtitle: 'Speed up OSINT investigations with rapid command keys',
    shortcutCatRecon: 'Recon & Target Execution',
    shortcutCatViews: 'Navigation & Analysis Views',
    shortcutCatModals: 'Workflows & Modals',
    shortcutFocusTarget: 'Focus / Select Target Input',
    shortcutStartScan: 'Execute Recon Scan Immediately',
    shortcutEsc: 'Clear Target / Dismiss / Close Active Modal',
    shortcutFilterSearch: 'Jump to Platform Filter Search',
    shortcutToggleDepth: 'Toggle Scan Depth (Fast ⚡ / Deep 🛡️)',
    shortcutViewDashboard: 'Switch to Executive Dashboard',
    shortcutViewGrid: 'Switch to Profile Matrix Grid',
    shortcutViewTable: 'Switch to Forensic Audit Table',
    shortcutViewDossier: 'Switch to Autonomous AI Dossier',
    shortcutViewLinkages: 'Switch to Permutations & Linkages',
    shortcutViewConsole: 'Switch to Live CLI Terminal Console',
    shortcutViewBatch: 'Switch to Bulk Batch Ingestion Queue',
    shortcutExport: 'Export Forensic Dossier (JSON, CSV, PDF)',
    shortcutBulk: 'Open Bulk Target CSV Ingestion',
    shortcutHistory: 'Open Local Investigation History Cache',
    shortcutModular: 'Open Modular Presets & WAF Config',
    shortcutHelp: 'Toggle Keyboard Shortcuts Cheat Sheet',
  },

  pt: {
    appTitle: 'Mineiro Username Intelligence',
    appSubtitle: 'Motor Unificado de Reconhecimento OSINT // Catálogo Local Amplo de Endpoints Públicos',
    liveScan: 'VARREDURA ATIVA',
    standby: 'STANDBY',
    hits: 'ENCONTRADOS',
    scanned: 'VERIFICADOS',
    history: 'Histórico',
    historyTitle: 'Histórico de Investigações (Salvo localmente)',
    themeTooltip: 'Tema: Escuro Obsidiana / Bone Claro / Alto Contraste',
    themeDark: 'Escuro Obsidiana',
    themeBone: 'Bone / Claro',
    themeHighContrast: 'Alto Contraste',
    apiKey: 'Chave Gemini AI',
    aboutEngine: 'Sobre a Arquitetura',
    architecture: 'Arquitetura do Motor Mineiro Username Intelligence OSINT',

    viewDashboard: 'Painel Geral',
    viewGrid: 'Grade de Perfis',
    viewTable: 'Tabela de Dados',
    viewDossier: 'Dossiê IA',
    viewLinkage: 'Vínculos & Pivôs',
    viewHeatmap: 'Mapa Térmico',
    viewRisk: 'Matriz de Risco',
    viewWorldMap: 'Mapa de Ameaças',
    viewConsole: 'Console',
    viewBatch: 'Fila em Lote',

    targetPlaceholder: 'Digite o nome de usuário, e-mail ou identificador...',
    modeUsername: 'Nome de Usuário',
    modeEmail: 'E-mail',
    btnStartRecon: 'INICIAR RECON',
    btnStopRecon: 'PARAR VARREDURA',
    btnModularConfig: 'Configuração',
    btnQuickPresets: 'Alvos Rápidos',
    allCategories: 'Todas as Categorias',
    scopeAll: 'Todas as Plataformas (985)',
    concurrencyLabel: 'Concorrência',
    activeScope: 'Escopo Ativo',
    scanDepthLabel: 'Profundidade',
    scanDepthFast: 'Rápido',
    scanDepthDeep: 'Profundo',
    scanDepthFastDesc: 'Timeout 2.500ms • Passagem única • Sem retentativa WAF',
    scanDepthDeepDesc: 'Timeout 6.500ms • Retentativa WAF adaptativa e emulação de navegador',
    scanDepthTimeout: 'Limite de Timeout',
    scanDepthWafStrategy: 'Estratégia de Retentativa WAF',

    statVerified: 'Perfis Confirmados',
    statUncertain: 'Protegidos / WAF',
    statScanned: 'Plataformas Verificadas',
    statScope: 'Escopo Total',
    statTime: 'Tempo Decorrido',
    statRate: 'Velocidade',

    consoleTitle: 'CONSOLE DE RECONHECIMENTO Mineiro Username Intelligence',
    consoleSubtitle: 'Fluxo forense em tempo real de sondas assíncronas',
    consoleLive: 'AO VIVO',
    consoleIdle: 'OCIOSO',
    consoleEvents: 'eventos',
    consoleAutoScroll: 'Rolagem Automática',
    consoleScrollOn: 'Rolagem ATIVA',
    consoleScrollOff: 'Rolagem PAUSADA',
    consoleCopy: 'COPIAR',
    consoleCopied: 'COPIADO',
    consoleClear: 'Limpar Console',
    consoleSearchPlaceholder: 'Filtrar eventos...',
    consoleFilterAll: 'Todos',
    consoleFilterInfo: 'Info',
    consoleFilterSuccess: 'Sucesso',
    consoleFilterWarn: 'Avisos',
    consoleFilterError: 'Erros',
    consoleEmptyNotice: 'Nenhum evento gravado. Inicie uma varredura para visualizar as sondas ao vivo.',
    consoleNoFilteredEvents: 'Nenhum evento correspondente ao filtro atual.',
    consoleReadyMsg: 'Motor pronto. Digite o alvo e inicie a varredura.',

    kpiVerifiedHits: 'Perfis Confirmados',
    kpiDetectionRate: 'taxa de detecção',
    kpiUncertainProtected: 'Protegidos / WAF',
    kpiWafChallenge: 'Desafio Cloudflare / Anti-Bot',
    kpiConfidenceIndex: 'Índice de Confiança',
    kpiConfidenceDesc: 'Filtragem de zero falsos-positivos',
    kpiDominantCategory: 'Categoria Dominante',
    btnDownloadDossier: 'Baixar Dossiê',
    btnAiProfile: 'Dossiê IA',
    btnConsoleCli: 'Console CLI',
    activeSourcesTitle: 'Módulos Ativos de Reconhecimento (endpoints diretos locais)',
    wafWatchlistTitle: 'Lista de Proteção WAF & Anti-Bot',
    wafWatchlistDesc: 'Plataformas que retornaram bloqueios Cloudflare WAF ou defesas anti-bot. Classificadas como Incertas em vez de falsos-negativos.',

    close: 'Fechar',
    cancel: 'Cancelar',
    save: 'Salvar',
    export: 'Exportar',
    copyUrl: 'Copiar URL',
    openProfile: 'Abrir Perfil',
    filter: 'Filtrar',
    search: 'Pesquisar',
    clear: 'Limpar',

    snapshotTitle: 'Snapshot Criptográfico da Investigação',
    snapshotSigned: 'ASSINADO (SHA-256)',
    snapshotPending: 'PENDENTE DE LACRE',
    snapshotExplainer: 'Captura o estado atual da varredura, gera um lacre hash SHA-256 determinístico e o anexa a todas as exportações forenses subsequentes.',
    takeSnapshot: 'Criar Snapshot',
    reTakeSnapshot: 'Reassinar Snapshot',
    signingSnapshot: 'Calculando SHA-256...',
    copySnapshotBlock: 'Copiar Bloco Forense',
    copied: 'Copiado!',

    // Keyboard Shortcuts
    shortcutsTitle: 'Atalhos de Teclado',
    shortcutsSubtitle: 'Acelere investigações OSINT com comandos rápidos de teclado',
    shortcutCatRecon: 'Reconhecimento & Execução de Alvo',
    shortcutCatViews: 'Navegação & Visualizações Analíticas',
    shortcutCatModals: 'Fluxos de Trabalho & Modais',
    shortcutFocusTarget: 'Focar / Selecionar Campo de Alvo',
    shortcutStartScan: 'Executar Varredura Imediatamente',
    shortcutEsc: 'Limpar Alvo / Cancelar / Fechar Modal Aberto',
    shortcutFilterSearch: 'Pular para Busca & Filtro de Plataformas',
    shortcutToggleDepth: 'Alternar Profundidade da Varredura (Rápida ⚡ / Profunda 🛡️)',
    shortcutViewDashboard: 'Ir para Painel Geral Executivo',
    shortcutViewGrid: 'Ir para Grade de Matriz de Perfis',
    shortcutViewTable: 'Ir para Tabela de Auditoria Forense',
    shortcutViewDossier: 'Ir para Dossiê de Inteligência IA',
    shortcutViewLinkages: 'Ir para Permutações & Pivôs Cruzados',
    shortcutViewConsole: 'Ir para Console de Terminal CLI em Tempo Real',
    shortcutViewBatch: 'Ir para Fila de Ingestão em Lote',
    shortcutExport: 'Exportar Dossiê Forense (JSON, CSV, PDF)',
    shortcutBulk: 'Abrir Ingestão de Alvos em Lote (CSV)',
    shortcutHistory: 'Abrir Histórico Local de Investigações',
    shortcutModular: 'Abrir Configuração Modular & Defesas WAF',
    shortcutHelp: 'Abrir/Fechar Guia de Atalhos de Teclado',
  },

  es: {
    appTitle: 'Mineiro Username Intelligence',
    appSubtitle: 'Motor Unificado de Reconocimiento OSINT // Catálogo Local Amplio de Endpoints Públicos',
    liveScan: 'ESCÁNER ACTIVO',
    standby: 'EN ESPERA',
    hits: 'ENCONTRADOS',
    scanned: 'ESCANEADOS',
    history: 'Historial',
    historyTitle: 'Historial de Investigaciones (Guardado localmente)',
    themeTooltip: 'Tema: Oscuro Obsidiana / Bone Claro / Alto Contraste',
    themeDark: 'Oscuro Obsidiana',
    themeBone: 'Bone / Claro',
    themeHighContrast: 'Alto Contraste',
    apiKey: 'Clave Gemini AI',
    aboutEngine: 'Sobre la Arquitectura',
    architecture: 'Arquitectura del Motor Mineiro Username Intelligence OSINT',

    viewDashboard: 'Panel General',
    viewGrid: 'Cuadrícula de Perfiles',
    viewTable: 'Tabla de Datos',
    viewDossier: 'Dossier IA',
    viewLinkage: 'Vínculos y Pivotes',
    viewHeatmap: 'Mapa Térmico',
    viewRisk: 'Matriz de Riesgo',
    viewWorldMap: 'Mapa de Amenazas',
    viewConsole: 'Consola',
    viewBatch: 'Cola por Lotes',

    targetPlaceholder: 'Ingrese nombre de usuario, correo electrónico o identificador...',
    modeUsername: 'Nombre de Usuario',
    modeEmail: 'Correo Electrónico',
    btnStartRecon: 'INICIAR RECON',
    btnStopRecon: 'DETENER ESCÁNER',
    btnModularConfig: 'Configuración',
    btnQuickPresets: 'Objetivos Rápidos',
    allCategories: 'Todas las Categorías',
    scopeAll: 'Todas las Plataformas (985)',
    concurrencyLabel: 'Concurrencia',
    activeScope: 'Alcance Activo',
    scanDepthLabel: 'Profundidad',
    scanDepthFast: 'Rápido',
    scanDepthDeep: 'Profundo',
    scanDepthFastDesc: 'Timeout 2.500ms • Pase único • Sin reintentos WAF',
    scanDepthDeepDesc: 'Timeout 6.500ms • Reintento WAF adaptativo y emulación de navegador',
    scanDepthTimeout: 'Límite de Timeout',
    scanDepthWafStrategy: 'Estrategia de Reintento WAF',

    statVerified: 'Perfiles Confirmados',
    statUncertain: 'Protegidos / WAF',
    statScanned: 'Plataformas Escaneadas',
    statScope: 'Alcance Total',
    statTime: 'Tiempo Transcurrido',
    statRate: 'Velocidad',

    consoleTitle: 'CONSOLA DE RECONOCIMIENTO Mineiro Username Intelligence',
    consoleSubtitle: 'Flujo forense en tiempo real de sondas asíncronas',
    consoleLive: 'EN VIVO',
    consoleIdle: 'INACTIVO',
    consoleEvents: 'eventos',
    consoleAutoScroll: 'Desplazamiento Automático',
    consoleScrollOn: 'Desplazamiento ON',
    consoleScrollOff: 'Desplazamiento OFF',
    consoleCopy: 'COPIAR',
    consoleCopied: 'COPIADO',
    consoleClear: 'Limpiar Consola',
    consoleSearchPlaceholder: 'Buscar eventos...',
    consoleFilterAll: 'Todos',
    consoleFilterInfo: 'Info',
    consoleFilterSuccess: 'Éxito',
    consoleFilterWarn: 'Avisos',
    consoleFilterError: 'Errores',
    consoleEmptyNotice: 'No hay eventos en la consola. Inicie un escaneo para transmitir sondas en vivo.',
    consoleNoFilteredEvents: 'No hay eventos que coincidan con el filtro actual.',
    consoleReadyMsg: 'Motor listo. Ingrese el objetivo e inicie el escaneo.',

    kpiVerifiedHits: 'Perfiles Confirmados',
    kpiDetectionRate: 'tasa de detección',
    kpiUncertainProtected: 'Protegidos / WAF',
    kpiWafChallenge: 'Desafío Cloudflare / Anti-Bot',
    kpiConfidenceIndex: 'Índice de Confianza',
    kpiConfidenceDesc: 'Validación de cero falsos positivos',
    kpiDominantCategory: 'Categoría Dominante',
    btnDownloadDossier: 'Descargar Dossier',
    btnAiProfile: 'Dossier IA',
    btnConsoleCli: 'Consola CLI',
    activeSourcesTitle: 'Módulos Activos de Reconocimiento (endpoints directos locales)',
    wafWatchlistTitle: 'Lista de Protección WAF & Anti-Bot',
    wafWatchlistDesc: 'Plataformas que devolvieron desafíos Cloudflare WAF o defensas anti-bot. Clasificadas como Inciertas en vez de falsos negativos.',

    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    export: 'Exportar',
    copyUrl: 'Copiar URL',
    openProfile: 'Abrir Perfil',
    filter: 'Filtrar',
    search: 'Buscar',
    clear: 'Limpiar',

    snapshotTitle: 'Snapshot Criptográfico de la Investigación',
    snapshotSigned: 'FIRMADO (SHA-256)',
    snapshotPending: 'PENDIENTE DE SELLO',
    snapshotExplainer: 'Captura el estado actual del escaneo, genera un sello hash SHA-256 determinista y lo adjunta a todas las exportaciones forenses posteriores.',
    takeSnapshot: 'Crear Snapshot',
    reTakeSnapshot: 'Refirmar Snapshot',
    signingSnapshot: 'Calculando SHA-256...',
    copySnapshotBlock: 'Copiar Bloque Forense',
    copied: '¡Copiado!',

    // Keyboard Shortcuts
    shortcutsTitle: 'Atajos de Teclado',
    shortcutsSubtitle: 'Acelera las investigaciones OSINT con teclas de comando rápido',
    shortcutCatRecon: 'Reconocimiento y Ejecución de Objetivo',
    shortcutCatViews: 'Navegación y Vistas de Análisis',
    shortcutCatModals: 'Flujos de Trabajo y Modales',
    shortcutFocusTarget: 'Enfocar / Seleccionar Campo del Objetivo',
    shortcutStartScan: 'Ejecutar Escaneo Inmediatamente',
    shortcutEsc: 'Limpiar Objetivo / Cancelar / Cerrar Modal Activo',
    shortcutFilterSearch: 'Saltar a Búsqueda y Filtro de Plataformas',
    shortcutToggleDepth: 'Alternar Profundidad de Escaneo (Rápido ⚡ / Profundo 🛡️)',
    shortcutViewDashboard: 'Ir al Panel General Ejecutivo',
    shortcutViewGrid: 'Ir a Matriz de Perfiles',
    shortcutViewTable: 'Ir a Tabla de Auditoría Forense',
    shortcutViewDossier: 'Ir al Dossier de Inteligencia IA',
    shortcutViewLinkages: 'Ir a Permutaciones y Pivotes',
    shortcutViewConsole: 'Ir a Consola Terminal CLI en Vivo',
    shortcutViewBatch: 'Ir a Cola de Ingesta por Lotes',
    shortcutExport: 'Exportar Dossier Forense (JSON, CSV, PDF)',
    shortcutBulk: 'Abrir Ingesta de Objetivos por Lotes (CSV)',
    shortcutHistory: 'Abrir Historial Local de Investigaciones',
    shortcutModular: 'Abrir Configuración Modular y Defensas WAF',
    shortcutHelp: 'Abrir/Cerrar Guía de Atajos de Teclado',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  language: 'pt',
  setLanguage: () => {},
  t: translations.pt,
});

const LANGUAGE_STORAGE_KEY = 'mineiro_language_preference';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'pt' || stored === 'es') {
        return stored;
      }
    } catch {
      // fallback
    }
    return 'pt'; // Default to Portuguese per user language, user can change anytime
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
