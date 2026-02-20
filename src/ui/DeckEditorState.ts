import type { CardInfo, Deck, DeckObj } from '../data/types';
import { getCardByPid, getCardInfo, getCardName } from '../data/CardDatabase';
import { DeckManager } from '../data/DeckManager';
import { Searcher } from '../data/Searcher';
import { eventBus } from './EventBus';

export const STATE_EVENTS = {
  DECK_LOADED: 'state:deckLoaded',
  DECK_UPDATED: 'state:deckUpdated',
  DECK_LIST_CHANGED: 'state:deckListChanged',
  SEARCH_RESULTS: 'state:searchResults',
  CARD_SELECTED: 'state:cardSelected',
} as const;

const WHITE_HOPE: Deck = {
  mainDeck: [
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
  ],
  lrigDeck: [104, 105, 106, 107, 108, 109, 110, 111],
};

export class DeckEditorState {
  readonly deckManager = new DeckManager();
  readonly searcher = new Searcher();

  deckNames: string[] = [];
  deckName = '';
  deckIndex = -1;

  mainDeckObjs: DeckObj[] = [];
  lrigDeckObjs: DeckObj[] = [];

  searchResults: CardInfo[] = [];
  selectedCard: CardInfo | null = null;

  constructor() {
    this.refreshDeckList();
    if (this.deckNames.length === 0) {
      this.deckManager.createDeck('WHITE_HOPE', WHITE_HOPE);
      this.refreshDeckList();
    }
    this.selectDeck(0);
  }

  refreshDeckList(): void {
    this.deckNames = this.deckManager.getDeckNames();
    eventBus.emit(STATE_EVENTS.DECK_LIST_CHANGED, this.deckNames);
  }

  selectDeck(idx: number): void {
    if (idx < 0 || idx >= this.deckNames.length) return;
    this.deckIndex = idx;
    this.deckName = this.deckNames[idx];
    this.loadCurrentDeck();
    eventBus.emit(STATE_EVENTS.DECK_LOADED, this.deckName, this.deckIndex);
  }

  createDeck(name: string, deck?: Deck): void {
    if (!name) return;
    const idx = this.deckNames.indexOf(name);
    if (idx >= 0) {
      this.selectDeck(idx);
      return;
    }
    this.deckManager.createDeck(name, deck ?? this.getCurrentDeck());
    this.refreshDeckList();
    const newIdx = this.deckNames.indexOf(name);
    this.selectDeck(newIdx);
  }

  copyDeck(name: string): void {
    if (!name) return;
    this.createDeck(name, this.getCurrentDeck());
  }

  deleteDeck(name: string): void {
    const idx = this.deckIndex;
    this.deckManager.deleteDeck(name);
    this.refreshDeckList();
    if (this.deckNames.length === 0) {
      this.deckManager.createDeck('WHITE_HOPE', WHITE_HOPE);
      this.refreshDeckList();
    }
    const newIdx = Math.min(idx, this.deckNames.length - 1);
    this.selectDeck(newIdx);
  }

  renameDeck(newName: string): void {
    if (!newName || newName === this.deckName) return;
    if (this.deckNames.includes(newName)) return;
    const oldName = this.deckName;
    this.createDeck(newName, this.getCurrentDeck());
    this.deckManager.deleteDeck(oldName);
    this.refreshDeckList();
    const idx = this.deckNames.indexOf(newName);
    this.selectDeck(idx);
  }

  private loadCurrentDeck(): void {
    const deck = this.deckManager.loadDeck(this.deckName);
    if (!deck) {
      this.mainDeckObjs = [];
      this.lrigDeckObjs = [];
      return;
    }
    this.mainDeckObjs = this.pidsToObjs(deck.mainDeck);
    this.lrigDeckObjs = this.pidsToObjs(deck.lrigDeck);
    this.sortDeck(this.mainDeckObjs);
    this.sortDeck(this.lrigDeckObjs);
    eventBus.emit(STATE_EVENTS.DECK_UPDATED);
  }

  private pidsToObjs(pids: number[]): DeckObj[] {
    const objs: DeckObj[] = [];
    pids.forEach((pid, idx) => {
      const info = getCardByPid(pid);
      if (info) {
        objs.push({ idx, info });
      }
    });
    return objs;
  }

  getCurrentDeck(): Deck {
    return {
      mainDeck: this.mainDeckObjs.map(obj => obj.info.pid),
      lrigDeck: this.lrigDeckObjs.map(obj => obj.info.pid),
    };
  }

  addCard(info: CardInfo): void {
    const isLrig = info.cardType === 'LRIG' || info.cardType === 'ARTS' || info.cardType === 'RESONA';
    const data = isLrig ? this.lrigDeckObjs : this.mainDeckObjs;
    const limit = isLrig ? 20 : 50;
    if (data.length >= limit) return;

    data.push({ idx: data.length, info });
    this.sortDeck(data);
    this.autoSave();
    eventBus.emit(STATE_EVENTS.DECK_UPDATED);
  }

  removeCard(isLrig: boolean, idx: number): void {
    const data = isLrig ? this.lrigDeckObjs : this.mainDeckObjs;
    if (idx < 0 || idx >= data.length) return;
    data.splice(idx, 1);
    this.sortDeck(data);
    this.autoSave();
    eventBus.emit(STATE_EVENTS.DECK_UPDATED);
  }

  private autoSave(): void {
    if (this.deckName) {
      this.deckManager.saveDeck(this.deckName, this.getCurrentDeck());
    }
  }

  // Exact port from editor.js defaultSort — complex card-type priority + level/power tiebreakers
  sortDeck(data: DeckObj[]): void {
    data.sort((aObj, bObj) => {
      const a = aObj.info;
      const b = bObj.info;
      const aIdx = aObj.idx;
      const bIdx = bObj.idx;

      if (a.cardType === 'LRIG') {
        if (b.cardType !== 'LRIG') return -1;
        if (b.level !== a.level) return a.level - b.level;
      }
      if (a.cardType === 'ARTS') {
        if (b.cardType !== 'ARTS') return 1;
      }
      if (a.cardType === 'RESONA') {
        if (b.cardType === 'LRIG') return 1;
        if (b.cardType === 'ARTS') return -1;
        if (b.level !== a.level) return a.level - b.level;
      }
      if (a.cardType === 'SIGNI') {
        if (b.cardType !== 'SIGNI') return -1;
        if (a.level !== b.level) return b.level - a.level;
        if (a.power !== b.power) return a.power - b.power;
      }
      if (a.cardType === 'SPELL') {
        if (b.cardType !== 'SPELL') return 1;
      }
      if (a.cid !== b.cid) return a.cid - b.cid;
      return aIdx - bIdx;
    });
    data.forEach((obj, idx) => {
      obj.idx = idx;
    });
  }

  get mainDeckValid(): boolean {
    return this.deckManager.checkMainDeck(this.mainDeckObjs.map(o => o.info.pid));
  }

  get lrigDeckValid(): boolean {
    return this.deckManager.checkLrigDeck(this.lrigDeckObjs.map(o => o.info.pid));
  }

  get mayusRoomValid(): boolean {
    const allPids = this.mainDeckObjs.map(o => o.info.pid)
      .concat(this.lrigDeckObjs.map(o => o.info.pid));
    return this.deckManager.checkMayusRoom(allPids);
  }

  get burstCount(): number {
    return this.deckManager.burstCount(this.mainDeckObjs.map(o => o.info.pid));
  }

  search(query: string): void {
    this.searchResults = this.searcher.search(query);
    eventBus.emit(STATE_EVENTS.SEARCH_RESULTS, this.searchResults);
  }

  selectCard(info: CardInfo): void {
    this.selectedCard = info;
    eventBus.emit(STATE_EVENTS.CARD_SELECTED, info);
  }

  exportToJson(): string {
    return JSON.stringify({
      format: 'WEBXOSS Deck',
      version: '1',
      content: this.getCurrentDeck(),
    });
  }

  importFromJson(json: string): Deck | null {
    try {
      const obj = JSON.parse(json);
      const legal =
        obj.format === 'WEBXOSS Deck' &&
        +obj.version === 1 &&
        obj.content.mainDeck.length <= 50 &&
        obj.content.lrigDeck.length <= 20;
      return legal ? obj.content : null;
    } catch {
      return null;
    }
  }

  deckToText(): string {
    const deck = this.getCurrentDeck();
    const cardDb = getCardInfo();
    let text = '';

    const sections = [
      deck.lrigDeck,
      deck.mainDeck.filter(pid => {
        const info = cardDb[String(pid)];
        return !(info?.burstEffectTexts?.length);
      }),
      deck.mainDeck.filter(pid => {
        const info = cardDb[String(pid)];
        return info?.burstEffectTexts?.length;
      }),
    ];

    sections.forEach((section, sIdx) => {
      let lastName = '';
      let count = 0;
      section.forEach((pid, idx) => {
        const info = cardDb[String(pid)];
        if (!info) return;
        const name = getCardName(info);
        if (name !== lastName && idx !== 0) {
          text += count + ' ' + lastName + '\n';
          lastName = name;
          count = 1;
        } else {
          lastName = name;
          count++;
        }
        if (idx === section.length - 1) {
          text += count + ' ' + lastName + '\n';
        }
      });
      if (sIdx !== sections.length - 1) {
        text += '——————————\n';
      }
    });

    return text;
  }
}
