import { Container, Graphics, Text, TextStyle, Sprite, Assets, Texture } from 'pixi.js';
import type { CardInfo } from '../../data/types';
import { WIXOSS_COLORS } from '../../data/types';
import { getCardImageUrl, getCardName } from '../../data/CardDatabase';
import { eventBus } from '../EventBus';
import { DeckEditorState, STATE_EVENTS } from '../DeckEditorState';

export class DetailPanel extends Container {
  private bg: Graphics;
  private cardSprite: Sprite | null = null;
  private cardBg: Graphics;
  private wxidText: Text;
  private nameText: Text;
  private limitingText: Text;
  private statsContainer: Container;

  private state: DeckEditorState;
  private _panelWidth = 240;
  private _panelHeight = 600;
  private _currentPid = 0;

  constructor(state: DeckEditorState, width: number, height: number) {
    super();
    this.state = state;
    this._panelWidth = width;
    this._panelHeight = height;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.cardBg = new Graphics();
    this.cardBg.y = 8;
    this.cardBg.x = 8;
    this.addChild(this.cardBg);

    const textX = 12;
    const imgHeight = this.getImageHeight();

    this.wxidText = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 11,
        fontFamily: 'Consolas, monospace',
        fill: 0x94a3b8,
      }),
    });
    this.wxidText.x = textX;
    this.wxidText.y = imgHeight + 16;
    this.addChild(this.wxidText);

    this.nameText = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 14,
        fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
        fill: 0x1e293b,
        fontWeight: '600',
        wordWrap: true,
        wordWrapWidth: width - 24,
      }),
    });
    this.nameText.x = textX;
    this.nameText.y = imgHeight + 30;
    this.addChild(this.nameText);

    this.limitingText = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 11,
        fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
        fill: 0x64748b,
      }),
    });
    this.limitingText.x = textX;
    this.limitingText.y = imgHeight + 50;
    this.addChild(this.limitingText);

    this.statsContainer = new Container();
    this.statsContainer.x = textX;
    this.statsContainer.y = imgHeight + 68;
    this.addChild(this.statsContainer);

    this.drawBg();

    eventBus.on(STATE_EVENTS.CARD_SELECTED, (_info: unknown) => {
      this.showCard(_info as CardInfo);
    });
  }

  private getImageHeight(): number {
    const imgWidth = this._panelWidth - 16;
    return Math.round(imgWidth * 1.4);
  }

  async showCard(info: CardInfo): Promise<void> {
    if (!info || info.pid === this._currentPid) return;
    this._currentPid = info.pid;

    const imgWidth = this._panelWidth - 16;
    const imgHeight = this.getImageHeight();

    this.cardBg.clear();
    this.cardBg.roundRect(0, 0, imgWidth, imgHeight, 4);
    this.cardBg.fill(0xf1f5f9);

    const url = getCardImageUrl(info.wxid, '../');
    try {
      const texture = await Assets.load<Texture>(url);
      if (info.pid !== this._currentPid) return;

      if (this.cardSprite) {
        this.removeChild(this.cardSprite);
        this.cardSprite.destroy();
      }
      this.cardSprite = new Sprite(texture);
      this.cardSprite.width = imgWidth;
      this.cardSprite.height = imgHeight;
      this.cardSprite.x = 8;
      this.cardSprite.y = 8;
      this.addChildAt(this.cardSprite, 2);
    } catch {
      // intentionally empty: card placeholder remains visible on load failure
    }

    this.wxidText.text = info.wxid;
    this.wxidText.y = imgHeight + 16;

    const cardName = getCardName(info);
    this.nameText.text = cardName;
    this.nameText.y = imgHeight + 30;
    (this.nameText.style as TextStyle).wordWrapWidth = this._panelWidth - 24;

    if (window.Localize) {
      this.limitingText.text = window.Localize.limiting(info);
    } else {
      this.limitingText.text = info.limiting || '';
    }
    this.limitingText.y = imgHeight + 50;

    this.buildStats(info);
  }

  private buildStats(info: CardInfo): void {
    this.statsContainer.removeChildren();
    this.statsContainer.y = this.getImageHeight() + 68;

    const rows: [string, string][][] = [];
    const L = window.Localize;

    const cardTypeLabel = L ? L.cardType(info) : info.cardType;
    const colorLabel = L ? info.color.split('/').map(c => L.color(c)).join('/') : info.color;

    if (info.cardType === 'LRIG') {
      rows.push([['Type', cardTypeLabel], ['Color', colorLabel]]);
      rows.push([['Level', String(info.level)], ['Class', L ? L.classes(info) : info.classes.join('/')]]);
      const limitStr = info.limit >= 1024 ? '∞' : String(info.limit);
      rows.push([['Limit', limitStr], ['Cost', L ? L.cost(info) : '']]);
    } else if (info.cardType === 'SIGNI') {
      rows.push([['Type', cardTypeLabel], ['Color', colorLabel]]);
      rows.push([['Level', String(info.level)], ['Class', L ? L.classes(info) : info.classes.join('/')]]);
      rows.push([['Power', String(info.power)], ['Guard', L ? L.guard(info) : (info.guardFlag ? 'Yes' : 'No')]]);
    } else if (info.cardType === 'RESONA') {
      rows.push([['Type', cardTypeLabel], ['Color', colorLabel]]);
      rows.push([['Level', String(info.level)], ['Class', L ? L.classes(info) : info.classes.join('/')]]);
      rows.push([['Power', String(info.power)], ['Guard', L ? L.guard(info) : (info.guardFlag ? 'Yes' : 'No')]]);
    } else if (info.cardType === 'SPELL') {
      rows.push([['Type', cardTypeLabel], ['Color', colorLabel]]);
      rows.push([['Cost', L ? L.cost(info) : '']]);
    } else if (info.cardType === 'ARTS') {
      rows.push([['Type', cardTypeLabel], ['Color', colorLabel]]);
      rows.push([['Cost', L ? L.cost(info) : '']]);
      rows.push([['Timing', L ? L.timmings(info) : (info.timmings?.join(', ') ?? '')]]);
    }

    const effectText = L ? L.effectTexts(info) : '';
    if (effectText) {
      rows.push([['Effects', effectText]]);
    }

    if ((info.cardType === 'SIGNI' || info.cardType === 'SPELL') && info.burstEffectTexts?.length) {
      const burstText = L ? L.burstEffectTexts(info) : info.burstEffectTexts.join('\n');
      rows.push([['Burst', burstText]]);
    }

    let yPos = 0;
    const colWidth = (this._panelWidth - 24) / 2;
    const labelStyle = new TextStyle({
      fontSize: 10,
      fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
      fill: 0x94a3b8,
      fontWeight: '500',
    });
    const valueStyle = new TextStyle({
      fontSize: 11,
      fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
      fill: 0x1e293b,
      wordWrap: true,
      wordWrapWidth: this._panelWidth - 24,
    });
    const valueStyleHalf = new TextStyle({
      fontSize: 11,
      fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
      fill: 0x1e293b,
      wordWrap: true,
      wordWrapWidth: colWidth - 4,
    });

    for (const row of rows) {
      if (row.length === 2) {
        for (let col = 0; col < 2; col++) {
          const [label, value] = row[col];
          const lbl = new Text({
            text: label,
            style: labelStyle,
          });
          lbl.x = col * colWidth;
          lbl.y = yPos;
          this.statsContainer.addChild(lbl);

          const val = new Text({
            text: value,
            style: valueStyleHalf,
          });
          val.x = col * colWidth;
          val.y = yPos + 12;
          this.statsContainer.addChild(val);
        }
        yPos += 30;
      } else {
        const [label, value] = row[0];
        const lbl = new Text({
          text: label,
          style: labelStyle,
        });
        lbl.y = yPos;
        this.statsContainer.addChild(lbl);

        const val = new Text({
          text: value,
          style: valueStyle,
        });
        val.y = yPos + 12;
        this.statsContainer.addChild(val);

        yPos += 14 + val.height + 4;
      }
    }
  }

  private drawBg(): void {
    this.bg.clear();
    this.bg.rect(0, 0, this._panelWidth, this._panelHeight);
    this.bg.fill(0xffffff);
  }

  resize(width: number, height: number): void {
    this._panelWidth = width;
    this._panelHeight = height;
    this.drawBg();

    if (this.state.selectedCard) {
      this._currentPid = 0;
      this.showCard(this.state.selectedCard);
    }
  }
}
