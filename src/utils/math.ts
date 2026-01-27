/**
 * Math utilities for vector operations and game calculations
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Create a new vector
 */
export function vec2(x: number = 0, y: number = 0): Vector2 {
  return { x, y };
}

/**
 * Add two vectors
 */
export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract two vectors
 */
export function subtractVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Scale a vector
 */
export function scaleVector(v: Vector2, scale: number): Vector2 {
  return { x: v.x * scale, y: v.y * scale };
}

/**
 * Get distance between two points
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 */
export function normalizeVector(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Get magnitude of a vector
 */
export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Get angle in radians between two points
 */
export function angleBetweenPoints(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Convert angle and distance to vector
 */
export function polarToCartesian(angle: number, distance: number): Vector2 {
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Lerp between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Get random number between min and max
 */
export function random(min: number = 0, max: number = 1): number {
  return Math.random() * (max - min) + min;
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if a point is within a circle
 */
export function pointInCircle(point: Vector2, circle: Circle): boolean {
  return distance(point, { x: circle.x, y: circle.y }) <= circle.radius;
}

/**
 * Check if a point is within a rectangle
 */
export function pointInRect(point: Vector2, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if two circles collide
 */
export function circleCollision(c1: Circle, c2: Circle): boolean {
  const d = distance({ x: c1.x, y: c1.y }, { x: c2.x, y: c2.y });
  return d < c1.radius + c2.radius;
}

/**
 * Check if a circle collides with a rectangle
 */
export function circleRectCollision(circle: Circle, rect: Rectangle): boolean {
  let closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  let closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  
  const d = distance({ x: circle.x, y: circle.y }, { x: closestX, y: closestY });
  return d < circle.radius;
}

/**
 * Get dot product of two vectors
 */
export function dotProduct(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Rotate a vector by angle (in radians)
 */
export function rotateVector(v: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/**
 * Smooth damping for value interpolation
 */
export function smoothDamp(
  current: number,
  target: number,
  velocity: { value: number },
  smoothTime: number,
  deltaTime: number
): number {
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  
  let change = current - target;
  const originalTo = target;
  const maxChange = smoothTime * 10;
  change = clamp(change, -maxChange, maxChange);
  target = current - change;
  
  const currentVelocity = velocity.value;
  const newVelocity = (currentVelocity + omega * change) * exp;
  velocity.value = newVelocity;
  
  let output = target + (change + currentVelocity) * exp;
  
  if (originalTo - current > 0 === output > originalTo) {
    output = originalTo;
    velocity.value = (output - originalTo) / deltaTime;
  }
  
  return output;
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}
