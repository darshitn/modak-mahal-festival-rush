declare module 'phaser/src/geom/rectangle/Contains.js' {
  export default function contains(
    rectangle: { x: number; y: number; width: number; height: number },
    x: number,
    y: number,
  ): boolean;
}
