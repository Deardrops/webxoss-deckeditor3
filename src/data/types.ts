// Core type definitions for WEBXOSS Deck Editor

export interface CardInfo {
  pid: number;
  cid: number;
  wxid: string;
  name: string;
  rarity: string;
  cardType: CardType;
  color: string;
  level: number;
  limit: number;
  power: number;
  limiting: string;
  illust: string;
  classes: string[];
  costWhite: number;
  costBlack: number;
  costRed: number;
  costBlue: number;
  costGreen: number;
  costColorless: number;
  guardFlag: boolean;
  multiEner: boolean;
  rise?: boolean;
  trap?: boolean;
  acce?: boolean;
  crossLeft?: string;
  crossRight?: string;
  sideA?: number;
  timmings?: string[];
  constEffectTexts?: string[];
  startUpEffectTexts?: string[];
  actionEffectTexts?: string[];
  burstEffectTexts?: string[];
}

export type CardType = 'LRIG' | 'SIGNI' | 'SPELL' | 'ARTS' | 'RESONA';

export interface Deck {
  mainDeck: number[];
  lrigDeck: number[];
}

export interface DeckFile {
  format: string;
  version: string;
  content: Deck;
}

export interface DeckObj {
  idx: number;
  info: CardInfo;
}

export type BreakpointType = 'desktop' | 'tablet' | 'mobile';

export interface LayoutConfig {
  breakpoint: BreakpointType;
  width: number;
  height: number;
  detailWidth: number;
  deckWidth: number;
  searchWidth: number;
  cardWidth: number;
  cardHeight: number;
  padding: number;
  gap: number;
}

// WIXOSS color palette for UI theming
export const WIXOSS_COLORS = {
  white: '#e8e4df',
  black: '#3d3d3d',
  red: '#e74c3c',
  blue: '#3498db',
  green: '#27ae60',
  colorless: '#95a5a6',
  // UI accent colors
  primary: '#6366f1',     // Indigo
  primaryDark: '#4f46e5',
  primaryLight: '#a5b4fc',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  background: '#f0f2f5',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
} as const;

// Card type to color mapping for visual distinction
export const CARD_TYPE_COLORS: Record<CardType, string> = {
  LRIG: '#8b5cf6',    // Purple
  SIGNI: '#3b82f6',   // Blue
  SPELL: '#f59e0b',   // Amber
  ARTS: '#ef4444',     // Red
  RESONA: '#10b981',   // Emerald
};

export const CARD_COLOR_MAP: Record<string, string> = {
  white: '#f5f0e8',
  black: '#2d2d2d',
  red: '#fee2e2',
  blue: '#dbeafe',
  green: '#dcfce7',
  colorless: '#f1f5f9',
};
