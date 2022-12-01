import 'reflect-metadata';
import { Brackets, In, IsNull, Like, Not, Raw, SelectQueryBuilder } from 'typeorm';
import { Url } from '../db/entity/Url';
import { Pool, spawn, Worker } from 'threads';
import os from 'os';
import { Subject } from 'rxjs';
import { QueuedTask } from 'threads/dist/master/pool';
const cpuCount = os.cpus().length;
import AppDataSource from '../db/data-source';
import { Crawler } from './crawl';
import { shuffle } from 'lodash';

const allowedHosts = [
  'shop.coles.com.au',
  'woolworths.com.au',
  'budgetbytes.com',
  'connoisseurusveg.com',
  'ohmyveggies.com',
  'thekitchn.com',
  'veganricha.com',
  'itdoesnttastelikechicken.com',
];

async function fetchCrawlUrls({
  perPage = 10,
  page = 1,
}): Promise<[Url[], number]> {
  const skip = perPage * page - perPage;
  const connection = AppDataSource;
  function defaultQuery(): SelectQueryBuilder<Url> {
    return connection
      .getRepository(Url)
    .createQueryBuilder('url')
    .where({
      crawledAt: IsNull(),
      image: IsNull(),
      pathname: Not(Like('%.jpg')),
    }).andWhere({
      pathname: Not(Like('%/wprm_print/%')),
    }).andWhere({
      pathname: Not(Like('%/comment-page-%'))
    })
    .andWhere(
      new Brackets((qb) => {
        qb.where({ canonical: IsNull() }).orWhere({
          canonical: Raw('canonicalId'),
        });
      }),
    );
  }
  const total = await defaultQuery()
    .andWhere({ hostname: In(allowedHosts) })
    .getCount();
  let urls: Url[] = [];
  for (const hostname of allowedHosts) {
    const results = await defaultQuery()
      .andWhere({ hostname })
      .orderBy('createdAt', 'ASC')
      .take(perPage)
      .skip(skip)
      .getMany();
    urls = shuffle([...urls, ...results]);
  }
  return [urls, total];
}
type MySubject = {
  task: QueuedTask<ArbitraryThreadType, { duration: number }>;
  url: Url;
};

(async () => {
  await AppDataSource.initialize();
  const connection = AppDataSource;
  const pool = Pool(() => spawn<Crawler>(new Worker('./crawl.ts')), {
    size: 1,
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
    // if (iteration === ((perPage * page) - perPage) - (perPage / 2)) {
    //   await paginatedCrawl();
    // }
  }
  const perPage = Math.ceil((cpuCount * 2) / allowedHosts.length);
  let page = 1;
  async function paginatedCrawl(): Promise<void> {
    const [urls, total] = await fetchCrawlUrls({ page, perPage });
    console.log(
      'Page',
      page,
      'queuing',
      urls.length,
      'tasks of',
      total,
      'total urls to crawl.',
    );
    page++;
    if (!urls || !urls.length) {
      console.log('No urls found, terminating queue and database connection.');
      pool.queue(({ complete }) => complete());
      await pool.completed();
      await connection.destroy();
      await pool.terminate();
      return;
    }
    for (const url of urls) {
      const task = pool.queue(({ crawl }) => crawl(url.url));
      $tasks.next({ task, url });
    }
    await pool.completed();
    return await paginatedCrawl();
  }
  await paginatedCrawl();
})();
