const { readFile, writeFile, mkdir } = require('fs').promises;
import Thing from './models/Thing';
import deepSort from './utils/deepSort';

export default class ContentService {
  static async load({ slug, folder }: { slug: string; folder: string }) {
    try {
      return JSON.parse(await readFile(`${folder}/${slug}.json`, {
        encoding: 'utf8',
      }));
    } catch (_) {

    }
  }

  static async save({
    data,
    slug,
    folder,
  }: {
    data: Thing;
    slug: string;
    folder: string;
  }): Promise<void> {
    await mkdir(folder, { recursive: true });
    return await writeFile(
      `${folder}/${slug}.json`,
      JSON.stringify(deepSort(data), undefined, 2) + '\n',
    );
  }
}
