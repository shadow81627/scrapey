import { getStamps } from 'git-date-extractor';
import { readFile } from 'fs/promises'; 
export default async function gitTimeStamps(): Promise<void> {
  await getStamps({ onlyIn: '../../content', outputToFile: true });
  const timestamps = JSON.parse(
    (await readFile('timestamps.json')).toString(),
  );

  for (const content of files) {
    const contentFilePath = `${folder}${slug}.json`;
    content.createdAt = timestamps[contentFilePath].created;
  }
  
}