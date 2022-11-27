import 'reflect-metadata';
import getFiles from '../../utils/getFiles';
import { Pool, spawn, Worker } from 'threads';
import path from 'path';
import os from 'os';
import AppDataSource from '../data-source';
const cpuCount = os.cpus().length;

/**
 * Main top level async/await
 */
(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const connection = AppDataSource;
  const files = [];
  for await (const filename of getFiles('content')) {
    files.push(filename);
  }
  const totalFiles = files.length;
  const pool = Pool(() => spawn(new Worker('./worker.ts')), {size: cpuCount / 4});
  let iteration = 0;
  for (const file of files) {
    const task = pool.queue(async (loadDB) => {
      iteration++;
      await loadDB(file);
      console.log(
        `${String(iteration).padStart(String(totalFiles).length, '0')}/${String(
          totalFiles,
        )}`,
        path.relative(process.cwd(), file),
      );
    });
  }
  await pool.completed();
  await pool.terminate();
  await connection.close();
})();
