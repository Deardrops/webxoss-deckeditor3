// CardInfo database - wraps the global CardInfo from the parent page
import type { CardInfo } from './types';

declare global {
  interface Window {
    CardInfo: Record<string, CardInfo>;
    CardInfo_jp: Record<string, CardInfo>;
    CardInfo_zh: Record<string, CardInfo>;
    CardInfo_en: Record<string, CardInfo>;
    CardInfo_ko: Record<string, CardInfo>;
    CardInfo_ru: Record<string, CardInfo>;
    CardInfo_it: Record<string, CardInfo>;
    CardInfo_sp: Record<string, CardInfo>;
    Localize: LocalizeInterface;
  }
}

interface LocalizeInterface {
  init(): void;
  DOM(page: string): void;
  getLanguage(): string;
  cardName(info: CardInfo): string;
  color(color: string): string;
  cardType(info: CardInfo): string;
  effectTexts(info: CardInfo): string;
  burstEffectTexts(info: CardInfo): string;
  classes(info: CardInfo): string;
  cost(info: CardInfo): string;
  limiting(info: CardInfo): string;
  guard(info: CardInfo): string;
  timmings(info: CardInfo): string;
  propToKey(prop: string): string;
  traditionalize(str: string): string;
  editor(key: string, ...args: string[]): string;
  (category: string, key: string): string;
}

// Access the global CardInfo loaded via script tag
export function getCardInfo(): Record<string, CardInfo> {
  return window.CardInfo || {};
}

export function getCardByPid(pid: number): CardInfo | undefined {
  const db = getCardInfo();
  return db[String(pid)];
}

export function getCardByCid(cid: number): CardInfo | undefined {
  const db = getCardInfo();
  return db[String(cid)];
}

export function getAllCards(): CardInfo[] {
  const db = getCardInfo();
  const cards: CardInfo[] = [];
  for (const pid in db) {
    cards.push(db[pid]);
  }
  return cards;
}

export function getCardName(info: CardInfo): string {
  if (window.Localize) {
    return window.Localize.cardName(info);
  }
  return info.name;
}

export function getCardImageUrl(wxid: string, baseDir: string = '../'): string {
  if (!wxid) return '';
  // Try ImageFileCache first (if available)
  //if (window.ImageFileCache) {
  //  const cached = window.ImageFileCache.getUrlByPid(pid);
  //  if (cached) return cached;
  //}
  const deckid = wxid.split('-')[0]
  return `http://192.168.98.129:3000/images/${deckid}/${wxid}.jpg`;
}

declare global {
  interface Window {
    ImageFileCache?: {
      getUrlByPid(pid: number): string;
      fetchAndCache(pid: number, url: string): void;
    };
  }
}
