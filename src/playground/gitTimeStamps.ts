import { getStamps } from 'git-date-extractor';
import { readFile, writeFile } from 'fs/promises'; 
import deepSort from '../utils/deepSort';
export default async function gitTimeStamps(): Promise<void> {
  const timestamps: Record<string, {created: number, updated: number }> = JSON.parse(
    (await readFile('timestamps.json')).toString(),
  );

  let iteration = 0;
  for (const [path, timestamp] of Object.entries(timestamps)) {
    iteration++
    
    const content = JSON.parse((await readFile(path)).toString());
    console.log(iteration, path)
    content.createdAt = new Date(timestamp.created).toISOString();
    await writeFile(
      path,
      JSON.stringify(deepSort(content), undefined, 2) + '\n',
    )
  }
  // await getStamps({ onlyIn: 'content', outputToFile: true });
}