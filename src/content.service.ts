import { promises as fsPromises, existsSync } from 'fs';
const { readFile, mkdir, writeFile } = fsPromises;
import Thing from './models/Thing';
import deepSort from './utils/deepSort';

export default class ContentService {
  static async load({
    slug,
    folder,
  }: {
    slug: string;
    folder: string;
  }): Promise<Thing | undefined> {
    try {
      return JSON.parse(
        await readFile(`${folder}/${slug}.json`, {
          encoding: 'utf8',
        }),
      );
    } catch (_) {}
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
    const dataPath = `${folder}/${slug}.json`;
    const oldData = existsSync(dataPath)
      ? JSON.parse(
          await readFile(dataPath, {
            encoding: 'utf8',
          }),
        )
      : {};
    const same =
      JSON.stringify(deepSort({ ...oldData, updatedAt: undefined })) ===
      JSON.stringify(deepSort({ ...data, updatedAt: undefined }));
    if (same) {
      data.updatedAt = oldData.updatedAt;
    }
    return await writeFile(
      dataPath,
      JSON.stringify(deepSort(data), undefined, 2) + '\n',
    );
  }
}
