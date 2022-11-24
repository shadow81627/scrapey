import AppDataSource from '../db/data-source';
import deleteDisallowedDomains from './deleteDisallowedDomains';
import deleteDuplicateUrls from './deleteDuplicateUrls';
import colesNationalReplaceUrls from './colesNationalReplaceUrls';
import incorrectUIrlIds from './incorrectUrlId';
import resetRedirectedColesUrls from './resetRedirectedColesUrls';
import countUrlSearch from './countUrlSearch';
import gitTimeStamps from './gitTimeStamps';

(async () => {
  await AppDataSource.initialize();

  await deleteDisallowedDomains();
  await colesNationalReplaceUrls();
  await incorrectUIrlIds();
  await deleteDuplicateUrls();
  await resetRedirectedColesUrls();
  await countUrlSearch();
  await gitTimeStamps();

  await AppDataSource.destroy();
})();
