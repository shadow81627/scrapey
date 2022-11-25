import { readFile, writeFile } from 'fs/promises'; 
import deepSort from '../utils/deepSort';
import getFiles from '../utils/getFiles';
import util from 'util';
import { exec } from 'child_process';
import path from 'path';
const execAsync = util.promisify(exec);

/**
 * https://stackoverflow.com/a/2390382
 * https://github.com/joshuatz/git-date-extractor
 * https://github.com/domharrington/node-gitlog
 * @param filename to get create date from git
 * @returns file create date
 */
async function gitCreateDate(filename: string): Promise<Date> {
  const relativePath = path.relative(process.cwd(), filename)
  const command = `git log --follow --format=%ad --date default ${relativePath} | tail -1`
  const { stdout, stderr } = await execAsync(command);
  if (stderr) {
    throw new Error(stderr);
  }
  return new Date(stdout);
}

export default async function gitTimeStamps(): Promise<void> {
  let iteration = 0;
  for await (const filename of getFiles('content')) {
    iteration++
    try {
      const content = JSON.parse(
        (await readFile(filename)).toString(),
      );
      content.createdAt = await gitCreateDate(filename);
      console.log(iteration, content.createdAt)
      await writeFile(
        filename,
        JSON.stringify(deepSort(content), undefined, 2) + '\n',
      )
    } catch (error) {
      console.error(error);
    }
    
  }
}