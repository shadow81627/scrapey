import { readFile } from 'fs/promises';
import getFiles from '../utils/getFiles';
import path from 'path';


export default async function diet(): Promise<string> {
  const updated = [];
  let iteration = 0;
  const name = 'check diets in content files';
  console.log(`fetching ${name}`);
  for await (const filename of getFiles('content')) {
    iteration++;
    const relativePath = path.relative(process.cwd(), filename);
    try {
      const content = JSON.parse((await readFile(filename)).toString());
      if (content.suitableForDiet) {
        console.log(iteration, relativePath);
        updated.push(filename);
      }
    } catch (error) {
      console.error(iteration, relativePath, error);
    }
  }
  const response = `${name} files updated ${updated.length}`;
  console.log(response);
  return response;
}
