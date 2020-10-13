const renameKeys = (
  keysMap: Record<string, string>,
  obj: Record<string, string>,
) =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      ...{ [keysMap[key] || key]: obj[key] },
    }),
    {},
  );

export default renameKeys;
