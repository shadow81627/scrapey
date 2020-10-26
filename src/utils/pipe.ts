interface FromatFunction {
  (source: string): string
}

const pipe = (...fns: Array<FromatFunction>) => (x: string): string =>
  fns.reduce((v, f) => f(v), x);

export default pipe;
