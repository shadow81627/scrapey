import { getStamps } from 'git-date-extractor';
import { readFile, writeFile, stat } from 'fs/promises'; 
import deepSort from '../utils/deepSort';
import getFiles from '../utils/getFiles';

// git log --follow --format=%ad --date default content/offers/10-in-1-beauty-balm/coles.json | tail -1

export default async function gitTimeStamps(): Promise<void> {
  const iteration = 0;
  for await (const filename of getFiles('content')) {
    const content = JSON.parse(
      (await readFile(filename)).toString(),
    );
    console.log('stat', await stat(filename))
    const timestamps: Record<string, {created: number, updated: number }> = await getStamps({ onlyIn: 'content', outputToFile: false, files: [filename] });
    const timestamp = Object.values(timestamps)[0];
    content.createdAt = new Date(timestamp.created).toISOString();
    // console.log(iteration, content.createdAt)
    // await writeFile(
    //   filename,
    //   JSON.stringify(deepSort(content), undefined, 2) + '\n',
    // )
  }
}