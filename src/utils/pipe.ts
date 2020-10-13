const pipe = (...fns: Array<Function>) => (x: string) =>
  fns.reduce((v, f) => f(v), x);

export default pipe;
