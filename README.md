# Scrapey

> Web content scraping for fetching html and parsing into JSON.


## Usage

```bash
yarn scrape -- --url https://www.joyousapron.com/vietnamese-noodle-bowl/#recipe
```

## TODO
- set content created at from git
- check URL has URLs if not set for recrawl
- save crawl response
- consider using Crawlee to help manger crawl queue and rate limiting
- consider better content storage options
- stop Thing with same name but different brand overriding
- crawl share browser rather than start fresh for each crawl thread
- Investigate why get JSON from html gets truncated
