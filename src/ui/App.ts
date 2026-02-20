import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { BreakpointType } from '../data/types';
import { DeckEditorState } from './DeckEditorState';
import { SearchPanel } from './panels/SearchPanel';
import { DeckPanel } from './panels/DeckPanel';
import { DetailPanel } from './panels/DetailPanel';

const BREAKPOINT_TABLET = 900;
const BREAKPOINT_MOBILE = 600;
const PANEL_DIVIDER_WIDTH = 1;

export class App {
  private app: Application;
  private state: DeckEditorState;

  private searchPanel: SearchPanel;
  private deckPanel: DeckPanel;
  private detailPanel: DetailPanel;

  private panelContainer: Container;
  private divider1: Graphics;
  private divider2: Graphics;

  private tabBar: Container | null = null;
  private tabButtons: Container[] = [];
  private activeTab: 'search' | 'deck' | 'detail' = 'deck';
  private breakpoint: BreakpointType = 'desktop';

  constructor(app: Application) {
    this.app = app;
    this.state = new DeckEditorState();

    this.panelContainer = new Container();
    this.app.stage.addChild(this.panelContainer);

    const { w, h } = this.getSize();
    const bp = this.getBreakpoint(w);
    this.breakpoint = bp;

    const layout = this.computeLayout(w, h, bp);

    this.detailPanel = new DetailPanel(this.state, layout.detailW, layout.panelH);
    this.searchPanel = new SearchPanel(this.state, layout.searchW, layout.panelH);
    this.deckPanel = new DeckPanel(this.state, layout.deckW, layout.panelH);

    this.divider1 = new Graphics();
    this.divider2 = new Graphics();

    this.panelContainer.addChild(this.detailPanel);
    this.panelContainer.addChild(this.divider1);
    this.panelContainer.addChild(this.deckPanel);
    this.panelContainer.addChild(this.divider2);
    this.panelContainer.addChild(this.searchPanel);

    this.setupImportExport();
    this.layout();

    window.addEventListener('resize', () => this.layout());
  }

  private getSize(): { w: number; h: number } {
    return {
      w: this.app.screen.width,
      h: this.app.screen.height,
    };
  }

  private getBreakpoint(width: number): BreakpointType {
    if (width < BREAKPOINT_MOBILE) return 'mobile';
    if (width < BREAKPOINT_TABLET) return 'tablet';
    return 'desktop';
  }

  private computeLayout(w: number, h: number, bp: BreakpointType) {
    const TAB_BAR_H = 48;

    if (bp === 'desktop') {
      const detailW = Math.max(200, Math.floor(w * 0.22));
      const searchW = Math.max(220, Math.floor(w * 0.28));
      const deckW = w - detailW - searchW - PANEL_DIVIDER_WIDTH * 2;
      return { detailW, deckW, searchW, panelH: h };
    }

    if (bp === 'tablet') {
      const deckW = Math.floor(w * 0.55);
      const searchW = w - deckW - PANEL_DIVIDER_WIDTH;
      return { detailW: 0, deckW, searchW, panelH: h };
    }

    return { detailW: w, deckW: w, searchW: w, panelH: h - TAB_BAR_H };
  }

  private layout(): void {
    const { w, h } = this.getSize();
    const bp = this.getBreakpoint(w);
    const layout = this.computeLayout(w, h, bp);
    const prevBreakpoint = this.breakpoint;
    this.breakpoint = bp;

    if (bp === 'desktop') {
      this.removeTabBar();

      this.detailPanel.visible = true;
      this.searchPanel.visible = true;
      this.deckPanel.visible = true;
      this.divider1.visible = true;
      this.divider2.visible = true;

      this.detailPanel.x = 0;
      this.detailPanel.resize(layout.detailW, layout.panelH);

      this.divider1.clear();
      this.divider1.rect(0, 0, PANEL_DIVIDER_WIDTH, layout.panelH);
      this.divider1.fill(0xe2e8f0);
      this.divider1.x = layout.detailW;

      this.deckPanel.x = layout.detailW + PANEL_DIVIDER_WIDTH;
      this.deckPanel.resize(layout.deckW, layout.panelH);

      this.divider2.clear();
      this.divider2.rect(0, 0, PANEL_DIVIDER_WIDTH, layout.panelH);
      this.divider2.fill(0xe2e8f0);
      this.divider2.x = layout.detailW + PANEL_DIVIDER_WIDTH + layout.deckW;

      this.searchPanel.x = layout.detailW + PANEL_DIVIDER_WIDTH * 2 + layout.deckW;
      this.searchPanel.resize(layout.searchW, layout.panelH);

      this.detailPanel.resize(layout.detailW, layout.panelH);
      this.deckPanel.positionHtmlInputs(this.deckPanel.x, 0);
      this.searchPanel.positionHtmlInputs(this.searchPanel.x, 0);

    } else if (bp === 'tablet') {
      this.removeTabBar();

      this.detailPanel.visible = false;
      this.searchPanel.visible = true;
      this.deckPanel.visible = true;
      this.divider1.visible = false;
      this.divider2.visible = true;

      this.deckPanel.x = 0;
      this.deckPanel.resize(layout.deckW, layout.panelH);

      this.divider2.clear();
      this.divider2.rect(0, 0, PANEL_DIVIDER_WIDTH, layout.panelH);
      this.divider2.fill(0xe2e8f0);
      this.divider2.x = layout.deckW;

      this.searchPanel.x = layout.deckW + PANEL_DIVIDER_WIDTH;
      this.searchPanel.resize(layout.searchW, layout.panelH);

      this.deckPanel.positionHtmlInputs(this.deckPanel.x, 0);
      this.searchPanel.positionHtmlInputs(this.searchPanel.x, 0);

    } else {
      this.ensureTabBar(w, h);
      this.divider1.visible = false;
      this.divider2.visible = false;

      const panelH = layout.panelH;
      this.searchPanel.resize(w, panelH);
      this.deckPanel.resize(w, panelH);
      this.detailPanel.resize(w, panelH);

      this.searchPanel.x = 0;
      this.deckPanel.x = 0;
      this.detailPanel.x = 0;

      this.switchTab(this.activeTab);
    }
  }

  private ensureTabBar(w: number, h: number): void {
    if (this.tabBar) {
      this.positionTabBar(w, h);
      return;
    }

    this.tabBar = new Container();
    this.app.stage.addChild(this.tabBar);

    const tabs: { label: string; key: 'search' | 'deck' | 'detail' }[] = [
      { label: 'Search', key: 'search' },
      { label: 'Deck', key: 'deck' },
      { label: 'Detail', key: 'detail' },
    ];

    const tabW = Math.floor(w / tabs.length);
    tabs.forEach((tab, i) => {
      const btn = new Container();
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bg = new Graphics();
      bg.rect(0, 0, tabW, 48);
      bg.fill(0xffffff);
      btn.addChild(bg);

      const label = new Text({
        text: tab.label,
        style: new TextStyle({
          fontSize: 13,
          fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
          fill: tab.key === this.activeTab ? 0x6366f1 : 0x94a3b8,
          fontWeight: tab.key === this.activeTab ? '600' : '400',
        }),
      });
      label.anchor.set(0.5);
      label.x = tabW / 2;
      label.y = 24;
      btn.addChild(label);

      if (tab.key === this.activeTab) {
        const indicator = new Graphics();
        indicator.rect(0, 0, tabW, 3);
        indicator.fill(0x6366f1);
        btn.addChild(indicator);
      }

      btn.x = i * tabW;
      btn.on('pointerdown', () => this.switchTab(tab.key));

      this.tabBar!.addChild(btn);
      this.tabButtons.push(btn);
    });

    this.positionTabBar(w, h);
  }

  private positionTabBar(w: number, h: number): void {
    if (!this.tabBar) return;
    this.tabBar.y = h - 48;
    const topBorder = new Graphics();
    topBorder.rect(0, -1, w, 1);
    topBorder.fill(0xe2e8f0);
    this.tabBar.addChildAt(topBorder, 0);
  }

  private removeTabBar(): void {
    if (this.tabBar) {
      this.app.stage.removeChild(this.tabBar);
      this.tabBar.destroy({ children: true });
      this.tabBar = null;
      this.tabButtons = [];
    }
  }

  private switchTab(tab: 'search' | 'deck' | 'detail'): void {
    this.activeTab = tab;

    this.searchPanel.visible = tab === 'search';
    this.deckPanel.visible = tab === 'deck';
    this.detailPanel.visible = tab === 'detail';

    if (tab === 'search') {
      this.searchPanel.positionHtmlInputs(0, 0);
      this.deckPanel.hideHtmlInputs();
    } else if (tab === 'deck') {
      this.deckPanel.positionHtmlInputs(0, 0);
      this.searchPanel.hideHtmlInputs();
    } else {
      this.searchPanel.hideHtmlInputs();
      this.deckPanel.hideHtmlInputs();
    }

    if (this.tabBar) {
      this.tabBar.destroy({ children: true });
      this.tabBar = null;
      this.tabButtons = [];
      const { w, h } = this.getSize();
      this.ensureTabBar(w, h);
    }
  }

  private setupImportExport(): void {
    const modal = document.getElementById('import-export-modal')!;
    const textarea = document.getElementById('import-export-textarea') as HTMLTextAreaElement;
    const btnClose = document.getElementById('btn-close-modal')!;
    const btnExportFile = document.getElementById('btn-export-file')!;
    const btnImportFile = document.getElementById('btn-import-file')!;
    const btnExportCode = document.getElementById('btn-export-code')!;
    const btnImportCode = document.getElementById('btn-import-code')!;
    const btnShowText = document.getElementById('btn-show-text')!;
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;

    btnClose.addEventListener('click', () => modal.classList.remove('active'));

    btnExportFile.addEventListener('click', () => {
      const json = this.state.exportToJson();
      const filename = this.state.deckName + '.webxoss';
      const blob = new Blob([json], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });

    btnImportFile.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const name = file.name.replace(/\.webxoss$/, '');
      if (this.state.deckNames.includes(name)) {
        alert(`Deck name "${name}" already exists.`);
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const deck = this.state.importFromJson(reader.result as string);
        fileInput.value = '';
        if (!deck) {
          alert('Failed to parse file.');
          return;
        }
        this.state.createDeck(name, deck);
        modal.classList.remove('active');
      };
      reader.readAsText(file);
    });

    btnExportCode.addEventListener('click', () => {
      textarea.value = this.state.exportToJson();
      textarea.select();
    });

    btnShowText.addEventListener('click', () => {
      textarea.value = this.state.deckToText();
      textarea.select();
    });

    btnImportCode.addEventListener('click', () => {
      const deck = this.state.importFromJson(textarea.value);
      if (!deck) {
        alert('Failed to parse code.');
        return;
      }
      const name = prompt('Deck name:');
      if (!name) return;
      if (this.state.deckNames.includes(name)) {
        alert(`Deck name "${name}" already exists.`);
        return;
      }
      this.state.createDeck(name, deck);
      modal.classList.remove('active');
    });
  }
}
