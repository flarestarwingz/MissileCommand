/**
 * Collision detection utilities
 */

import { Vector2, Circle, Rectangle, distance, clamp } from './math';

export interface CollisionResult {
  isColliding: boolean;
  overlapDistance?: number;
  normal?: Vector2;
}

/**
 * Check if two circles are colliding
 */
export function checkCircleCollision(c1: Circle, c2: Circle): CollisionResult {
  const d = distance({ x: c1.x, y: c1.y }, { x: c2.x, y: c2.y });
  const minDist = c1.radius + c2.radius;
  
  if (d < minDist) {
    return {
      isColliding: true,
      overlapDistance: minDist - d,
      normal: {
        x: (c2.x - c1.x) / d,
        y: (c2.y - c1.y) / d,
      },
    };
  }
  
  return { isColliding: false };
}

/**
 * Check if a point is within a circle
 */
export function checkPointInCircle(point: Vector2, circle: Circle): boolean {
  return distance(point, { x: circle.x, y: circle.y }) <= circle.radius;
}

/**
 * Check if a point is within a rectangle
 */
export function checkPointInRect(point: Vector2, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if a circle collides with a rectangle
 */
export function checkCircleRectCollision(
  circle: Circle,
  rect: Rectangle
): CollisionResult {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  
  const d = distance({ x: circle.x, y: circle.y }, { x: closestX, y: closestY });
  
  if (d < circle.radius) {
    return {
      isColliding: true,
      overlapDistance: circle.radius - d,
      normal: {
        x: (circle.x - closestX) / d || 0,
        y: (circle.y - closestY) / d || 0,
      },
    };
  }
  
  return { isColliding: false };
}

/**
 * Get the closest point on a line segment to a point
 */
export function getClosestPointOnLineSegment(
  point: Vector2,
  lineStart: Vector2,
  lineEnd: Vector2
): Vector2 {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)));
  
  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * Check if a circle collides with a line segment
 */
export function checkCircleLineCollision(
  circle: Circle,
  lineStart: Vector2,
  lineEnd: Vector2
): CollisionResult {
  const closest = getClosestPointOnLineSegment({ x: circle.x, y: circle.y }, lineStart, lineEnd);
  const d = distance({ x: circle.x, y: circle.y }, closest);
  
  if (d < circle.radius) {
    return {
      isColliding: true,
      overlapDistance: circle.radius - d,
      normal: {
        x: (circle.x - closest.x) / d || 0,
        y: (circle.y - closest.y) / d || 0,
      },
    };
  }
  
  return { isColliding: false };
}

/**
 * Get intersection point of two lines (if they exist)
 */
export function getLineIntersection(
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  p4: Vector2
): Vector2 | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (Math.abs(denom) < 1e-10) {
    return null; // Lines are parallel
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

/**
 * Spatial hash grid for efficient collision detection
 */
export class SpatialGrid {
  private grid: Map<string, number[]> = new Map();
  private cellSize: number;
  private bounds: Rectangle;

  constructor(bounds: Rectangle, cellSize: number = 50) {
    this.bounds = bounds;
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor((x - this.bounds.x) / this.cellSize);
    const cellY = Math.floor((y - this.bounds.y) / this.cellSize);
    return `${cellX},${cellY}`;
  }

  insert(id: number, x: number, y: number): void {
    const key = this.getKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(id);
  }

  retrieve(x: number, y: number, radius: number = 0): number[] {
    const result: Set<number> = new Set();
    
    const minX = x - radius;
    const maxX = x + radius;
    const minY = y - radius;
    const maxY = y + radius;
    
    const minCellX = Math.floor((minX - this.bounds.x) / this.cellSize);
    const maxCellX = Math.floor((maxX - this.bounds.x) / this.cellSize);
    const minCellY = Math.floor((minY - this.bounds.y) / this.cellSize);
    const maxCellY = Math.floor((maxY - this.bounds.y) / this.cellSize);
    
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const ids = this.grid.get(key);
        if (ids) {
          ids.forEach(id => result.add(id));
        }
      }
    }
    
    return Array.from(result);
  }

  clear(): void {
    this.grid.clear();
  }
}
