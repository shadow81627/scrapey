select AVG(duration) as `Average Duration`
from url
WHERE deletedAt is NULL;