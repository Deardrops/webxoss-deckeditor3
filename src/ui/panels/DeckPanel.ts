import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CardInfo, DeckObj } from '../../data/types';
import { WIXOSS_COLORS } from '../../data/types';
import { CardThumbnail } from '../components/CardThumbnail';
import { Button } from '../components/Button';
import { ScrollContainer } from '../components/ScrollContainer';
import { eventBus } from '../EventBus';
import { DeckEditorState, STATE_EVENTS } from '../DeckEditorState';

const COLS = 10;
const CARD_GAP = 2;
const ZONE_PAD = 8;

export class DeckPanel extends Container {
  private bg: Graphics;
  private scrollContainer: ScrollContainer;
  private deckContent: Container;

  private mainZoneTitle: Text;
  private mainZoneValidIcon: Text;
  private mainZoneBurstText: Text;
  private mainZoneContainer: Container;

  private lrigZoneTitle: Text;
  private lrigZoneValidIcon: Text;
  private lrigZoneContainer: Container;

  private mayusRoomText: Text;

  private state: DeckEditorState;
  private deckSelect: HTMLSelectElement;
  private deckNameInput: HTMLInputElement;

  private _panelWidth = 400;
  private _panelHeight = 600;
  private toolbarHeight = 44;

  constructor(state: DeckEditorState, width: number, height: number) {
    super();
    this.state = state;
    this._panelWidth = width;
    this._panelHeight = height;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.deckSelect = document.getElementById('deck-select-overlay') as HTMLSelectElement;
    this.deckSelect.style.display = 'block';
    this.deckSelect.addEventListener('change', () => {
      this.state.selectDeck(this.deckSelect.selectedIndex);
    });

    this.deckNameInput = document.getElementById('deck-name-input-overlay') as HTMLInputElement;
    this.deckNameInput.style.display = 'block';

    const btnY = 4;
    const btnH = 28;
    const btnGap = 4;
    let btnX = this._panelWidth - 8;

    const btnImportExport = new Button({
      label: 'I/O',
      width: 40,
      height: btnH,
      bgColor: 0x64748b,
      hoverColor: 0x475569,
      fontSize: 11,
      borderRadius: 6,
      onClick: () => this.openImportExport(),
    });
    btnX -= 40;
    btnImportExport.x = btnX;
    btnImportExport.y = btnY;
    this.addChild(btnImportExport);

    btnX -= btnGap;

    const btnRename = new Button({
      label: 'Rename',
      width: 56,
      height: btnH,
      bgColor: 0x64748b,
      hoverColor: 0x475569,
      fontSize: 11,
      borderRadius: 6,
      onClick: () => this.renameDeck(),
    });
    btnX -= 56;
    btnRename.x = btnX;
    btnRename.y = btnY;
    this.addChild(btnRename);

    btnX -= btnGap;

    const btnDelete = new Button({
      label: 'Del',
      width: 36,
      height: btnH,
      bgColor: 0xef4444,
      hoverColor: 0xdc2626,
      fontSize: 11,
      borderRadius: 6,
      onClick: () => this.deleteCurrentDeck(),
    });
    btnX -= 36;
    btnDelete.x = btnX;
    btnDelete.y = btnY;
    this.addChild(btnDelete);

    btnX -= btnGap;

    const btnCopy = new Button({
      label: 'Copy',
      width: 44,
      height: btnH,
      bgColor: 0x6366f1,
      hoverColor: 0x4f46e5,
      fontSize: 11,
      borderRadius: 6,
      onClick: () => this.copyCurrentDeck(),
    });
    btnX -= 44;
    btnCopy.x = btnX;
    btnCopy.y = btnY;
    this.addChild(btnCopy);

    btnX -= btnGap;

    const btnNew = new Button({
      label: 'New',
      width: 40,
      height: btnH,
      bgColor: 0x6366f1,
      hoverColor: 0x4f46e5,
      fontSize: 11,
      borderRadius: 6,
      onClick: () => this.createNewDeck(),
    });
    btnX -= 40;
    btnNew.x = btnX;
    btnNew.y = btnY;
    this.addChild(btnNew);

    this.scrollContainer = new ScrollContainer(width, height - this.toolbarHeight);
    this.scrollContainer.y = this.toolbarHeight;
    this.addChild(this.scrollContainer);

    this.deckContent = new Container();
    this.scrollContainer.content.addChild(this.deckContent);

    const titleStyle = new TextStyle({
      fontSize: 13,
      fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
      fill: 0x1e293b,
      fontWeight: '600',
    });
    const validStyle = new TextStyle({
      fontSize: 13,
      fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
      fill: 0x22c55e,
      fontWeight: '600',
    });
    const burstStyle = new TextStyle({
      fontSize: 11,
      fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
      fill: 0x64748b,
    });

    this.mainZoneTitle = new Text({ text: 'Main Deck', style: titleStyle });
    this.mainZoneTitle.x = ZONE_PAD;
    this.mainZoneTitle.y = 4;
    this.deckContent.addChild(this.mainZoneTitle);

    this.mainZoneValidIcon = new Text({ text: '✓', style: validStyle });
    this.mainZoneValidIcon.x = ZONE_PAD + 80;
    this.mainZoneValidIcon.y = 4;
    this.deckContent.addChild(this.mainZoneValidIcon);

    this.mainZoneBurstText = new Text({ text: 'Burst: 0/20', style: burstStyle });
    this.mainZoneBurstText.x = ZONE_PAD + 100;
    this.mainZoneBurstText.y = 6;
    this.deckContent.addChild(this.mainZoneBurstText);

    this.mainZoneContainer = new Container();
    this.mainZoneContainer.x = ZONE_PAD;
    this.mainZoneContainer.y = 24;
    this.deckContent.addChild(this.mainZoneContainer);

    this.lrigZoneTitle = new Text({ text: 'LRIG Deck', style: titleStyle.clone() });
    this.deckContent.addChild(this.lrigZoneTitle);

    this.lrigZoneValidIcon = new Text({ text: '✓', style: validStyle.clone() });
    this.deckContent.addChild(this.lrigZoneValidIcon);

    this.lrigZoneContainer = new Container();
    this.deckContent.addChild(this.lrigZoneContainer);

    this.mayusRoomText = new Text({
      text: "Mayu's Room: ✓",
      style: new TextStyle({
        fontSize: 11,
        fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
        fill: 0x22c55e,
        fontWeight: '500',
      }),
    });
    this.deckContent.addChild(this.mayusRoomText);

    this.drawBg();

    eventBus.on(STATE_EVENTS.DECK_LOADED, () => {
      this.updateDeckSelect();
      this.rebuildCards();
    });
    eventBus.on(STATE_EVENTS.DECK_UPDATED, () => this.rebuildCards());
    eventBus.on(STATE_EVENTS.DECK_LIST_CHANGED, () => this.updateDeckSelect());

    this.updateDeckSelect();
    this.rebuildCards();
  }

  private updateDeckSelect(): void {
    this.deckSelect.innerHTML = '';
    this.state.deckNames.forEach(name => {
      const opt = document.createElement('option');
      opt.textContent = name;
      this.deckSelect.appendChild(opt);
    });
    this.deckSelect.selectedIndex = this.state.deckIndex;
  }

  private rebuildCards(): void {
    this.mainZoneContainer.removeChildren();
    this.lrigZoneContainer.removeChildren();

    const cardW = this.getCardWidth();
    const cardH = Math.round(cardW * 1.4);

    this.state.mainDeckObjs.forEach((obj, idx) => {
      const thumb = new CardThumbnail({
        info: obj.info,
        width: cardW,
        height: cardH,
        onClick: () => this.state.removeCard(false, idx),
        onHover: (info) => this.state.selectCard(info),
      });
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      thumb.x = col * (cardW + CARD_GAP);
      thumb.y = row * (cardH + CARD_GAP);
      this.mainZoneContainer.addChild(thumb);
    });

    const mainRows = Math.ceil(this.state.mainDeckObjs.length / COLS) || 1;
    const mainZoneHeight = mainRows * (cardH + CARD_GAP);

    const lrigY = 24 + mainZoneHeight + 12;
    this.lrigZoneTitle.x = ZONE_PAD;
    this.lrigZoneTitle.y = lrigY;
    this.lrigZoneValidIcon.x = ZONE_PAD + 80;
    this.lrigZoneValidIcon.y = lrigY;

    this.lrigZoneContainer.x = ZONE_PAD;
    this.lrigZoneContainer.y = lrigY + 20;

    this.state.lrigDeckObjs.forEach((obj, idx) => {
      const thumb = new CardThumbnail({
        info: obj.info,
        width: cardW,
        height: cardH,
        onClick: () => this.state.removeCard(true, idx),
        onHover: (info) => this.state.selectCard(info),
      });
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      thumb.x = col * (cardW + CARD_GAP);
      thumb.y = row * (cardH + CARD_GAP);
      this.lrigZoneContainer.addChild(thumb);
    });

    const lrigRows = Math.ceil(this.state.lrigDeckObjs.length / COLS) || 1;
    const lrigZoneHeight = lrigRows * (cardH + CARD_GAP);

    this.mayusRoomText.x = ZONE_PAD;
    this.mayusRoomText.y = lrigY + 20 + lrigZoneHeight + 8;

    const totalHeight = this.mayusRoomText.y + 24;
    this.scrollContainer.setContentHeight(totalHeight);

    this.updateValidation();
  }

  private updateValidation(): void {
    const mainValid = this.state.mainDeckValid;
    this.mainZoneValidIcon.text = mainValid ? '✓' : '✗';
    (this.mainZoneValidIcon.style as TextStyle).fill = mainValid ? 0x22c55e : 0xef4444;

    this.mainZoneBurstText.text = `Burst: ${this.state.burstCount}/20`;

    const lrigValid = this.state.lrigDeckValid;
    this.lrigZoneValidIcon.text = lrigValid ? '✓' : '✗';
    (this.lrigZoneValidIcon.style as TextStyle).fill = lrigValid ? 0x22c55e : 0xef4444;

    const mayusValid = this.state.mayusRoomValid;
    this.mayusRoomText.text = `Mayu's Room: ${mayusValid ? '✓' : '✗'}`;
    (this.mayusRoomText.style as TextStyle).fill = mayusValid ? 0x22c55e : 0xef4444;

    this.mainZoneTitle.text = `Main Deck (${this.state.mainDeckObjs.length}/40)`;
    this.lrigZoneTitle.text = `LRIG Deck (${this.state.lrigDeckObjs.length}/10)`;
  }

  private getCardWidth(): number {
    const availableWidth = this._panelWidth - ZONE_PAD * 2;
    return Math.floor((availableWidth - CARD_GAP * (COLS - 1)) / COLS);
  }

  private createNewDeck(): void {
    const name = this.deckNameInput.value.trim();
    if (!name) {
      this.deckNameInput.focus();
      return;
    }
    this.state.createDeck(name, { mainDeck: [], lrigDeck: [] });
    this.deckNameInput.value = '';
  }

  private copyCurrentDeck(): void {
    const name = this.deckNameInput.value.trim();
    if (!name) {
      this.deckNameInput.focus();
      return;
    }
    this.state.copyDeck(name);
    this.deckNameInput.value = '';
  }

  private deleteCurrentDeck(): void {
    if (confirm(`Delete deck "${this.state.deckName}"?`)) {
      this.state.deleteDeck(this.state.deckName);
    }
  }

  private renameDeck(): void {
    const newName = prompt('Deck name:', this.state.deckName);
    if (newName) {
      this.state.renameDeck(newName);
    }
  }

  private openImportExport(): void {
    const modal = document.getElementById('import-export-modal');
    modal?.classList.add('active');
  }

  private drawBg(): void {
    this.bg.clear();
    this.bg.rect(0, 0, this._panelWidth, this._panelHeight);
    this.bg.fill(0xffffff);
    this.bg.rect(0, this.toolbarHeight - 1, this._panelWidth, 1);
    this.bg.fill(0xe2e8f0);
  }

  resize(width: number, height: number): void {
    this._panelWidth = width;
    this._panelHeight = height;
    this.drawBg();
    this.scrollContainer.resize(width, height - this.toolbarHeight);
    this.rebuildCards();
  }

  positionHtmlInputs(globalX: number, globalY: number): void {
    this.deckSelect.style.left = `${globalX + 8}px`;
    this.deckSelect.style.top = `${globalY + 8}px`;
    this.deckSelect.style.width = `${Math.min(140, this._panelWidth * 0.3)}px`;
    this.deckSelect.style.display = 'block';

    this.deckNameInput.style.left = `${globalX + 8 + Math.min(140, this._panelWidth * 0.3) + 6}px`;
    this.deckNameInput.style.top = `${globalY + 8}px`;
    this.deckNameInput.style.width = `${Math.min(100, this._panelWidth * 0.2)}px`;
    this.deckNameInput.style.display = 'block';
  }

  hideHtmlInputs(): void {
    this.deckSelect.style.display = 'none';
    this.deckNameInput.style.display = 'none';
  }
}
