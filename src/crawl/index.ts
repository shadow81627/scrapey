import getOrCreateConnection from '../utils/getOrCreateConnection';
import { In, IsNull, Raw } from 'typeorm';
import { Url } from '../db/entity/Url';
import { Pool, spawn, Thread, Worker } from 'threads';
import os from 'os';
import { Subject } from 'rxjs';
import { ObservablePromise } from 'threads/dist/observable-promise';
const cpuCount = os.cpus().length;

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
  const connection = await getOrCreateConnection();
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
    task: ObservablePromise<boolean>;
    startTime: [number, number];
    url: Url;
  };
  const tasks = new Subject<MySubject>();
  for (const url of urls) {
    pool.queue(async (crawl) => {
      const startTime = process.hrtime();
      const task = crawl(url.url);
      tasks.next({ task, startTime, url });
    });
  }
  tasks.subscribe(async ({ task, startTime, url }: MySubject) => {
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
  });
  await pool.completed();
  await pool.terminate();
  await connection.close();
})();
