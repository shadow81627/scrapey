import { isPlainObject } from 'is-plain-object';

function defaultSortFn(a: string, b: string) {
  return a.localeCompare(b);
}

function sort(src: any, comparator = defaultSortFn): any {
  var out: { [x: string]: any };

  if (Array.isArray(src)) {
    return src.map(function (item) {
      return sort(item, comparator);
    });
  }

  if (isPlainObject(src)) {
    out = {};

    Object.keys(src)
      .sort(comparator)
      .forEach(function (key) {
        out[key] = sort(src[key], comparator);
      });

    return out;
  }

  return src;
}

export default sort;
