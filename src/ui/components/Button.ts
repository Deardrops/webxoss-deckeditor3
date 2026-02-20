import { Container, Graphics, Text, TextStyle } from 'pixi.js';

interface ButtonOptions {
  label: string;
  width: number;
  height: number;
  bgColor?: number;
  hoverColor?: number;
  textColor?: number;
  fontSize?: number;
  borderRadius?: number;
  onClick?: () => void;
}

export class Button extends Container {
  private bg: Graphics;
  private labelText: Text;
  private _bgColor: number;
  private _hoverColor: number;
  private _width: number;
  private _height: number;
  private _borderRadius: number;

  constructor(options: ButtonOptions) {
    super();
    this._bgColor = options.bgColor ?? 0x6366f1;
    this._hoverColor = options.hoverColor ?? 0x4f46e5;
    this._width = options.width;
    this._height = options.height;
    this._borderRadius = options.borderRadius ?? 8;

    this.bg = new Graphics();
    this.drawBg(this._bgColor);
    this.addChild(this.bg);

    this.labelText = new Text({
      text: options.label,
      style: new TextStyle({
        fontSize: options.fontSize ?? 13,
        fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
        fill: options.textColor ?? 0xffffff,
        fontWeight: '500',
      }),
    });
    this.labelText.anchor.set(0.5);
    this.labelText.x = this._width / 2;
    this.labelText.y = this._height / 2;
    this.addChild(this.labelText);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      this.drawBg(this._hoverColor);
    });
    this.on('pointerout', () => {
      this.drawBg(this._bgColor);
    });
    if (options.onClick) {
      this.on('pointerdown', options.onClick);
    }
  }

  private drawBg(color: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this._width, this._height, this._borderRadius);
    this.bg.fill(color);
  }

  setLabel(text: string): void {
    this.labelText.text = text;
  }
}
