import { isPlainObject } from 'is-plain-object';

function defaultSortFn(a: string, b: string) {
  return a.localeCompare(b);
}

function deepSort(src: any, comparator = defaultSortFn): any {
  let out: { [x: string]: any };

  if (Array.isArray(src)) {
    return src.map(function (item) {
      return deepSort(item, comparator);
    });
  }

  if (isPlainObject(src)) {
    out = {};

    Object.keys(src)
      .sort(comparator)
      .forEach(function (key) {
        out[key] = deepSort(src[key], comparator);
      });

    return out;
  }

  return src;
}

export default deepSort;
