/**
 * Input handling for mouse control
 */

import { Vector2 } from '../utils/math';

export class InputHandler {
  private mousePosition: Vector2 = { x: 0, y: 0 };
  private isMousePressed: boolean = false;
  private canvas: HTMLCanvasElement;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      this.emit('mousemove', this.mousePosition);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isMousePressed = true;
      const rect = this.canvas.getBoundingClientRect();
      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      this.emit('mousedown', pos);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.isMousePressed = false;
      const rect = this.canvas.getBoundingClientRect();
      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      this.emit('mouseup', pos);
    });

    this.canvas.addEventListener('mouseleave', (e) => {
      this.isMousePressed = false;
      this.emit('mouseleave', this.mousePosition);
    });

    window.addEventListener('keydown', (e) => {
      this.emit('keydown', { key: e.key, code: e.code });
    });
  }

  /**
   * Get mouse position
   */
  getMousePosition(): Vector2 {
    return { ...this.mousePosition };
  }

  /**
   * Is mouse pressed?
   */
  isPressed(): boolean {
    return this.isMousePressed;
  }

  /**
   * Subscribe to input events
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}
