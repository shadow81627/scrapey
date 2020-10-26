function defaultSortFn(a: string, b: string) {
  return a.localeCompare(b);
}

function deepSort(src: unknown, comparator = defaultSortFn): unknown {
  const data = JSON.parse(JSON.stringify(src));

  if (typeof data !== 'object' || !data) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((value) => deepSort(value, comparator));
  }

  return Object.keys(data)
    .sort(comparator)
    .reduce((o, k) => ({ ...o, [k]: deepSort(data[k], comparator) }), {});
}

/**
 * inspired by:
 * https://stackoverflow.com/questions/35811799/javascript-recursively-order-object-and-nested-objects-as-well-as-arrays
 * https://github.com/IndigoUnited/js-deep-sort-object/blob/master/index.js
 */

export default deepSort;
