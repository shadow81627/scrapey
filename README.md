# Scrapey

> Web content scraping for fetching html and parsing into JSON.


## Usage

```bash
yarn scrape -- --url https://www.joyousapron.com/vietnamese-noodle-bowl/#recipe
```

## TODO

- [x] Set content created at from git.
- [x] Check URL has URLs if not set for recrawl.
- [ ] Save crawl response as archive/cache.
- [ ] Consider using Crawlee to help manger crawl queue and rate limiting.
- [ ] Consider better content storage options.
- [ ] Don't override Thing with same name but different brand.
- [ ] Crawl share browser rather than start fresh for each crawl thread.
- [x] Investigate why get JSON from html gets truncated. Problem cheerio/he html encoding issues. Solution change to `node-html-parser`.
- [ ] Consider using web.archive.org to fetch html.
- [ ] Queue, rate limit and retry image probe.
- [ ] Multi thread access to cookies file causing invalid saving of file.
- [ ] HTML decode name and description text? I don't want to be injecting raw html from other websites into my pages.
- [ ] Consider using Nest JS to make a REST API.
- [ ] Fetch and use robots.txt.
- [ ] Fetch and use sitemap.xml
- [ ] Hostname table
- [ ] Url Search params table
- [ ] Compute diet, since a lot of recipes are missing suitableForDiet
- [ ] Ingredient table
- [ ] Instruction table
- [ ] Node tsx for faster typescript compile.
