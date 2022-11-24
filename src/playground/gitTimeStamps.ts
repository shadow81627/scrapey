import { getStamps } from 'git-date-extractor';
import { readFile } from 'fs/promises'; 
export default async function gitTimeStamps(): Promise<void> {
  const timestamps = await getStamps({ onlyIn: 'content', outputToFile: true });
  // const timestamps = JSON.parse(
  //   (await readFile('timestamps.json')).toString(),
  // );

  // for (const timestamp of timestamps) {
  //   content.createdAt = timestamps[contentFilePath].created;
  // }
  
}