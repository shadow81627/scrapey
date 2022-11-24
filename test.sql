/* Number of urls per domain */
SELECT hostname,
       COUNT(*) AS `urls`
FROM url
GROUP BY hostname
ORDER BY urls DESC;

/* count urls without query string */
SELECT hostname,
       pathname,
       COUNT(*) AS `urls`
FROM url
WHERE deletedAt IS NULL
GROUP BY hostname,
         pathname
ORDER BY urls DESC;

/* Get crawl urls */
SELECT *
FROM url
WHERE crawledAt IS NULL
ORDER BY createdAt;

/* Count recipes */
SELECT hostname,
       COUNT(*) AS `recipes`
FROM thing
LEFT JOIN thing_urls ON thing.id = thing_urls.thingId
LEFT JOIN url ON url.id = thing_urls.urlId
WHERE type = 'Recipe'
GROUP BY hostname
ORDER BY recipes DESC;