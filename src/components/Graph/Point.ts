export class Point {
  private x: number;
  private y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static Zero() {
    return new Point(0, 0);
  }

  public add(other: Point) {
    return new Point(this.x + other.x, this.y + other.y);
  }

  public inv() {
    return new Point(-this.x, -this.y);
  }

  public sub(other: Point) {
    return this.add(other.inv());
  }

  public scale(scalar: number) {
    return new Point(this.x * scalar, this.y * scalar);
  }

  public mag() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  public normalise() {
    if (this.isZero()) {
      return Point.Zero();
    }

    return new Point(this.x, this.y).scale(1 / this.mag());
  }

  public getX() {
    return this.x;
  }

  public getY() {
    return this.y;
  }

  public isZero() {
    const epsilon = 1e-9;
    return Math.abs(this.x) < epsilon && Math.abs(this.y) < epsilon;
  }
}
