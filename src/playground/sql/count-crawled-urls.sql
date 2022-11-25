SELECT COUNT(*) AS `Crawled Urls`
FROM url
WHERE crawledAt IS NOT NULL
  AND deletedAt IS NULL;