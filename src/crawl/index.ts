import 'reflect-metadata';
import { In, IsNull, Raw } from 'typeorm';
import { Url } from '../db/entity/Url';
import { Pool, spawn, Worker } from 'threads';
import os from 'os';
import { Subject } from 'rxjs';
import { QueuedTask } from 'threads/dist/master/pool';
const cpuCount = os.cpus().length;
import AppDataSource from '../db/data-source';
import { Crawler } from './crawl';

const allowedHosts = [
  // 'shop.coles.com.au',
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
    take: 100,
    skip: 0,
  });
  const pool = Pool(() => spawn<Crawler>(new Worker('./crawl.ts')), {
    size: cpuCount / 2,
  });
  type MySubject = {
    task: QueuedTask<ArbitraryThreadType, { duration: number }>;
    url: Url;
  };
  const tasks: MySubject[] = [];
  // const $tasks = new Subject<MySubject>();
  console.log('total', total, 'urls');
  async function taskDone({ task, url }: MySubject) {
    const { duration } = await task;
    iteration++;
    const iterationOf = `${String(iteration).padStart(
      String(total).length,
      '0',
    )}/${String(total)}`;
    console.log(iterationOf, url.url, duration);
    url.duration = duration;
    url.crawledAt = new Date();
    await connection.manager.save(url);
  }
  // $tasks.subscribe({
  //   next: taskDone,
  //   complete: async () => {
  //     console.log('complete');
  //     await connection.destroy();
  //   }
  // });
  for (const url of urls) {
    const task = pool.queue((crawl) => crawl(url.url));
    // $tasks.next({ task, startTime, url });
    tasks.push({ task, url });
  }
  const completedTasks = await Promise.all(tasks);
  for (const completedTask of completedTasks) {
    await taskDone(completedTask);
  }
  await pool.completed();
  await pool.terminate();
  // $tasks.complete();
  await connection.destroy();
})();
