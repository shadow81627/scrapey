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

async function fetchCrawlUrls({
  perPage = 10,
  page = 1,
}): Promise<[Url[], number]> {
  const skip = perPage * page - perPage;
  const connection = AppDataSource;
  return await connection.manager.findAndCount(Url, {
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
    take: perPage,
    skip,
  });
}
type MySubject = {
  task: QueuedTask<ArbitraryThreadType, { duration: number }>;
  url: Url;
};

(async () => {
  await AppDataSource.initialize();
  const connection = AppDataSource;
  const pool = Pool(() => spawn<Crawler>(new Worker('./crawl.ts')), {
    size: cpuCount / 2,
  });
  const $tasks = new Subject<MySubject>();
  $tasks.subscribe({
    next: taskDone,
  });
  let iteration = 0;
  async function taskDone({ task, url }: MySubject) {
    const connection = AppDataSource;
    const { duration } = await task;
    iteration++;
    console.log(iteration, url.url, duration);
    url.duration = duration;
    url.crawledAt = new Date();
    await connection.manager.save(url);
    if (iteration > (perPage * page) - (perPage / 2)) {
      await paginatedCrawl();
    }
  }
  const perPage = cpuCount * 2;
  let page = 1;
  async function paginatedCrawl() {
    const [urls, total] = await fetchCrawlUrls({ page, perPage });
    console.log(
      'page',
      page,
      'queuing',
      urls.length,
      'tasks of',
      total,
      'total urls to crawl',
    );
    page++;
    if (!urls || !urls.length) {
      console.log('no urls terminating queue and database connection');
      await pool.completed();
      await connection.destroy();
      await pool.terminate();
    }
    for (const url of urls) {
      const task = pool.queue((crawl) => crawl(url.url));
      $tasks.next({ task, url });
    }
    await pool.completed();
    await paginatedCrawl();
  }
  await paginatedCrawl();
})();
