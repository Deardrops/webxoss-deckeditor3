import { Container, Sprite, Graphics, Assets, Texture } from 'pixi.js';
import type { CardInfo } from '../../data/types';
import { CARD_COLOR_MAP } from '../../data/types';
import { getCardImageUrl } from '../../data/CardDatabase';

interface CardThumbnailOptions {
  info: CardInfo;
  width: number;
  height: number;
  baseDir?: string;
  onClick?: (info: CardInfo) => void;
  onHover?: (info: CardInfo) => void;
}

const textureCache = new Map<string, Texture>();
const loadingSet = new Set<string>();

export class CardThumbnail extends Container {
  private bg: Graphics;
  private cardSprite: Sprite | null = null;
  private colorBar: Graphics;
  private hoverOverlay: Graphics;
  readonly info: CardInfo;
  private _thumbWidth: number;
  private _thumbHeight: number;

  constructor(options: CardThumbnailOptions) {
    super();
    this.info = options.info;
    this._thumbWidth = options.width;
    this._thumbHeight = options.height;

    this.bg = new Graphics();
    this.bg.roundRect(0, 0, this._thumbWidth, this._thumbHeight, 2);
    this.bg.fill(0xf1f5f9);
    this.addChild(this.bg);

    this.colorBar = new Graphics();
    const barColor = CARD_COLOR_MAP[options.info.color] ?? '#f1f5f9';
    this.colorBar.rect(0, this._thumbHeight - 3, this._thumbWidth, 3);
    this.colorBar.fill(barColor);
    this.addChild(this.colorBar);

    this.hoverOverlay = new Graphics();
    this.hoverOverlay.roundRect(0, 0, this._thumbWidth, this._thumbHeight, 2);
    this.hoverOverlay.fill({ color: 0x6366f1, alpha: 0.15 });
    this.hoverOverlay.visible = false;
    this.addChild(this.hoverOverlay);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      this.hoverOverlay.visible = true;
      options.onHover?.(this.info);
    });
    this.on('pointerout', () => {
      this.hoverOverlay.visible = false;
    });
    this.on('pointermove', () => {
      options.onHover?.(this.info);
    });
    if (options.onClick) {
      this.on('pointerdown', () => options.onClick!(this.info));
    }

    this.loadImage(options.baseDir ?? '../');
  }

  private async loadImage(baseDir: string): Promise<void> {
    const wxid = this.info.wxid;

    if (textureCache.has(wxid)) {
      this.setTexture(textureCache.get(wxid)!);
      return;
    }

    if (loadingSet.has(wxid)) {
      const checkInterval = setInterval(() => {
        if (textureCache.has(wxid)) {
          clearInterval(checkInterval);
          if (!this.destroyed) {
            this.setTexture(textureCache.get(wxid)!);
          }
        }
      }, 100);
      return;
    }

    loadingSet.add(wxid);
    const url = getCardImageUrl(wxid, baseDir);
    try {
      const texture = await Assets.load<Texture>(url);
      textureCache.set(wxid, texture);
      if (!this.destroyed) {
        this.setTexture(texture);
      }
    } catch {
      loadingSet.delete(wxid);
    }
  }

  private setTexture(texture: Texture): void {
    if (this.cardSprite) {
      this.removeChild(this.cardSprite);
      this.cardSprite.destroy();
    }
    this.cardSprite = new Sprite(texture);
    this.cardSprite.width = this._thumbWidth;
    this.cardSprite.height = this._thumbHeight;
    this.addChildAt(this.cardSprite, 1);
  }

  updateSize(w: number, h: number): void {
    this._thumbWidth = w;
    this._thumbHeight = h;
    this.bg.clear();
    this.bg.roundRect(0, 0, w, h, 2);
    this.bg.fill(0xf1f5f9);

    this.colorBar.clear();
    const barColor = CARD_COLOR_MAP[this.info.color] ?? '#f1f5f9';
    this.colorBar.rect(0, h - 3, w, 3);
    this.colorBar.fill(barColor);

    this.hoverOverlay.clear();
    this.hoverOverlay.roundRect(0, 0, w, h, 2);
    this.hoverOverlay.fill({ color: 0x6366f1, alpha: 0.15 });

    if (this.cardSprite) {
      this.cardSprite.width = w;
      this.cardSprite.height = h;
    }
  }
}
