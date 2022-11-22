import getNextCrawlUrl from "../utils/getNextCrawlUrl";
import getOrCreateConnection from "../utils/getOrCreateConnection";
import crawl from "./crawl";

(async () => {
  const connection = await getOrCreateConnection();
  const url = await getNextCrawlUrl();
  if (url) {
    await crawl(url);
  }
  await connection.close();
})();