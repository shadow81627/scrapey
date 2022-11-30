/* Number of urls per domain */
SELECT hostname,
       COUNT(*) AS `urls`
FROM url
WHERE deletedAt IS NULL
GROUP BY hostname
ORDER BY urls DESC;