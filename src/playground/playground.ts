import { Subject } from 'rxjs';
import { Pool, spawn, Worker } from 'threads';
import { QueuedTask } from 'threads/dist/master/pool-types';
import { In, IsNull, Raw } from 'typeorm';
import AppDataSource from '../db/data-source';
import { Url } from '../db/entity/Url';
import os from 'os';

async function deleteDuplicateUrls() {
  const disallowedHosts = [
    'twitter.com',
    'facebook.com',
    'pinterest.com',
    'woolworthsrewards.com.au',
  ];
  const connection = AppDataSource;
  const links = await connection.manager.find(Url, {
    where: [
      {
        hostname: In(disallowedHosts),
      },
    ],
  });
  await connection.manager.softRemove(links);
}

function testRxjs() {
  const subject = new Subject<number>();

  subject.subscribe({
    next: (v) => console.log(`observerA: ${v}`),
  });
  subject.subscribe({
    next: (v) => console.log(`observerB: ${v}`),
  });

  subject.next(1);
  subject.next(2);
}

async function taskQueueTest() {
  const cpuCount = os.cpus().length;
  const connection = AppDataSource;
  const allowedHosts = [
    'shop.coles.com.au',
    'woolworths.com.au',
    'budgetbytes.com',
    'connoisseurusveg.com',
  ];
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
  const pool = Pool(() => spawn(new Worker('./worker.ts')), {
    size: cpuCount / 2,
  });
  type MySubject = {
    task: QueuedTask<ArbitraryThreadType, any>;
    startTime: [number, number];
    url: Url;
  };
  const tasks = new Subject<MySubject>();
  let iteration = 0;
  tasks.subscribe({
    next: ({ task, url }: MySubject) => {
      iteration++;
      // const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
      const iterationOf = `${String(iteration).padStart(
        String(total).length,
        '0',
      )}/${String(total)}`;
      console.log(iterationOf, url.url, task);
    },
  });
  for (const url of urls) {
    const startTime = process.hrtime();
    const task = pool.queue(async (worker) => {
      worker();
    });
    tasks.next({ task, startTime, url });
  }
  await pool.completed();
  await pool.terminate();
}

(async () => {
  await AppDataSource.initialize();
  await taskQueueTest();
  // await testRxjs();
  // await deleteDuplicateUrls();
  await AppDataSource.destroy();
})();
