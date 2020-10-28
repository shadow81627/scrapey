import { promises as fsPromises } from 'fs';
const { readFile, mkdir } = fsPromises;
import { DateTime } from 'luxon';
import getFiles from '../utils/getFiles';

export async function getFileUrlMap(argv: Record<string, unknown>): Promise<Map<string, string>> {
  const fileUrlMap: Map<string, string> = new Map();
  const folder = `content/${argv.collection}`;
  await mkdir(folder, { recursive: true });
  // get list of urls to crawl from content files
  for await (const filename of getFiles(folder)) {
    const file = await readFile(filename, { encoding: 'utf8' });
    const content = JSON.parse(file);
    if (
      !argv['only-new'] &&
      content.sameAs &&
      (!argv.scrape ||
        !content.updatedAt ||
        DateTime.fromISO(content.updatedAt) <
        DateTime.local().minus({
          days: content['@type'] === 'Recipe' ? 30 : 1,
        }))
    ) {
      for (const url of content.sameAs) {
        fileUrlMap.set(url, filename);
      }
    }
  }
  return fileUrlMap;
}