// DeckManager - handles deck persistence via localStorage and validation
import type { CardInfo, Deck } from './types';
import { getCardInfo, getCardByPid } from './CardDatabase';

export class DeckManager {
  private _deckNames: string[] = [];

  constructor() {
    this.getDeckNames();
  }

  getDeckNames(): string[] {
    const names = localStorage.getItem('deck_filenames');
    this._deckNames = names ? JSON.parse(names) : [];
    return this._deckNames;
  }

  private _updateDeckNames(): void {
    this._deckNames.sort();
    localStorage.setItem('deck_filenames', JSON.stringify(this._deckNames));
  }

  createDeck(name: string, deck: Deck): boolean {
    if (this._deckNames.includes(name)) return false;
    this._deckNames.push(name);
    this._updateDeckNames();
    this.saveDeck(name, deck);
    return true;
  }

  renameDeck(name: string, newName: string): boolean {
    if (!this._deckNames.includes(name)) return false;
    if (this._deckNames.includes(newName)) return false;
    const deck = this.loadDeck(name);
    if (!deck) return false;
    this.deleteDeck(name);
    this.createDeck(newName, deck);
    return true;
  }

  deleteDeck(name: string): boolean {
    const idx = this._deckNames.indexOf(name);
    if (idx < 0) return false;
    this._deckNames.splice(idx, 1);
    this._updateDeckNames();
    localStorage.removeItem('deck_file_' + name);
    return true;
  }

  loadDeck(name: string): Deck | null {
    const deck = localStorage.getItem('deck_file_' + name);
    if (!deck) return null;
    return JSON.parse(deck);
  }

  saveDeck(name: string, deck: Deck): boolean {
    if (!this._deckNames.includes(name)) return false;
    localStorage.setItem('deck_file_' + name, JSON.stringify(deck));
    return true;
  }

  checkMainDeck(pids: number[]): boolean {
    if (!Array.isArray(pids)) return false;
    if (pids.length !== 40) return false;
    const cardDb = getCardInfo();
    const infos: CardInfo[] = [];
    for (let i = 0; i < pids.length; i++) {
      let info = cardDb[String(pids[i])];
      if (!info) return false;
      info = cardDb[String(info.cid)];
      if (!info) return false;
      infos.push(info);
    }
    if (infos.some(info =>
      info.cardType === 'LRIG' || info.cardType === 'ARTS' || info.cardType === 'RESONA'
    )) return false;
    if (this.burstCount(pids) !== 20) return false;
    if (!this.checkDuplicate(pids)) return false;
    return true;
  }

  checkLrigDeck(pids: number[]): boolean {
    if (!Array.isArray(pids)) return false;
    if (pids.length > 10) return false;
    const cardDb = getCardInfo();
    const infos: CardInfo[] = [];
    for (let i = 0; i < pids.length; i++) {
      let info = cardDb[String(pids[i])];
      if (!info) return false;
      info = cardDb[String(info.cid)];
      if (!info) return false;
      infos.push(info);
    }
    if (infos.some(info =>
      info.cardType === 'SIGNI' || info.cardType === 'SPELL'
    )) return false;
    if (!infos.some(info =>
      info.cardType === 'LRIG' && info.level === 0
    )) return false;
    if (!this.checkDuplicate(pids)) return false;
    return true;
  }

  checkMayusRoom(pids: number[]): boolean {
    const cardDb = getCardInfo();
    const infos: CardInfo[] = [];
    for (let i = 0; i < pids.length; i++) {
      let info = cardDb[String(pids[i])];
      if (!info) return false;
      info = cardDb[String(info.cid)];
      if (!info) return false;
      infos.push(info);
    }

    // Banned combos
    const hasCid = (cid: number) => infos.some(info => info.cid === cid);

    // Fox + Repair/Three out
    if (hasCid(33) && (hasCid(34) || hasCid(84))) return false;
    // V・＠・C + Resonance combo
    if (hasCid(1202) && (hasCid(884) || hasCid(1369))) return false;
    // Lock + Split/Dig
    if (hasCid(534) && (hasCid(408) || hasCid(570))) return false;
    // Ar + Magic hand
    if (hasCid(814) && hasCid(1090)) return false;
    // Double Mayu
    if (hasCid(649) && hasCid(1562)) return false;
    // Typhoon + Snake
    if (hasCid(957) && hasCid(1652)) return false;

    // Per-card limits
    const limitMap: Record<number, number> = {
      37: 2,    // Valkyrie
      34: 2,    // Repair
      178: 2,   // Arch Gain
      1501: 2,  // Apato
      534: 1,   // Lock You
      474: 0,   // No Gain
      23: 0,    // Late Bloomer
      689: 0,   // RAINY
      1030: 0,  // Surrounded
      1457: 0,  // Servant Z
      1212: 0,  // C・L
    };

    for (let i = 0; i < infos.length; i++) {
      const cid = infos[i].cid;
      if (cid in limitMap) {
        limitMap[cid]--;
        if (limitMap[cid] < 0) return false;
      }
    }
    return true;
  }

  checkDeck(deck: Deck, mayusRoom: boolean = true): boolean {
    const valid = this.checkMainDeck(deck.mainDeck) && this.checkLrigDeck(deck.lrigDeck);
    if (!valid) return false;
    if (!mayusRoom) return true;
    return this.checkMayusRoom(deck.mainDeck.concat(deck.lrigDeck));
  }

  burstCount(pids: number[]): number {
    const cardDb = getCardInfo();
    let count = 0;
    pids.forEach(pid => {
      let info = cardDb[String(pid)];
      if (!info) return;
      info = cardDb[String(info.cid)];
      if (!info) return;
      if (info.burstEffectTexts && info.burstEffectTexts.length) {
        count++;
      }
    });
    return count;
  }

  checkDuplicate(pids: number[]): boolean {
    const cardDb = getCardInfo();
    const bucket: Record<number, number> = {};
    pids.forEach(pid => {
      let info = cardDb[String(pid)];
      if (!info) return;
      if (info.sideA) {
        info = cardDb[String(info.sideA)];
        if (!info) return;
      }
      if (info.cid in bucket) {
        bucket[info.cid]++;
      } else {
        bucket[info.cid] = 1;
      }
    });
    for (const cid in bucket) {
      if (bucket[cid] > 4) return false;
    }
    return true;
  }
}
