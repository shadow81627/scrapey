-- Count number of urls a url has
SELECT a.hostname,
       a.pathname,
       a.search,
       COUNT(*) AS `count`
FROM url_urls l
JOIN url a ON l.urlId_1 = a.id
JOIN url b ON l.urlId_2 = b.id
WHERE a.deletedAt IS NULL
  AND b.deletedAt IS NULL
GROUP BY a.hostname,
         a.pathname,
         a.search
ORDER BY `count` DESC;
