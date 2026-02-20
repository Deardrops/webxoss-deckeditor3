import { Container, Graphics, Text, TextStyle } from 'pixi.js';

interface FilterChipOptions {
  label: string;
  color: number;
  onToggle?: (active: boolean) => void;
}

export class FilterChip extends Container {
  private bg: Graphics;
  private labelText: Text;
  private _active = false;
  private _color: number;
  private _onToggle?: (active: boolean) => void;

  constructor(options: FilterChipOptions) {
    super();
    this._color = options.color;
    this._onToggle = options.onToggle;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.labelText = new Text({
      text: options.label,
      style: new TextStyle({
        fontSize: 11,
        fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
        fill: 0x64748b,
        fontWeight: '500',
      }),
    });
    this.labelText.anchor.set(0.5);
    this.addChild(this.labelText);

    this.draw();

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => {
      this._active = !this._active;
      this.draw();
      this._onToggle?.(this._active);
    });
  }

  get active(): boolean {
    return this._active;
  }

  set active(val: boolean) {
    this._active = val;
    this.draw();
  }

  private draw(): void {
    const w = this.labelText.width + 20;
    const h = 24;
    this.bg.clear();
    if (this._active) {
      this.bg.roundRect(0, 0, w, h, 12);
      this.bg.fill(this._color);
      this.labelText.style.fill = 0xffffff;
    } else {
      this.bg.roundRect(0, 0, w, h, 12);
      this.bg.fill(0xf1f5f9);
      this.bg.roundRect(0, 0, w, h, 12);
      this.bg.stroke({ width: 1, color: 0xe2e8f0 });
      this.labelText.style.fill = 0x64748b;
    }
    this.labelText.x = w / 2;
    this.labelText.y = h / 2;
  }

  getWidth(): number {
    return this.labelText.width + 20;
  }
}
