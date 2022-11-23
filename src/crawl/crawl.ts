import cheerio from 'cheerio';
import getHtml from '../utils/getHtml';
import { Url } from '../db/entity/Url';
import _ from 'lodash';
import { processHtml } from '../scrape/processHtml';
import { processLinkData } from '../scrape/processLinkData';
import { CrawlIssue } from '../db/entity/CrawlIssue';
import isValidUrl from '../utils/isValidUrl';
import getOrCreateConnection from '../utils/getOrCreateConnection';
import { expose } from 'threads/worker';
import AppDataSource from '../db/data-source';
import parseHrtimeToSeconds from '../utils/parseHrtimeToSeconds';

const disallowedHosts = [
  'twitter.com',
  'facebook.com',
  'pinterest.com',
  'woolworthsrewards.com.au',
];
export default async function crawl(
  url: string,
): Promise<{ duration: number }> {
  const startTime = process.hrtime();
  const hostname = new URL(url).hostname;
  if (!AppDataSource.isInitialized) {
    AppDataSource.initialize();
  }
  const connection = await getOrCreateConnection();
  try {
    // fetch browser rendered html
    const html = await getHtml({ url });
    const $ = cheerio.load(html);
    const canonicalHref = $('link[rel="canonical"]').attr('href');
    const canonical =
      canonicalHref && isValidUrl(canonicalHref) ? canonicalHref : url;
    // save fetched url
    const data = processHtml(url, html);
    if (data) {
      await processLinkData({
        chunk: [canonical],
        chunkData: [data],
        fileUrlMap: new Map(),
        argv: { scrape: true },
      });
    }

    const urlParts = Url.urlToParts(url);
    const dbCanonical =
      (await connection.manager.findOne(Url, {
        where: [{ id: Url.generateId(Url.urlToParts(canonical)) }],
        relations: { urls: true },
      })) ??
      (await connection.manager.save(new Url(Url.urlToParts(canonical))));
    await connection.manager.save(
      new Url({ ...urlParts, crawledAt: new Date(), canonical: dbCanonical }),
    );
    dbCanonical.crawledAt = new Date();
    await connection.manager.save(dbCanonical);

    // console.log(iteration, dbCanonical.url);
    // TODO set all non canonical urls to crawled as well

    // get a unique list of valid urls on the same origin
    const links: string[] = _.uniq(
      $('a[href]')
        .map((_, e) => {
          try {
            const href = $(e).attr('href');
            if (
              href &&
              (href.startsWith('http') ||
                href.startsWith('/') ||
                href.startsWith('://'))
            ) {
              return Url.getUrl(new URL(href, `https://${hostname}`));
            }
          } catch (_) {
            // invalid url
          }
        })
        .get(),
    )
      .filter(Boolean)
      .filter((link) => !disallowedHosts.includes(new URL(link).hostname))
      .filter(
        (link) =>
          !link.startsWith('https://woolworths.com.au/shop/printrecipe'),
      );

    try {
      dbCanonical.urls = await Promise.all(
        links.map((link) =>
          connection.manager.save(new Url(Url.urlToParts(link))),
        ),
      );
      await connection.manager.save(dbCanonical);
    } catch (e) {
      console.log(e.message);
    }
  } catch (error) {
    console.log('Error', error);
    const dbUrl =
      (await connection.manager.findOne(Url, {
        where: [{ id: Url.generateId(Url.urlToParts(url)) }],
        relations: { urls: true },
      })) ?? (await connection.manager.save(new Url(Url.urlToParts(url))));
    dbUrl.crawledAt = new Date();
    const issue = new CrawlIssue();
    issue.name = error.name;
    issue.description = error.message;
    issue.url = dbUrl;
    dbUrl.duration = Number(parseHrtimeToSeconds(process.hrtime(startTime)));
    await connection.manager.save(dbUrl);
    await connection.manager.save(issue);
  }
  const duration = Number(parseHrtimeToSeconds(process.hrtime(startTime)));
  return { duration };
}

expose(crawl);
