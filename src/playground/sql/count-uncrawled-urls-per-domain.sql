/* Number of uncrawled urls per domain */
SELECT hostname,
       COUNT(*) AS `urls`
FROM url
WHERE crawledAt IS NULL
  AND deletedAt IS NULL
GROUP BY hostname
ORDER BY urls DESC;