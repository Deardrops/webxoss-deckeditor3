import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CardInfo } from '../../data/types';
import { WIXOSS_COLORS, CARD_TYPE_COLORS } from '../../data/types';
import { CardThumbnail } from '../components/CardThumbnail';
import { FilterChip } from '../components/FilterChip';
import { ScrollContainer } from '../components/ScrollContainer';
import { eventBus } from '../EventBus';
import { DeckEditorState, STATE_EVENTS } from '../DeckEditorState';

const RESULTS_PER_PAGE = 20;

const COLOR_FILTERS = [
  { label: 'White', color: 0xbdb5a8, filterValue: 'white' },
  { label: 'Black', color: 0x3d3d3d, filterValue: 'black' },
  { label: 'Red', color: 0xe74c3c, filterValue: 'red' },
  { label: 'Blue', color: 0x3498db, filterValue: 'blue' },
  { label: 'Green', color: 0x27ae60, filterValue: 'green' },
];

const TYPE_FILTERS = [
  { label: 'LRIG', color: 0x8b5cf6, filterValue: 'LRIG' },
  { label: 'SIGNI', color: 0x3b82f6, filterValue: 'SIGNI' },
  { label: 'SPELL', color: 0xf59e0b, filterValue: 'SPELL' },
  { label: 'ARTS', color: 0xef4444, filterValue: 'ARTS' },
  { label: 'RESONA', color: 0x10b981, filterValue: 'RESONA' },
];

export class SearchPanel extends Container {
  private bg: Graphics;
  private scrollContainer: ScrollContainer;
  private cardGrid: Container;
  private colorChips: FilterChip[] = [];
  private typeChips: FilterChip[] = [];
  private showMoreBtn: Container | null = null;

  private state: DeckEditorState;
  private searchInput: HTMLInputElement;

  private filteredResults: CardInfo[] = [];
  private shownCount = 0;
  private _panelWidth = 300;
  private _panelHeight = 600;

  private activeColorFilters = new Set<string>();
  private activeTypeFilters = new Set<string>();

  constructor(state: DeckEditorState, width: number, height: number) {
    super();
    this.state = state;
    this._panelWidth = width;
    this._panelHeight = height;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.searchInput = document.getElementById('search-input-overlay') as HTMLInputElement;
    this.searchInput.style.display = 'block';
    this.searchInput.addEventListener('input', () => this.onSearch());

    const chipStartY = 8;
    const colorChipContainer = new Container();
    colorChipContainer.y = chipStartY;
    this.addChild(colorChipContainer);

    let chipX = 12;
    for (const cf of COLOR_FILTERS) {
      const chip = new FilterChip({
        label: cf.label,
        color: cf.color,
        onToggle: (active) => {
          if (active) this.activeColorFilters.add(cf.filterValue);
          else this.activeColorFilters.delete(cf.filterValue);
          this.applyFilters();
        },
      });
      chip.x = chipX;
      chipX += chip.getWidth() + 6;
      colorChipContainer.addChild(chip);
      this.colorChips.push(chip);
    }

    const typeChipContainer = new Container();
    typeChipContainer.y = chipStartY + 30;
    this.addChild(typeChipContainer);

    chipX = 12;
    for (const tf of TYPE_FILTERS) {
      const chip = new FilterChip({
        label: tf.label,
        color: tf.color,
        onToggle: (active) => {
          if (active) this.activeTypeFilters.add(tf.filterValue);
          else this.activeTypeFilters.delete(tf.filterValue);
          this.applyFilters();
        },
      });
      chip.x = chipX;
      chipX += chip.getWidth() + 6;
      typeChipContainer.addChild(chip);
      this.typeChips.push(chip);
    }

    const scrollTop = chipStartY + 66;
    this.scrollContainer = new ScrollContainer(
      width - 4,
      height - scrollTop,
    );
    this.scrollContainer.x = 2;
    this.scrollContainer.y = scrollTop;
    this.addChild(this.scrollContainer);

    this.cardGrid = new Container();
    this.scrollContainer.content.addChild(this.cardGrid);

    this.drawBg();

    eventBus.on(STATE_EVENTS.SEARCH_RESULTS, () => this.applyFilters());

    this.state.search('');
  }

  private onSearch(): void {
    const query = this.searchInput.value.trim();
    this.state.search(query);
  }

  private applyFilters(): void {
    let results = this.state.searchResults;

    if (this.activeColorFilters.size > 0) {
      results = results.filter(info => {
        const colors = info.color.split('/');
        return colors.some(c => this.activeColorFilters.has(c));
      });
    }

    if (this.activeTypeFilters.size > 0) {
      results = results.filter(info => this.activeTypeFilters.has(info.cardType));
    }

    this.filteredResults = results;
    this.shownCount = 0;
    this.cardGrid.removeChildren();
    this.showMoreBtn = null;
    this.scrollContainer.scrollToTop();
    this.showMore();
  }

  private showMore(): void {
    if (this.showMoreBtn) {
      this.cardGrid.removeChild(this.showMoreBtn);
      this.showMoreBtn = null;
    }

    const cols = this.getColumnCount();
    const cardW = this.getCardWidth(cols);
    const cardH = Math.round(cardW * 1.4);
    const gap = 4;
    const padX = 8;

    const startIdx = this.shownCount;
    const endIdx = Math.min(startIdx + RESULTS_PER_PAGE, this.filteredResults.length);

    for (let i = startIdx; i < endIdx; i++) {
      const info = this.filteredResults[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const thumb = new CardThumbnail({
        info,
        width: cardW,
        height: cardH,
        onClick: (cardInfo) => this.state.addCard(cardInfo),
        onHover: (cardInfo) => this.state.selectCard(cardInfo),
      });
      thumb.x = padX + col * (cardW + gap);
      thumb.y = row * (cardH + gap);
      this.cardGrid.addChild(thumb);
    }

    this.shownCount = endIdx;

    if (this.shownCount < this.filteredResults.length) {
      this.showMoreBtn = this.createShowMoreButton(cols, cardW, cardH, gap, padX);
      this.cardGrid.addChild(this.showMoreBtn);
    }

    this.updateContentHeight(cols, cardW, cardH, gap);
  }

  private createShowMoreButton(cols: number, cardW: number, cardH: number, gap: number, padX: number): Container {
    const row = Math.floor(this.shownCount / cols);
    const btnContainer = new Container();
    const btnWidth = this._panelWidth - padX * 2 - 16;
    const btnHeight = 32;

    const btnBg = new Graphics();
    btnBg.roundRect(0, 0, btnWidth, btnHeight, 6);
    btnBg.fill(0xf1f5f9);
    btnBg.roundRect(0, 0, btnWidth, btnHeight, 6);
    btnBg.stroke({ width: 1, color: 0xe2e8f0 });
    btnContainer.addChild(btnBg);

    const remaining = this.filteredResults.length - this.shownCount;
    const btnText = new Text({
      text: `Show more (${remaining})`,
      style: new TextStyle({
        fontSize: 12,
        fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
        fill: 0x6366f1,
        fontWeight: '500',
      }),
    });
    btnText.anchor.set(0.5);
    btnText.x = btnWidth / 2;
    btnText.y = btnHeight / 2;
    btnContainer.addChild(btnText);

    btnContainer.x = padX;
    btnContainer.y = row * (cardH + gap) + 4;
    btnContainer.eventMode = 'static';
    btnContainer.cursor = 'pointer';
    btnContainer.on('pointerdown', () => this.showMore());

    const hoverOverlay = new Graphics();
    hoverOverlay.roundRect(0, 0, btnWidth, btnHeight, 6);
    hoverOverlay.fill({ color: 0x6366f1, alpha: 0.08 });
    hoverOverlay.visible = false;
    btnContainer.addChild(hoverOverlay);
    btnContainer.on('pointerover', () => { hoverOverlay.visible = true; });
    btnContainer.on('pointerout', () => { hoverOverlay.visible = false; });

    return btnContainer;
  }

  private getColumnCount(): number {
    if (this._panelWidth < 200) return 3;
    if (this._panelWidth < 350) return 4;
    if (this._panelWidth < 500) return 5;
    return 6;
  }

  private getCardWidth(cols: number): number {
    const padX = 8;
    const gap = 4;
    return Math.floor((this._panelWidth - padX * 2 - 16 - gap * (cols - 1)) / cols);
  }

  private updateContentHeight(cols: number, cardW: number, cardH: number, gap: number): void {
    const totalRows = Math.ceil(this.shownCount / cols);
    let h = totalRows * (cardH + gap);
    if (this.showMoreBtn) h += 40;
    this.scrollContainer.setContentHeight(h);
  }

  private drawBg(): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this._panelWidth, this._panelHeight, 0);
    this.bg.fill(0xffffff);
  }

  resize(width: number, height: number): void {
    this._panelWidth = width;
    this._panelHeight = height;
    this.drawBg();

    const scrollTop = 74;
    this.scrollContainer.resize(width - 4, height - scrollTop);

    this.applyFilters();
  }

  positionHtmlInputs(globalX: number, globalY: number): void {
    const inputWidth = this._panelWidth - 24;
    this.searchInput.style.left = `${globalX + 12}px`;
    this.searchInput.style.top = `${globalY + this._panelHeight - 40}px`;
    this.searchInput.style.width = `${inputWidth}px`;
    this.searchInput.style.display = 'block';
  }

  hideHtmlInputs(): void {
    this.searchInput.style.display = 'none';
  }
}
