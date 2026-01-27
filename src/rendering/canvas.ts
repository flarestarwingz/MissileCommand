/**
 * Canvas renderer - handles all vector drawing
 */

import { ColorPalette, PaletteManager } from './palette';
import { Vector2 } from '../utils/math';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  palette: ColorPalette;
  width: number;
  height: number;
  scale: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private paletteManager: PaletteManager;
  private width: number;
  private height: number;
  private scale: number = 1;

  constructor(
    canvas: HTMLCanvasElement,
    paletteManager: PaletteManager,
    width?: number,
    height?: number
  ) {
    this.canvas = canvas;
    this.paletteManager = paletteManager;
    
    const rect = canvas.getBoundingClientRect();
    this.width = width || rect.width || 800;
    this.height = height || rect.height || 600;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = context;
    
    this.setupContext();
  }

  /**
   * Setup canvas context
   */
  private setupContext(): void {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Get render context
   */
  getRenderContext(): RenderContext {
    return {
      ctx: this.ctx,
      palette: this.paletteManager.getPalette(),
      width: this.width,
      height: this.height,
      scale: this.scale,
    };
  }

  /**
   * Clear canvas
   */
  clear(): void {
    const palette = this.paletteManager.getPalette();
    this.ctx.fillStyle = palette.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw line
   */
  drawLine(from: Vector2, to: Vector2, color: string, width: number = 1): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  /**
   * Draw circle
   */
  drawCircle(
    pos: Vector2,
    radius: number,
    color: string,
    fill: boolean = false,
    width: number = 1
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * Draw rectangle
   */
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    fill: boolean = false,
    lineWidth: number = 1
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * Draw polygon
   */
  drawPolygon(points: Vector2[], color: string, fill: boolean = false, width: number = 1): void {
    if (points.length < 2) return;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.closePath();
    
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * Draw text
   */
  drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize: number = 16,
    align: CanvasTextAlign = 'left'
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
  }

  /**
   * Draw crosshair
   */
  drawCrosshair(pos: Vector2, size: number, color: string, width: number = 1): void {
    const halfSize = size / 2;
    this.drawLine(
      { x: pos.x - halfSize, y: pos.y },
      { x: pos.x + halfSize, y: pos.y },
      color,
      width
    );
    this.drawLine(
      { x: pos.x, y: pos.y - halfSize },
      { x: pos.x, y: pos.y + halfSize },
      color,
      width
    );
  }

  /**
   * Draw grid
   */
  drawGrid(spacing: number, color?: string): void {
    const palette = this.paletteManager.getPalette();
    const gridColor = color || palette.grid || palette.primary;
    
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    
    for (let x = 0; x < this.width; x += spacing) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    
    for (let y = 0; y < this.height; y += spacing) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    
    this.ctx.stroke();
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.setupContext();
  }

  /**
   * Get canvas dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Set rendering scale
   */
  setScale(scale: number): void {
    this.scale = scale;
    this.ctx.scale(scale, scale);
  }
};
