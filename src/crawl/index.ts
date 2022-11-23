import 'reflect-metadata';
import { In, IsNull, Raw } from 'typeorm';
import { Url } from '../db/entity/Url';
import { Pool, spawn, Worker } from 'threads';
import os from 'os';
import { Subject } from 'rxjs';
import { QueuedTask, ArbitraryThreadType } from 'threads/dist/master/pool';
const cpuCount = os.cpus().length;
import AppDataSource from '../db/data-source';

function parseHrtimeToSeconds(hrtime: [number, number]) {
  const seconds = (hrtime[0] + hrtime[1] / 1e9).toFixed(3);
  return seconds;
}

const allowedHosts = [
  'shop.coles.com.au',
  'woolworths.com.au',
  'budgetbytes.com',
  'connoisseurusveg.com',
];

(async () => {
  let iteration = 0;
  await AppDataSource.initialize();
  const connection = AppDataSource;
  const [urls, total] = await connection.manager.findAndCount(Url, {
    where: [
      {
        crawledAt: IsNull(),
        hostname: In(allowedHosts),
        canonical: IsNull(),
      },
      {
        crawledAt: IsNull(),
        hostname: In(allowedHosts),
        canonical: Raw('canonicalId'),
      },
    ],
    order: {
      dated: {
        createdAt: 'ASC',
      },
    },
    take: 10,
    skip: 0,
  });
  const pool = Pool(() => spawn(new Worker('./crawl.ts')), {
    size: cpuCount / 2,
  });
  type MySubject = {
    task: QueuedTask<ArbitraryThreadType, void>;
    startTime: [number, number];
    url: Url;
  };
  const tasks = new Subject<MySubject>();
  console.log('loaded', total, 'urls');
  tasks.subscribe({
    next: async ({ task, url, startTime }: MySubject) => {
      await task;
      iteration++;
      const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
      const iterationOf = `${String(iteration).padStart(
        String(total).length,
        '0',
      )}/${String(total)}`;
      console.log(iterationOf, url.url, elapsedSeconds);
      url.duration = Number(elapsedSeconds);
      await connection.manager.save(url);
    },
  });
  for (const url of urls) {
    const startTime = process.hrtime();
    const task = pool.queue(async (crawl) => {
      crawl(url.url);
    });
    tasks.next({ task, startTime, url });
  }
  await pool.completed();
  await pool.terminate();
  await connection.destroy();
})();
