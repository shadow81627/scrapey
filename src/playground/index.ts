import AppDataSource from '../db/data-source';
import deleteDisallowedDomains from './deleteDisallowedDomains';
import deleteDuplicateUrls from './deleteDuplicateUrls';
import colesNationalReplaceUrls from './colesNationalReplaceUrls';
import incorrectUIrlIds from './incorrectUrlId';
import resetRedirectedColesUrls from './resetRedirectedColesUrls';
import countUrlSearch from './countUrlSearch';

(async () => {
  await AppDataSource.initialize();

  await deleteDisallowedDomains();
  await colesNationalReplaceUrls();
  await incorrectUIrlIds();
  await deleteDuplicateUrls();
  await resetRedirectedColesUrls();
  await countUrlSearch();

  await AppDataSource.destroy();
})();
