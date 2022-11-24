SELECT COUNT(*) AS `Uncrawled Urls`
FROM url
WHERE crawledAt IS NULL
  AND deletedAt IS NULL;