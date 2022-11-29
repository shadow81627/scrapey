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
async function gitCreateDate(relativePath: string): Promise<string | undefined> {
  const command = `git log --follow --format=%ad --date default ${relativePath} | tail -1`;
  const { stdout, stderr } = await execAsync(command);
  if (stderr) {
    throw new Error(stderr);
  }
  if (stdout && stdout.length) {
    return new Date(stdout).toISOString();
  }
}

export default async function gitTimeStamps(): Promise<void> {
  let iteration = 0;
  console.log('fetching createdAt from git history');
  for await (const filename of getFiles('content')) {
    iteration++;
    const relativePath = path.relative(process.cwd(), filename);
    try {
      const content = JSON.parse((await readFile(filename)).toString());
      const createdAt = await gitCreateDate(relativePath);
      if (createdAt && content.createdAt !== createdAt) {
        console.log(iteration, relativePath);
        content.createdAt = createdAt
        await writeFile(
          filename,
          JSON.stringify(deepSort(content), undefined, 2) + '\n',
        );
      }
    } catch (error) {
      console.error(iteration, relativePath, error);
    }
  }
}
