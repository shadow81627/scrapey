# Scrapey

> Web content scraping for fetching html and parsing into json.

## Usage

```bash
yarn scrape -- --url https://www.joyousapron.com/vietnamese-noodle-bowl/#recipe
```
- set content created at from git
- check url has urls if not set for recrawl
- save crawl response
- consider using crawlee to help manger crawl queue and rate limiting
- consider better content storage options
- stop things with same name but different brand overriding
- crawl share browser rather than start fresh for each crawl thread
- Investigate why get json from html is truncated
