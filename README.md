# Scrapey

> Web content scraping for fetching html and parsing into JSON.


## Usage

```bash
yarn scrape -- --url https://www.joyousapron.com/vietnamese-noodle-bowl/#recipe
```

## TODO

- [x] set content created at from git.
- [x] check URL has URLs if not set for recrawl.
- [] Save crawl response as archive/cache.
- [] Consider using Crawlee to help manger crawl queue and rate limiting.
- [] Consider better content storage options.
- [] Stop Thing with same name but different brand overriding.
- [] Crawl share browser rather than start fresh for each crawl thread.
- [x] Investigate why get JSON from html gets truncated. Problem cheerio/he html encoding issues. Solution change to `node-html-parser`.
- [] Consider using web.archive.org to fetch html.
- [] Queue rate limit image probe and add retry.
