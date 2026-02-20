import { Container, Graphics } from 'pixi.js';

export class ScrollContainer extends Container {
  readonly content: Container;
  private maskGraphics: Graphics;
  private scrollbarTrack: Graphics;
  private scrollbarThumb: Graphics;
  private _viewWidth: number;
  private _viewHeight: number;
  private _scrollY = 0;
  private _contentHeight = 0;
  private _isDragging = false;
  private _lastPointerY = 0;

  constructor(width: number, height: number) {
    super();
    this._viewWidth = width;
    this._viewHeight = height;

    this.maskGraphics = new Graphics();
    this.maskGraphics.rect(0, 0, width, height);
    this.maskGraphics.fill(0xffffff);
    this.addChild(this.maskGraphics);

    this.content = new Container();
    this.content.mask = this.maskGraphics;
    this.addChild(this.content);

    this.scrollbarTrack = new Graphics();
    this.addChild(this.scrollbarTrack);

    this.scrollbarThumb = new Graphics();
    this.addChild(this.scrollbarThumb);

    this.eventMode = 'static';
    this.on('wheel', this.onWheel.bind(this));
    this.on('pointerdown', this.onPointerDown.bind(this));
    this.on('pointermove', this.onPointerMove.bind(this));
    this.on('pointerup', this.onPointerUp.bind(this));
    this.on('pointerupoutside', this.onPointerUp.bind(this));

    this.drawScrollbar();
  }

  private onWheel(e: WheelEvent): void {
    this._scrollY += e.deltaY;
    this.clampScroll();
    this.applyScroll();
  }

  private onPointerDown(e: { global: { y: number } }): void {
    this._isDragging = true;
    this._lastPointerY = e.global.y;
  }

  private onPointerMove(e: { global: { y: number } }): void {
    if (!this._isDragging) return;
    const dy = this._lastPointerY - e.global.y;
    this._lastPointerY = e.global.y;
    this._scrollY += dy;
    this.clampScroll();
    this.applyScroll();
  }

  private onPointerUp(): void {
    this._isDragging = false;
  }

  private clampScroll(): void {
    const maxScroll = Math.max(0, this._contentHeight - this._viewHeight);
    this._scrollY = Math.max(0, Math.min(this._scrollY, maxScroll));
  }

  private applyScroll(): void {
    this.content.y = -this._scrollY;
    this.drawScrollbar();
  }

  setContentHeight(h: number): void {
    this._contentHeight = h;
    this.clampScroll();
    this.applyScroll();
  }

  resize(width: number, height: number): void {
    this._viewWidth = width;
    this._viewHeight = height;
    this.maskGraphics.clear();
    this.maskGraphics.rect(0, 0, width, height);
    this.maskGraphics.fill(0xffffff);
    this.clampScroll();
    this.applyScroll();
  }

  scrollToTop(): void {
    this._scrollY = 0;
    this.applyScroll();
  }

  private drawScrollbar(): void {
    this.scrollbarTrack.clear();
    this.scrollbarThumb.clear();

    if (this._contentHeight <= this._viewHeight) return;

    const trackX = this._viewWidth - 4;
    this.scrollbarTrack.rect(trackX, 0, 4, this._viewHeight);
    this.scrollbarTrack.fill({ color: 0xe2e8f0, alpha: 0.5 });

    const ratio = this._viewHeight / this._contentHeight;
    const thumbHeight = Math.max(20, this._viewHeight * ratio);
    const maxScroll = this._contentHeight - this._viewHeight;
    const scrollRatio = maxScroll > 0 ? this._scrollY / maxScroll : 0;
    const thumbY = scrollRatio * (this._viewHeight - thumbHeight);

    this.scrollbarThumb.roundRect(trackX, thumbY, 4, thumbHeight, 2);
    this.scrollbarThumb.fill({ color: 0x94a3b8, alpha: 0.7 });
  }

  get scrollY(): number {
    return this._scrollY;
  }

  get viewHeight(): number {
    return this._viewHeight;
  }

  get viewWidth(): number {
    return this._viewWidth;
  }
}
