export const zipWith = <A, B, C>(
  f: (a: A, b: B) => C,
  xs: A[],
  ys: B[]
): C[] => {
  const len = Math.min(xs.length, ys.length);

  return new Array(len).fill(undefined).map((_, i) => f(xs[i], ys[i]));
};
