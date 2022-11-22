import { createConnection, In } from 'typeorm';
import { Url } from './src/db/entity/Url';

async function deleteDuplicateUrls() {
  const disallowedHosts = [
    'twitter.com',
    'facebook.com',
    'pinterest.com',
    'woolworthsrewards.com.au',
  ];
  const connection = await createConnection();
  const links = await connection.manager.find(Url, {
    where: [
      {
        hostname: In(disallowedHosts),
      },
    ],
  });
  await connection.manager.softRemove(links);
}

(async () => {
  await deleteDuplicateUrls();
})();
