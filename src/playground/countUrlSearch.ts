import AppDataSource from '../db/data-source';
import { Url } from '../db/entity';

export default async function countUrlSearch(): Promise<void> {
  const connection = AppDataSource;
  console.log('fetch all urls to count search params');
  const paramsMap: Record<string, string[]> = {};
  const links = await connection.manager.find(Url);
  for (const link of links) {
    const params = new URLSearchParams(link.search);
    for (const [key] of params) {
      const paramUrls = paramsMap[key] ?? [];
      if (link.id) {
        paramUrls.push(link.id);
      }
      if (!paramsMap[key]) {
        paramsMap[key] = paramUrls;
      }
    }
  }
  const presentTable = Object.fromEntries(
    Object.entries(paramsMap)
      .map(([key, value]: [string, string[]]): [string, number] => [
        key,
        value.length,
      ])
      .sort(function (a: [string, number], b: [string, number]) {
        return b[1] - a[1];
      }),
  );
  console.table(presentTable);
}
