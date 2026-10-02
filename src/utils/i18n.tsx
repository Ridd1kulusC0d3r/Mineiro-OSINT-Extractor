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
    scanDepthDeepDesc: '6,500ms timeout • no bypass: blocked sites stay UNCERTAIN',
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
    shortcutExport: 'Export report (HTML, JSON, Markdown, CSV)',
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
    scanDepthDeepDesc: 'Timeout 6.500ms • sem bypass: sites bloqueados ficam INCERTOS',
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
    shortcutExport: 'Exportar relatório (HTML, JSON, Markdown, CSV)',
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
    scanDepthDeepDesc: 'Timeout 6.500ms • sin bypass: los sitios bloqueados quedan INCIERTOS',
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
    shortcutExport: 'Exportar informe (HTML, JSON, Markdown, CSV)',
    shortcutBulk: 'Abrir Ingesta de Objetivos por Lotes (CSV)',
    shortcutHistory: 'Abrir Historial Local de Investigaciones',
    shortcutModular: 'Abrir Configuración Modular y Defensas WAF',
    shortcutHelp: 'Abrir/Cerrar Guía de Atajos de Teclado',
  },
};


export const uiMessages = {
  en: {
    'lang.select': 'Select language',
    'lang.available': 'Available languages',
    'lang.active': 'Active language',
    'header.report': 'Report',
    'header.cases': 'Cases',
    'header.batch': 'Batch',
    'header.ai': 'AI',
    'header.theme': 'Theme',
    'header.export': 'Export',
    'header.reset': 'Clear workspace',
    'header.found': 'found',
    'header.checked': 'checked',
    'target.username': 'Username',
    'target.email': 'Email',
    'target.usernamePlaceholder': 'username to investigate',
    'target.emailPlaceholder': 'email to validate',
    'target.clear': 'clear',
    'target.quick': 'Quick',
    'target.standard': 'Standard',
    'target.full': 'Full',
    'target.settings': 'Advanced settings',
    'target.run': 'Run scan',
    'target.stop': 'Stop',
    'target.detectorsScope': 'detectors in scope',
    'target.baseConcurrency': 'base concurrency',
    'target.evidenceOn': 'Evidence Engine active',
    'target.evidenceDemand': 'Evidence Engine on demand',
    'target.fullProgressive': 'Full uses discovery → validation',
    'target.batchCsv': 'Batch CSV',
    'nav.intelligence': 'Intelligence',
    'nav.evidence': 'Evidence',
    'nav.platforms': 'Platforms',
    'nav.correlation': 'Correlation',
    'nav.console': 'Console',
    'nav.batch': 'Batch',
    'stats.collected': 'collected',
    'stats.found': 'found',
    'stats.unresolved': 'unresolved',
    'stats.filterEvidence': 'Filter evidence...',
    'stats.all': 'all',
    'stats.uncertain': 'uncertain',
    'stats.absent': 'absent',
    'report.requirement': 'Requirement',
    'report.assessment': 'Assessment',
    'report.evidence': 'Evidence',
    'report.correlation': 'Correlation',
    'report.gaps': 'Gaps',
    'report.integrity': 'Integrity',
    'report.auditTable': 'Audit table',
    'report.generatedLocal': 'Generated locally',
    'report.highValue': 'High-value findings',
    'report.highValueDetail': 'findings that deserve review',
    'report.coverage': 'Effective coverage',
    'report.completed': 'completed',
    'report.unresolved': 'Unresolved',
    'report.unresolvedDetail': 'uncertain, limited or errored',
    'report.analyticalGaps': 'Analytical gaps',
    'report.gapsDetail': 'questions capable of changing the assessment',
    'report.requirementTitle': 'What question are we trying to answer?',
    'report.requirementDesc': 'The same evidence has different value depending on the requirement. Mineiro weights analytical relevance according to the selected question.',
    'report.executive': 'Executive view',
    'report.heroTitle': 'Observed public footprint, kept apart from hypothesis and conclusion.',
    'report.heroLead': 'The report shows what was observed, what was assessed, what contradicts the hypothesis and what is still missing to answer the intelligence question.',
    'report.executiveDesc': 'Operational conclusion first. The number of checks lives in the appendix, where it belongs.',
    'report.requested': 'Requested',
    'report.requestedDetail': 'detectors requested',
    'report.completedLabel': 'Completed',
    'report.completedDetail': 'executions finished',
    'report.conclusive': 'Conclusive',
    'report.conclusiveDetail': 'positive or explicit absence',
    'report.blocked': 'Blocked / inconclusive',
    'report.blockedDetail': 'do not read as a negative conclusion',
    'home.eyebrow': 'Mineiro · OSINT Investigation Workbench',
    'home.title': 'Check a public handle. Keep the evidence.',
    'home.lead': 'Mineiro tests a username against public surfaces, separates what was observed from what is inferred, and produces a report you can audit.',
    'home.exampleLabel': 'Try an example',
    'home.exampleNote': 'Examples are public open-source organisations. Investigate only with a legitimate, authorised purpose.',
    'home.verdictTitle': 'How to read a verdict',
    'home.verdictFound': 'Observed on a public page. A lead, not proof of identity.',
    'home.verdictAbsent': "Explicit absence confirmed by the site's response.",
    'home.verdictUncertain': 'Blocked, rate-limited or inconclusive. Never read it as a negative.',
    'home.modesTitle': 'Choose how deep to look',
    'home.modeQuickName': 'Quick',
    'home.modeQuickDesc': '20 platforms in seconds. A headline check without the Evidence Engine.',
    'home.modeStandardName': 'Standard',
    'home.modeStandardDesc': '50 platforms with the Evidence Engine and the differential baseline against soft-404s.',
    'home.modeFullName': 'Full',
    'home.modeFullDesc': 'The whole registry in two phases: fast discovery, then deep checks only on candidates.',
    'home.recommended': 'Recommended',
    'home.selected': 'Selected',
    'home.stepsTitle': 'From observation to assessment',
    'home.stepCollectTitle': 'Collect',
    'home.stepCollectDesc': 'Public detectors are queried through a guarded fetch: public IPs only, no bypass.',
    'home.stepEvidenceTitle': 'Evidence',
    'home.stepEvidenceDesc': 'Eight checks per response, plus a baseline against a handle that cannot exist.',
    'home.stepCorrelateTitle': 'Correlate',
    'home.stepCorrelateDesc': 'Similar usernames and shared domains become candidate links, never conclusions.',
    'home.stepAssessTitle': 'Assess',
    'home.stepAssessDesc': 'Hypotheses, contradictions and gaps, exported with integrity hashes.',
    'home.trust1': 'Public signals only',
    'home.trust2': 'No CAPTCHA or login bypass',
    'home.trust3': 'Observation is not identity',
    'home.batch': 'Batch from CSV',
    'home.cases': 'Open cases',
    'home.searchHint': 'Ctrl+K focuses the search · Ctrl+Enter runs the scan · ? lists every shortcut',
    'home.issueEmail': 'This looks like an e-mail address.',
    'home.issueEmailAction': 'Switch to e-mail mode',
    'home.issueUrl': 'That is a profile URL. The handle is {handle}.',
    'home.issueUrlAction': 'Use @{handle}',
    'home.issueSpaces': 'Usernames rarely contain spaces.',
    'home.issueSpacesAction': 'Use {handle}',
    'home.issueInvalidEmail': 'That does not look like a valid e-mail address.',
    'home.recentTitle': 'Continue where you left off',
    'home.recentSummary': '{found} found · {total} checked',
    'home.statusLocal': 'Running locally · v{version}',
    'home.statusPublic': 'Shared instance · strict rate limits, no storage · v{version}',
    'home.aiOn': 'AI copilot configured',
    'home.aiOff': 'AI copilot off (optional)',
    'report.knownAssessedUnknown': 'Known · Assessed · Unknown',
    'report.collectionHealth': 'Collection health',
    'report.keyJudgments': 'Key judgments',
    'report.keyJudgmentsDesc': 'Each judgment carries confidence and basis. A conclusion must show where it came from.',
    'report.collectionCoverage': 'What was actually queried',
    'report.collectionCoverageDesc': 'Three accounts found in 984 requests is not the same as three accounts found in 92 completed queries.',
    'report.highConfidence': 'Highest-value findings',
    'report.highConfidenceDesc': 'Ordered by Intelligence Priority Score, not by server response order.',
    'report.evidenceMatrix': 'Evidence matrix',
    'report.evidenceMatrixDesc': 'Detector, observation, correlation, source quality, IPS and provenance remain separate.',
    'report.clusters': 'Observable clusters',
    'report.clustersDesc': 'Groups services by public context without turning digital presence into a psychological profile.',
    'report.correlationGraph': 'Observed public relationships',
    'report.correlationGraphDesc': 'Each edge has relationship, confidence, evidence and provenance. No edge means "same person = true".',
    'report.hypotheses': 'Hypotheses and alternative',
    'report.hypothesesDesc': 'The alternative hypothesis stays visible to reduce automatic confirmation of the first theory.',
    'report.supporting': 'Supporting evidence & Analytic Ledger',
    'report.supportingDesc': 'Each claim points to evidence IDs. Click an ID to return to the finding that supports the conclusion.',
    'report.contradictions': 'Evidence against correlation',
    'report.contradictionsDesc': 'Contradiction is evidence, not an inconvenience. It must appear as clearly as supporting evidence.',
    'report.unresolvedTitle': 'Results that cannot become conclusions',
    'report.unresolvedDesc': 'WAF, rate limit and inconclusive observations stay visible and separate from positives.',
    'report.gapsTitle': 'What we still do not know',
    'report.gapsDesc': 'Gaps are questions that, if answered, can materially change the assessment.',
    'report.timeline': 'Intelligence timeline',
    'report.timelineDesc': 'Scan timestamp, account creation, first public evidence and source timestamp are treated as different things.',
    'report.pivots': 'Next actions with expected value',
    'report.pivotsDesc': 'Priority goes to corroboration, resolving contradictions and closing gaps, not accumulating more hits.',
    'report.plan': 'Collection plan and stop condition',
    'report.planDesc': 'The report says what to do next and, crucially, when to stop.',
    'report.reliability': 'Source quality and reliability',
    'report.reliabilityDesc': 'Detector Reliability asks whether the rule works. Source Quality asks how strong the observed source is.',
    'report.methodology': 'Separation between collection, evidence, correlation and assessment',
    'report.methodologyDesc': 'The methodology prevents an HTTP response from automatically becoming an identity conclusion.',
    'report.provenance': 'Where each layer came from',
    'report.provenanceDesc': 'PRIMARY, DERIVED, EXTERNAL and AI_SYNTHESIZED are never equivalent. AI remains hypothesis, not observation.',
    'report.appendix': 'Technical appendix',
    'report.appendixDesc': 'Volume, checks and distribution live here. They support the analysis but should not dominate the cover.',
    'report.integrityTitle': 'Integrity snapshot',
    'report.integrityDesc': 'SHA-256 verifies the canonical state used in the report. It does not prove authorship, identity or legal chain of custody.',
    'report.manifest': 'What will be exported',
    'report.manifestDesc': 'The configurable export records included and excluded sections, format, local generation and the exported payload hash.',
    'report.openExport': 'Open export builder',
    'ai.title': 'AI Analyst',
    'ai.workspaceTitle': 'Analytical Copilot connected to the assessment, not legacy profiling.',
    'ai.workspaceDesc': 'AI receives the structured evidence layer and can summarize, review contradictions, gaps and pivots. It does not raise factual confidence by itself.',
    'ai.configure': 'Configure Gemini',
    'ai.connection': 'Connection',
    'ai.configured': 'configured',
    'ai.notConfigured': 'not configured',
    'ai.credentialSource': 'Credential source',
    'ai.personal': 'personal',
    'ai.server': 'server',
    'ai.none': 'none',
    'ai.unknown': 'unknown',
    'ai.selectedModel': 'Selected model',
    'ai.copilot': 'AI Analyst Copilot',
    'ai.copilotTitle': 'Use AI for triage, not to manufacture certainty.',
    'ai.copilotDesc': 'The Copilot receives only the assessment already built locally. It can summarize evidence, suggest pivots, flag contradictions and prioritize gaps. Output remains AI_SYNTHESIZED and does not raise factual confidence.',
    'ai.optional': 'optional · analyst controlled',
    'ai.questionPlaceholder': 'Example: which contradictions should I resolve before correlating these accounts?',
    'ai.analyze': 'Analyze',
    'ai.requestFailed': 'AI analyst request failed',
    'ai.executiveBrief': 'Executive brief',
    'ai.contradictions': 'Contradictions to resolve',
    'ai.intelligenceGaps': 'Intelligence gaps',
    'ai.recommendedPivots': 'Recommended pivots',
    'correlation.graphTab': 'Relationship Graph',
    'correlation.similarTab': 'Similar Usernames',
    'linkage.title': 'Username Linkage',
    'linkage.heading': 'Similar variants as pivots, not confirmed identity.',
    'linkage.desc': 'The engine normalizes the identifier, generates conservative syntactic mutations and calculates string similarity. A variant remains a candidate until independent public evidence exists.',
    'linkage.observed': 'Observed exact handle',
    'linkage.candidates': 'Candidate variants',
    'linkage.promotion': 'Promotion rule',
    'linkage.promotionValue': 'pivot + independent public evidence',
    'linkage.copy': 'Copy',
    'linkage.copied': 'Copied',
    'linkage.pivot': 'Pivot scan',
    'linkage.method': 'Method notes',
    'graph.title': 'Account Relationship Graph',
    'graph.heading': 'Map of observed relationships and linkage candidates.',
    'graph.desc': 'Solid lines come from observed public evidence. Dashed lines represent username similarity only and require independent validation.',
    'graph.observed': 'observed',
    'graph.candidate': 'candidate',
    'graph.clickInspect': 'Click a node to inspect.',
    'graph.solid': 'solid = observed',
    'graph.dashed': 'dashed = candidate',
    'gemini.title': 'Gemini · Analyst Copilot',
    'gemini.subtitle': 'Connect Gemini to the evidence-bounded Analyst Copilot',
    'gemini.privacy': 'Privacy & Full Control',
    'gemini.privacyDesc': 'Your key is stored only in this browser local storage and sent to the local Mineiro server for Gemini requests. Remove it at any time with Clear.',
    'gemini.obtainKey': 'Obtain free API key in the provider console',
    'gemini.apiKey': 'Gemini API Key (GEMINI_API_KEY)',
    'gemini.blankKey': 'If left blank, Mineiro uses GEMINI_API_KEY from the server environment when available. The deterministic assessment works without AI.',
    'gemini.model': 'Selected Gemini Model',
    'gemini.testing': 'Testing...',
    'gemini.test': 'Test Connection',
    'gemini.clear': 'Clear',
    'gemini.cancel': 'Cancel',
    'gemini.save': 'Save Configuration',
    'gemini.connectionError': 'Connection error while testing key.',
    'gemini.validationFailed': 'Failed to validate Gemini API key.',
    'export.title': 'Build the report before exporting.',
    'export.subtitle': 'Each export generates the main file and a separate JSON manifest with the payload SHA-256, format and exact list of included and excluded sections.',
    'export.content': 'Report content',
    'export.sectionsSelected': 'sections selected',
    'export.default': 'Default',
    'export.all': 'All',
    'export.formats': 'Export formats',
    'export.html': 'Enriched HTML',
    'export.htmlDesc': 'Local reading and printing.',
    'export.json': 'Analytical JSON',
    'export.jsonDesc': 'Integrations and automation.',
    'export.markdownDesc': 'Case notes and documentation.',
    'export.csv': 'Evidence CSV',
    'export.csvDesc': 'Finding, scores, source quality, IPS and provenance.',
    'export.integrity': 'Integrity',
    'export.integrityDesc': 'The manifest calculates SHA-256 over the payload before the manifest itself is inserted. This verifies file integrity, not authorship or identity.',
  },
  pt: {
    'lang.select': 'Selecionar idioma',
    'lang.available': 'Idiomas disponíveis',
    'lang.active': 'Idioma ativo',
    'header.report': 'Relatório',
    'header.cases': 'Casos',
    'header.batch': 'Lote',
    'header.ai': 'IA',
    'header.theme': 'Tema',
    'header.export': 'Exportar',
    'header.reset': 'Limpar workspace',
    'header.found': 'encontrados',
    'header.checked': 'verificados',
    'target.username': 'Usuário',
    'target.email': 'E-mail',
    'target.usernamePlaceholder': 'usuário para investigar',
    'target.emailPlaceholder': 'e-mail para validar',
    'target.clear': 'limpar',
    'target.quick': 'Rápido',
    'target.standard': 'Padrão',
    'target.full': 'Completo',
    'target.settings': 'Configuração avançada',
    'target.run': 'Executar scan',
    'target.stop': 'Parar',
    'target.detectorsScope': 'detectores no escopo',
    'target.baseConcurrency': 'concorrência base',
    'target.evidenceOn': 'Evidence Engine ativo',
    'target.evidenceDemand': 'Evidence Engine sob demanda',
    'target.fullProgressive': 'Full usa discovery → validation',
    'target.batchCsv': 'CSV em lote',
    'nav.intelligence': 'Inteligência',
    'nav.evidence': 'Evidência',
    'nav.platforms': 'Plataformas',
    'nav.correlation': 'Correlação',
    'nav.console': 'Console',
    'nav.batch': 'Lote',
    'stats.collected': 'coletado',
    'stats.found': 'encontrados',
    'stats.unresolved': 'não resolvidos',
    'stats.filterEvidence': 'Filtrar evidência...',
    'stats.all': 'todos',
    'stats.uncertain': 'incertos',
    'stats.absent': 'ausentes',
    'report.requirement': 'Requisito',
    'report.assessment': 'Avaliação',
    'report.evidence': 'Evidência',
    'report.correlation': 'Correlação',
    'report.gaps': 'Lacunas',
    'report.integrity': 'Integridade',
    'report.auditTable': 'Tabela de auditoria',
    'report.generatedLocal': 'Gerado localmente',
    'report.highValue': 'Achados de alto valor',
    'report.highValueDetail': 'achados que merecem revisão',
    'report.coverage': 'Cobertura efetiva',
    'report.completed': 'concluídos',
    'report.unresolved': 'Não resolvidos',
    'report.unresolvedDetail': 'incertos, limitados ou com erro',
    'report.analyticalGaps': 'Lacunas analíticas',
    'report.gapsDetail': 'perguntas capazes de mudar a avaliação',
    'report.requirementTitle': 'Qual pergunta estamos tentando responder?',
    'report.requirementDesc': 'A mesma evidência tem valor diferente dependendo do requisito. O Mineiro pondera a relevância analítica conforme a pergunta selecionada.',
    'report.executive': 'Visão executiva',
    'report.heroTitle': 'Pegada pública observada, separada de hipótese e de conclusão.',
    'report.heroLead': 'O relatório mostra o que foi observado, o que foi avaliado, o que contradiz a hipótese e o que ainda falta para responder à pergunta de inteligência.',
    'report.executiveDesc': 'Conclusão operacional primeiro. Quantidade de checks fica no apêndice, onde pertence.',
    'report.requested': 'Solicitados',
    'report.requestedDetail': 'detectores solicitados',
    'report.completedLabel': 'Concluídos',
    'report.completedDetail': 'execuções encerradas',
    'report.conclusive': 'Conclusivos',
    'report.conclusiveDetail': 'positivo ou ausência explícita',
    'report.blocked': 'Bloqueados / inconclusivos',
    'report.blockedDetail': 'não usar como conclusão negativa',
    'home.eyebrow': 'Mineiro · OSINT Investigation Workbench',
    'home.title': 'Consulte um handle público. Guarde a evidência.',
    'home.lead': 'O Mineiro testa um username em superfícies públicas, separa o que foi observado do que é inferido e gera um relatório que você pode auditar.',
    'home.exampleLabel': 'Experimente um exemplo',
    'home.exampleNote': 'Os exemplos são organizações públicas de código aberto. Investigue apenas com finalidade legítima e autorizada.',
    'home.verdictTitle': 'Como ler um veredito',
    'home.verdictFound': 'Observado em uma página pública. Um indício, não prova de identidade.',
    'home.verdictAbsent': 'Ausência explícita confirmada pela resposta do site.',
    'home.verdictUncertain': 'Bloqueado, limitado ou inconclusivo. Nunca leia como negativo.',
    'home.modesTitle': 'Escolha a profundidade',
    'home.modeQuickName': 'Rápido',
    'home.modeQuickDesc': '20 plataformas em segundos. Uma checagem inicial sem o Evidence Engine.',
    'home.modeStandardName': 'Padrão',
    'home.modeStandardDesc': '50 plataformas com o Evidence Engine e o baseline diferencial contra soft-404.',
    'home.modeFullName': 'Completo',
    'home.modeFullDesc': 'O registry inteiro em duas fases: descoberta rápida e depois checagens profundas só nos candidatos.',
    'home.recommended': 'Recomendado',
    'home.selected': 'Selecionado',
    'home.stepsTitle': 'Da observação à avaliação',
    'home.stepCollectTitle': 'Coletar',
    'home.stepCollectDesc': 'Detectores públicos são consultados por um fetch protegido: apenas IPs públicos, sem bypass.',
    'home.stepEvidenceTitle': 'Evidência',
    'home.stepEvidenceDesc': 'Oito checks por resposta, mais um baseline contra um handle que não pode existir.',
    'home.stepCorrelateTitle': 'Correlacionar',
    'home.stepCorrelateDesc': 'Usernames parecidos e domínios em comum viram vínculos candidatos, nunca conclusões.',
    'home.stepAssessTitle': 'Avaliar',
    'home.stepAssessDesc': 'Hipóteses, contradições e lacunas, exportadas com hashes de integridade.',
    'home.trust1': 'Apenas sinais públicos',
    'home.trust2': 'Sem bypass de CAPTCHA ou login',
    'home.trust3': 'Observação não é identidade',
    'home.batch': 'Lote por CSV',
    'home.cases': 'Abrir casos',
    'home.searchHint': 'Ctrl+K foca a busca · Ctrl+Enter executa o scan · ? lista todos os atalhos',
    'home.issueEmail': 'Isto parece um endereço de e-mail.',
    'home.issueEmailAction': 'Mudar para o modo e-mail',
    'home.issueUrl': 'Isto é uma URL de perfil. O handle é {handle}.',
    'home.issueUrlAction': 'Usar @{handle}',
    'home.issueSpaces': 'Usernames raramente têm espaços.',
    'home.issueSpacesAction': 'Usar {handle}',
    'home.issueInvalidEmail': 'Isto não parece um e-mail válido.',
    'home.recentTitle': 'Continue de onde parou',
    'home.recentSummary': '{found} encontrados · {total} verificados',
    'home.statusLocal': 'Rodando localmente · v{version}',
    'home.statusPublic': 'Instância compartilhada · limites estritos, sem armazenamento · v{version}',
    'home.aiOn': 'Copiloto de IA configurado',
    'home.aiOff': 'Copiloto de IA desligado (opcional)',
    'report.knownAssessedUnknown': 'Conhecido · Avaliado · Desconhecido',
    'report.collectionHealth': 'Saúde da coleta',
    'report.keyJudgments': 'Julgamentos principais',
    'report.keyJudgmentsDesc': 'Cada julgamento carrega confiança e base. A conclusão precisa mostrar de onde veio.',
    'report.collectionCoverage': 'O que realmente foi consultado',
    'report.collectionCoverageDesc': 'Encontrar três contas em 984 pedidos não é o mesmo que encontrar três contas em 92 consultas concluídas.',
    'report.highConfidence': 'Achados de maior valor',
    'report.highConfidenceDesc': 'Ordenados pelo Intelligence Priority Score, não pela ordem de resposta do servidor.',
    'report.evidenceMatrix': 'Matriz de evidência',
    'report.evidenceMatrixDesc': 'Detector, observação, correlação, qualidade da fonte, IPS e proveniência permanecem separados.',
    'report.clusters': 'Clusters observáveis',
    'report.clustersDesc': 'Agrupa serviços por contexto público sem transformar presença digital em perfil psicológico.',
    'report.correlationGraph': 'Relações públicas observadas',
    'report.correlationGraphDesc': 'Cada aresta tem relacionamento, confiança, evidência e proveniência. Nenhuma aresta significa "same person = true".',
    'report.hypotheses': 'Hipóteses e alternativa',
    'report.hypothesesDesc': 'A hipótese alternativa permanece visível para reduzir a confirmação automática da primeira teoria.',
    'report.supporting': 'Evidência de suporte & Analytic Ledger',
    'report.supportingDesc': 'Cada claim aponta para IDs de evidência. Clique no ID para voltar ao finding que sustenta a conclusão.',
    'report.contradictions': 'Evidência contra correlação',
    'report.contradictionsDesc': 'Contradição é evidência, não inconveniente. Ela precisa aparecer tão claramente quanto o suporte.',
    'report.unresolvedTitle': 'Resultados que não podem virar conclusão',
    'report.unresolvedDesc': 'WAF, rate limit e observações inconclusivas ficam visíveis e separados dos positivos.',
    'report.gapsTitle': 'O que ainda não sabemos',
    'report.gapsDesc': 'Lacunas são perguntas que, se respondidas, podem mudar materialmente a avaliação.',
    'report.timeline': 'Timeline de inteligência',
    'report.timelineDesc': 'Timestamp do scan, criação da conta, primeira evidência pública e timestamp da fonte são tratados como coisas diferentes.',
    'report.pivots': 'Próximas ações com valor esperado',
    'report.pivotsDesc': 'A prioridade vai para corroborar, resolver contradições e fechar lacunas, não acumular mais hits.',
    'report.plan': 'Plano de coleta e condição de parada',
    'report.planDesc': 'O relatório diz o que fazer depois e, principalmente, quando parar.',
    'report.reliability': 'Qualidade da fonte e confiabilidade',
    'report.reliabilityDesc': 'Detector Reliability responde se a regra funciona. Source Quality responde quão forte é a fonte observada.',
    'report.methodology': 'Separação entre coleta, evidência, correlação e avaliação',
    'report.methodologyDesc': 'A metodologia impede que uma resposta HTTP vire automaticamente uma conclusão de identidade.',
    'report.provenance': 'De onde veio cada camada',
    'report.provenanceDesc': 'PRIMARY, DERIVED, EXTERNAL e AI_SYNTHESIZED nunca são equivalentes. IA continua sendo hipótese, não observação.',
    'report.appendix': 'Apêndice técnico',
    'report.appendixDesc': 'Detalhes de volume, checks e distribuição ficam aqui. Eles sustentam a análise, mas não dominam a capa.',
    'report.integrityTitle': 'Snapshot de integridade',
    'report.integrityDesc': 'SHA-256 verifica o estado canônico usado no relatório. Não prova autoria, identidade nem cadeia de custódia legal.',
    'report.manifest': 'O que será exportado',
    'report.manifestDesc': 'O export configurável registra seções incluídas e excluídas, formato, geração local e hash do payload exportado.',
    'report.openExport': 'Abrir construtor de exportação',
    'ai.title': 'Analista IA',
    'ai.workspaceTitle': 'Copiloto analítico conectado ao assessment, não ao profiling legado.',
    'ai.workspaceDesc': 'A IA recebe a camada estruturada de evidência e pode resumir, revisar contradições, lacunas e pivôs. Ela não aumenta a confiança factual sozinha.',
    'ai.configure': 'Configurar Gemini',
    'ai.connection': 'Conexão',
    'ai.configured': 'configurado',
    'ai.notConfigured': 'não configurado',
    'ai.credentialSource': 'Origem da credencial',
    'ai.personal': 'pessoal',
    'ai.server': 'servidor',
    'ai.none': 'nenhuma',
    'ai.unknown': 'desconhecida',
    'ai.selectedModel': 'Modelo selecionado',
    'ai.copilot': 'Copiloto Analista IA',
    'ai.copilotTitle': 'Use IA para triagem, não para fabricar certeza.',
    'ai.copilotDesc': 'O copiloto recebe apenas a avaliação já construída localmente. Pode resumir evidências, sugerir pivôs, apontar contradições e priorizar lacunas. A saída permanece AI_SYNTHESIZED e não aumenta a confiança factual.',
    'ai.optional': 'opcional · controlado pelo analista',
    'ai.questionPlaceholder': 'Ex.: quais contradições devo resolver antes de correlacionar as contas?',
    'ai.analyze': 'Analisar',
    'ai.requestFailed': 'Falha na solicitação ao analista IA',
    'ai.executiveBrief': 'Resumo executivo',
    'ai.contradictions': 'Contradições a resolver',
    'ai.intelligenceGaps': 'Lacunas de inteligência',
    'ai.recommendedPivots': 'Pivôs recomendados',
    'correlation.graphTab': 'Grafo de relacionamento',
    'correlation.similarTab': 'Usuários semelhantes',
    'linkage.title': 'Vínculo de usernames',
    'linkage.heading': 'Variantes parecidas como pivôs, não como identidade confirmada.',
    'linkage.desc': 'O motor normaliza o identificador, gera mutações sintáticas conservadoras e calcula similaridade de string. Uma variante continua candidata até existir evidência pública independente.',
    'linkage.observed': 'Handle exato observado',
    'linkage.candidates': 'Variantes candidatas',
    'linkage.promotion': 'Regra de promoção',
    'linkage.promotionValue': 'pivot + evidência pública independente',
    'linkage.copy': 'Copiar',
    'linkage.copied': 'Copiado',
    'linkage.pivot': 'Scan de pivot',
    'linkage.method': 'Notas do método',
    'graph.title': 'Grafo de relacionamento de contas',
    'graph.heading': 'Mapa de relações observadas e candidatos de vínculo.',
    'graph.desc': 'Linhas sólidas vêm de evidência pública observada. Linhas tracejadas representam apenas similaridade de username e precisam de validação independente.',
    'graph.observed': 'observadas',
    'graph.candidate': 'candidatas',
    'graph.clickInspect': 'Clique em um nó para inspecionar.',
    'graph.solid': 'sólida = observada',
    'graph.dashed': 'tracejada = candidata',
    'gemini.title': 'Gemini · Copiloto Analista',
    'gemini.subtitle': 'Conecte o Gemini ao Copiloto Analista limitado por evidência',
    'gemini.privacy': 'Privacidade e controle',
    'gemini.privacyDesc': 'Sua chave fica apenas no armazenamento local deste navegador e é enviada ao servidor local do Mineiro para requisições Gemini. Remova quando quiser usando Limpar.',
    'gemini.obtainKey': 'Obter chave gratuita no console do provedor',
    'gemini.apiKey': 'Chave da API Gemini (GEMINI_API_KEY)',
    'gemini.blankKey': 'Se ficar em branco, o Mineiro usa GEMINI_API_KEY do ambiente do servidor quando disponível. A avaliação determinística funciona sem IA.',
    'gemini.model': 'Modelo Gemini selecionado',
    'gemini.testing': 'Testando...',
    'gemini.test': 'Testar conexão',
    'gemini.clear': 'Limpar',
    'gemini.cancel': 'Cancelar',
    'gemini.save': 'Salvar configuração',
    'gemini.connectionError': 'Erro de conexão ao testar a chave.',
    'gemini.validationFailed': 'Falha ao validar a chave da API Gemini.',
    'export.title': 'Monte o relatório antes de exportar.',
    'export.subtitle': 'Cada exportação gera o arquivo principal e um manifest JSON separado com SHA-256 do payload, formato e lista exata das seções incluídas e excluídas.',
    'export.content': 'Conteúdo do relatório',
    'export.sectionsSelected': 'seções selecionadas',
    'export.default': 'Padrão',
    'export.all': 'Tudo',
    'export.formats': 'Formatos de exportação',
    'export.html': 'HTML enriquecido',
    'export.htmlDesc': 'Leitura e impressão local.',
    'export.json': 'JSON analítico',
    'export.jsonDesc': 'Integrações e automação.',
    'export.markdownDesc': 'Notas de caso e documentação.',
    'export.csv': 'CSV de evidências',
    'export.csvDesc': 'Finding, scores, qualidade da fonte, IPS e proveniência.',
    'export.integrity': 'Integridade',
    'export.integrityDesc': 'O manifest calcula SHA-256 sobre o payload antes da inserção do próprio manifest. Isso verifica a integridade do arquivo, não autoria ou identidade.',
  },
  es: {
    'lang.select': 'Seleccionar idioma',
    'lang.available': 'Idiomas disponibles',
    'lang.active': 'Idioma activo',
    'header.report': 'Informe',
    'header.cases': 'Casos',
    'header.batch': 'Lote',
    'header.ai': 'IA',
    'header.theme': 'Tema',
    'header.export': 'Exportar',
    'header.reset': 'Limpiar espacio de trabajo',
    'header.found': 'encontrados',
    'header.checked': 'verificados',
    'target.username': 'Usuario',
    'target.email': 'Correo',
    'target.usernamePlaceholder': 'usuario para investigar',
    'target.emailPlaceholder': 'correo para validar',
    'target.clear': 'limpiar',
    'target.quick': 'Rápido',
    'target.standard': 'Estándar',
    'target.full': 'Completo',
    'target.settings': 'Configuración avanzada',
    'target.run': 'Ejecutar escaneo',
    'target.stop': 'Detener',
    'target.detectorsScope': 'detectores en alcance',
    'target.baseConcurrency': 'concurrencia base',
    'target.evidenceOn': 'Evidence Engine activo',
    'target.evidenceDemand': 'Evidence Engine bajo demanda',
    'target.fullProgressive': 'Full usa discovery → validation',
    'target.batchCsv': 'CSV por lote',
    'nav.intelligence': 'Inteligencia',
    'nav.evidence': 'Evidencia',
    'nav.platforms': 'Plataformas',
    'nav.correlation': 'Correlación',
    'nav.console': 'Consola',
    'nav.batch': 'Lote',
    'stats.collected': 'recopilado',
    'stats.found': 'encontrados',
    'stats.unresolved': 'sin resolver',
    'stats.filterEvidence': 'Filtrar evidencia...',
    'stats.all': 'todos',
    'stats.uncertain': 'inciertos',
    'stats.absent': 'ausentes',
    'report.requirement': 'Requisito',
    'report.assessment': 'Evaluación',
    'report.evidence': 'Evidencia',
    'report.correlation': 'Correlación',
    'report.gaps': 'Brechas',
    'report.integrity': 'Integridad',
    'report.auditTable': 'Tabla de auditoría',
    'report.generatedLocal': 'Generado localmente',
    'report.highValue': 'Hallazgos de alto valor',
    'report.highValueDetail': 'hallazgos que merecen revisión',
    'report.coverage': 'Cobertura efectiva',
    'report.completed': 'completados',
    'report.unresolved': 'Sin resolver',
    'report.unresolvedDetail': 'inciertos, limitados o con error',
    'report.analyticalGaps': 'Brechas analíticas',
    'report.gapsDetail': 'preguntas capaces de cambiar la evaluación',
    'report.requirementTitle': '¿Qué pregunta estamos intentando responder?',
    'report.requirementDesc': 'La misma evidencia tiene distinto valor según el requisito. Mineiro pondera la relevancia analítica según la pregunta seleccionada.',
    'report.executive': 'Vista ejecutiva',
    'report.heroTitle': 'Huella pública observada, separada de la hipótesis y de la conclusión.',
    'report.heroLead': 'El informe muestra qué se observó, qué se evaluó, qué contradice la hipótesis y qué falta para responder a la pregunta de inteligencia.',
    'report.executiveDesc': 'Primero la conclusión operativa. La cantidad de checks vive en el apéndice, donde corresponde.',
    'report.requested': 'Solicitados',
    'report.requestedDetail': 'detectores solicitados',
    'report.completedLabel': 'Completados',
    'report.completedDetail': 'ejecuciones finalizadas',
    'report.conclusive': 'Concluyentes',
    'report.conclusiveDetail': 'positivo o ausencia explícita',
    'report.blocked': 'Bloqueados / no concluyentes',
    'report.blockedDetail': 'no usar como conclusión negativa',
    'home.eyebrow': 'Mineiro · OSINT Investigation Workbench',
    'home.title': 'Consulta un handle público. Conserva la evidencia.',
    'home.lead': 'Mineiro prueba un username en superficies públicas, separa lo observado de lo inferido y genera un informe que puedes auditar.',
    'home.exampleLabel': 'Prueba un ejemplo',
    'home.exampleNote': 'Los ejemplos son organizaciones públicas de código abierto. Investiga solo con un propósito legítimo y autorizado.',
    'home.verdictTitle': 'Cómo leer un veredicto',
    'home.verdictFound': 'Observado en una página pública. Una pista, no prueba de identidad.',
    'home.verdictAbsent': 'Ausencia explícita confirmada por la respuesta del sitio.',
    'home.verdictUncertain': 'Bloqueado, limitado o no concluyente. Nunca lo leas como negativo.',
    'home.modesTitle': 'Elige la profundidad',
    'home.modeQuickName': 'Rápido',
    'home.modeQuickDesc': '20 plataformas en segundos. Una comprobación inicial sin el Evidence Engine.',
    'home.modeStandardName': 'Estándar',
    'home.modeStandardDesc': '50 plataformas con el Evidence Engine y la línea base diferencial contra soft-404.',
    'home.modeFullName': 'Completo',
    'home.modeFullDesc': 'Todo el registro en dos fases: descubrimiento rápido y luego comprobaciones profundas solo en candidatos.',
    'home.recommended': 'Recomendado',
    'home.selected': 'Seleccionado',
    'home.stepsTitle': 'De la observación a la evaluación',
    'home.stepCollectTitle': 'Recolectar',
    'home.stepCollectDesc': 'Los detectores públicos se consultan con un fetch protegido: solo IPs públicas, sin bypass.',
    'home.stepEvidenceTitle': 'Evidencia',
    'home.stepEvidenceDesc': 'Ocho comprobaciones por respuesta, más una línea base contra un handle que no puede existir.',
    'home.stepCorrelateTitle': 'Correlacionar',
    'home.stepCorrelateDesc': 'Usernames parecidos y dominios compartidos son vínculos candidatos, nunca conclusiones.',
    'home.stepAssessTitle': 'Evaluar',
    'home.stepAssessDesc': 'Hipótesis, contradicciones y vacíos, exportados con hashes de integridad.',
    'home.trust1': 'Solo señales públicas',
    'home.trust2': 'Sin bypass de CAPTCHA ni login',
    'home.trust3': 'Observación no es identidad',
    'home.batch': 'Lote desde CSV',
    'home.cases': 'Abrir casos',
    'home.searchHint': 'Ctrl+K enfoca la búsqueda · Ctrl+Enter ejecuta el scan · ? lista todos los atajos',
    'home.issueEmail': 'Esto parece una dirección de e-mail.',
    'home.issueEmailAction': 'Cambiar al modo e-mail',
    'home.issueUrl': 'Esto es una URL de perfil. El handle es {handle}.',
    'home.issueUrlAction': 'Usar @{handle}',
    'home.issueSpaces': 'Los usernames rara vez tienen espacios.',
    'home.issueSpacesAction': 'Usar {handle}',
    'home.issueInvalidEmail': 'Esto no parece un e-mail válido.',
    'home.recentTitle': 'Continúa donde lo dejaste',
    'home.recentSummary': '{found} encontrados · {total} verificados',
    'home.statusLocal': 'Ejecutándose localmente · v{version}',
    'home.statusPublic': 'Instancia compartida · límites estrictos, sin almacenamiento · v{version}',
    'home.aiOn': 'Copiloto de IA configurado',
    'home.aiOff': 'Copiloto de IA apagado (opcional)',
    'report.knownAssessedUnknown': 'Conocido · Evaluado · Desconocido',
    'report.collectionHealth': 'Salud de la recolección',
    'report.keyJudgments': 'Juicios principales',
    'report.keyJudgmentsDesc': 'Cada juicio incluye confianza y base. La conclusión debe mostrar de dónde proviene.',
    'report.collectionCoverage': 'Lo que realmente se consultó',
    'report.collectionCoverageDesc': 'Encontrar tres cuentas en 984 solicitudes no es lo mismo que encontrar tres cuentas en 92 consultas completadas.',
    'report.highConfidence': 'Hallazgos de mayor valor',
    'report.highConfidenceDesc': 'Ordenados por Intelligence Priority Score, no por el orden de respuesta del servidor.',
    'report.evidenceMatrix': 'Matriz de evidencia',
    'report.evidenceMatrixDesc': 'Detector, observación, correlación, calidad de fuente, IPS y procedencia permanecen separados.',
    'report.clusters': 'Clusters observables',
    'report.clustersDesc': 'Agrupa servicios por contexto público sin convertir presencia digital en perfil psicológico.',
    'report.correlationGraph': 'Relaciones públicas observadas',
    'report.correlationGraphDesc': 'Cada arista tiene relación, confianza, evidencia y procedencia. Ninguna arista significa "same person = true".',
    'report.hypotheses': 'Hipótesis y alternativa',
    'report.hypothesesDesc': 'La hipótesis alternativa permanece visible para reducir la confirmación automática de la primera teoría.',
    'report.supporting': 'Evidencia de soporte & Analytic Ledger',
    'report.supportingDesc': 'Cada claim apunta a IDs de evidencia. Haz clic en un ID para volver al finding que sostiene la conclusión.',
    'report.contradictions': 'Evidencia contra la correlación',
    'report.contradictionsDesc': 'La contradicción es evidencia, no una molestia. Debe aparecer tan claramente como el soporte.',
    'report.unresolvedTitle': 'Resultados que no pueden convertirse en conclusión',
    'report.unresolvedDesc': 'WAF, rate limit y observaciones inconclusas permanecen visibles y separadas de los positivos.',
    'report.gapsTitle': 'Lo que todavía no sabemos',
    'report.gapsDesc': 'Las brechas son preguntas que, si se responden, pueden cambiar materialmente la evaluación.',
    'report.timeline': 'Línea temporal de inteligencia',
    'report.timelineDesc': 'Timestamp del escaneo, creación de cuenta, primera evidencia pública y timestamp de la fuente se tratan como cosas diferentes.',
    'report.pivots': 'Próximas acciones con valor esperado',
    'report.pivotsDesc': 'La prioridad es corroborar, resolver contradicciones y cerrar brechas, no acumular más hits.',
    'report.plan': 'Plan de recolección y condición de parada',
    'report.planDesc': 'El informe indica qué hacer después y, sobre todo, cuándo detenerse.',
    'report.reliability': 'Calidad de fuente y confiabilidad',
    'report.reliabilityDesc': 'Detector Reliability responde si la regla funciona. Source Quality responde qué tan fuerte es la fuente observada.',
    'report.methodology': 'Separación entre recolección, evidencia, correlación y evaluación',
    'report.methodologyDesc': 'La metodología impide que una respuesta HTTP se convierta automáticamente en una conclusión de identidad.',
    'report.provenance': 'De dónde provino cada capa',
    'report.provenanceDesc': 'PRIMARY, DERIVED, EXTERNAL y AI_SYNTHESIZED nunca son equivalentes. La IA sigue siendo hipótesis, no observación.',
    'report.appendix': 'Apéndice técnico',
    'report.appendixDesc': 'Los detalles de volumen, checks y distribución viven aquí. Sustentan el análisis, pero no deben dominar la portada.',
    'report.integrityTitle': 'Snapshot de integridad',
    'report.integrityDesc': 'SHA-256 verifica el estado canónico usado en el informe. No demuestra autoría, identidad ni cadena de custodia legal.',
    'report.manifest': 'Lo que se exportará',
    'report.manifestDesc': 'La exportación configurable registra secciones incluidas y excluidas, formato, generación local y hash del payload exportado.',
    'report.openExport': 'Abrir constructor de exportación',
    'ai.title': 'Analista IA',
    'ai.workspaceTitle': 'Copiloto analítico conectado a la evaluación, no al profiling legado.',
    'ai.workspaceDesc': 'La IA recibe la capa estructurada de evidencia y puede resumir, revisar contradicciones, brechas y pivotes. No aumenta la confianza factual por sí sola.',
    'ai.configure': 'Configurar Gemini',
    'ai.connection': 'Conexión',
    'ai.configured': 'configurado',
    'ai.notConfigured': 'no configurado',
    'ai.credentialSource': 'Origen de credencial',
    'ai.personal': 'personal',
    'ai.server': 'servidor',
    'ai.none': 'ninguna',
    'ai.unknown': 'desconocida',
    'ai.selectedModel': 'Modelo seleccionado',
    'ai.copilot': 'Copiloto Analista IA',
    'ai.copilotTitle': 'Usa IA para triage, no para fabricar certeza.',
    'ai.copilotDesc': 'El copiloto recibe solo la evaluación ya construida localmente. Puede resumir evidencia, sugerir pivotes, señalar contradicciones y priorizar brechas. La salida permanece AI_SYNTHESIZED y no aumenta la confianza factual.',
    'ai.optional': 'opcional · controlado por el analista',
    'ai.questionPlaceholder': 'Ej.: ¿qué contradicciones debo resolver antes de correlacionar las cuentas?',
    'ai.analyze': 'Analizar',
    'ai.requestFailed': 'Falló la solicitud al analista IA',
    'ai.executiveBrief': 'Resumen ejecutivo',
    'ai.contradictions': 'Contradicciones por resolver',
    'ai.intelligenceGaps': 'Brechas de inteligencia',
    'ai.recommendedPivots': 'Pivotes recomendados',
    'correlation.graphTab': 'Grafo de relaciones',
    'correlation.similarTab': 'Usuarios similares',
    'linkage.title': 'Vínculo de usernames',
    'linkage.heading': 'Variantes similares como pivotes, no como identidad confirmada.',
    'linkage.desc': 'El motor normaliza el identificador, genera mutaciones sintácticas conservadoras y calcula similitud de string. Una variante sigue siendo candidata hasta que exista evidencia pública independiente.',
    'linkage.observed': 'Handle exacto observado',
    'linkage.candidates': 'Variantes candidatas',
    'linkage.promotion': 'Regla de promoción',
    'linkage.promotionValue': 'pivot + evidencia pública independiente',
    'linkage.copy': 'Copiar',
    'linkage.copied': 'Copiado',
    'linkage.pivot': 'Escaneo de pivot',
    'linkage.method': 'Notas del método',
    'graph.title': 'Grafo de relaciones de cuentas',
    'graph.heading': 'Mapa de relaciones observadas y candidatos de vínculo.',
    'graph.desc': 'Las líneas sólidas provienen de evidencia pública observada. Las líneas discontinuas representan solo similitud de username y requieren validación independiente.',
    'graph.observed': 'observadas',
    'graph.candidate': 'candidatas',
    'graph.clickInspect': 'Haz clic en un nodo para inspeccionar.',
    'graph.solid': 'sólida = observada',
    'graph.dashed': 'discontinua = candidata',
    'gemini.title': 'Gemini · Copiloto Analista',
    'gemini.subtitle': 'Conecta Gemini al Copiloto Analista limitado por evidencia',
    'gemini.privacy': 'Privacidad y control',
    'gemini.privacyDesc': 'Tu clave se guarda solo en el almacenamiento local de este navegador y se envía al servidor local de Mineiro para solicitudes Gemini. Elimínala cuando quieras con Limpiar.',
    'gemini.obtainKey': 'Obtener clave gratuita en la consola del proveedor',
    'gemini.apiKey': 'Clave de API Gemini (GEMINI_API_KEY)',
    'gemini.blankKey': 'Si se deja en blanco, Mineiro usa GEMINI_API_KEY del entorno del servidor cuando está disponible. La evaluación determinística funciona sin IA.',
    'gemini.model': 'Modelo Gemini seleccionado',
    'gemini.testing': 'Probando...',
    'gemini.test': 'Probar conexión',
    'gemini.clear': 'Limpiar',
    'gemini.cancel': 'Cancelar',
    'gemini.save': 'Guardar configuración',
    'gemini.connectionError': 'Error de conexión al probar la clave.',
    'gemini.validationFailed': 'No se pudo validar la clave de API Gemini.',
    'export.title': 'Configura el informe antes de exportar.',
    'export.subtitle': 'Cada exportación genera el archivo principal y un manifest JSON separado con SHA-256 del payload, formato y lista exacta de secciones incluidas y excluidas.',
    'export.content': 'Contenido del informe',
    'export.sectionsSelected': 'secciones seleccionadas',
    'export.default': 'Predeterminado',
    'export.all': 'Todo',
    'export.formats': 'Formatos de exportación',
    'export.html': 'HTML enriquecido',
    'export.htmlDesc': 'Lectura e impresión local.',
    'export.json': 'JSON analítico',
    'export.jsonDesc': 'Integraciones y automatización.',
    'export.markdownDesc': 'Notas de caso y documentación.',
    'export.csv': 'CSV de evidencia',
    'export.csvDesc': 'Finding, scores, calidad de fuente, IPS y procedencia.',
    'export.integrity': 'Integridad',
    'export.integrityDesc': 'El manifest calcula SHA-256 sobre el payload antes de insertar el propio manifest. Esto verifica la integridad del archivo, no autoría ni identidad.',
  },
} as const;

export type UiMessageKey = keyof typeof uiMessages.en;

function formatMessage(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

const literalLookup = new Map<string, UiMessageKey>();
const legacyLiteralLookup = new Map<string, keyof Translations>();

for (const locale of ['en', 'pt', 'es'] as Language[]) {
  const messages = uiMessages[locale];
  for (const key of Object.keys(messages) as UiMessageKey[]) {
    literalLookup.set(messages[key].trim(), key);
  }

  const legacy = translations[locale];
  for (const key of Object.keys(legacy) as Array<keyof Translations>) {
    legacyLiteralLookup.set(legacy[key].trim(), key);
  }
}

function autoTranslateTree(root: ParentNode, language: Language) {
  const translateText = (value: string) => {
    const trimmed = value.trim();
    const key = literalLookup.get(trimmed);
    const legacyKey = legacyLiteralLookup.get(trimmed);
    if (!key && !legacyKey) return value;
    const translated = key ? uiMessages[language][key] : translations[language][legacyKey!];
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    return `${leading}${translated}${trailing}`;
  };

  const walk = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walk.nextNode()) textNodes.push(walk.currentNode as Text);
  for (const node of textNodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest('[data-i18n-skip="true"]')) continue;
    const next = translateText(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  const attrs = ['placeholder', 'title', 'aria-label'] as const;
  if ('querySelectorAll' in root) {
    (root as ParentNode).querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.closest('[data-i18n-skip="true"]')) return;
      for (const attr of attrs) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        const translated = translateText(value);
        if (translated !== value) el.setAttribute(attr, translated);
      }
    });
  }
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  tr: (key: UiMessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'pt',
  setLanguage: () => {},
  t: translations.pt,
  tr: (key, vars) => formatMessage(uiMessages.pt[key], vars),
});

const LANGUAGE_STORAGE_KEY = 'mineiro_language_preference';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'pt' || stored === 'es') return stored;
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
    return 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Language switching still works for the current session.
    }
  };

  const tr = (key: UiMessageKey, vars?: Record<string, string | number>) =>
    formatMessage(uiMessages[language][key], vars);

  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es' : 'en';
    document.title = `Mineiro Username Intelligence — ${language === 'pt' ? 'Workbench de Investigação OSINT' : language === 'es' ? 'Workbench de Investigación OSINT' : 'OSINT Investigation Workbench'}`;

    const root = document.getElementById('root');
    if (!root) return;
    autoTranslateTree(root, language);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) autoTranslateTree(node as Element, language);
          else if (node.nodeType === Node.TEXT_NODE && node.parentNode) autoTranslateTree(node.parentNode, language);
        });
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translations[language], tr }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
