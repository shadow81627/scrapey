import AppDataSource from '../db/data-source';
import deleteDisallowedDomains from './deleteDisallowedDomains';
import deleteDuplicateUrls from './deleteDuplicateUrls';
import colesNationalReplaceUrls from './colesNationalReplaceUrls';
import incorrectUIrlIds from './incorrectUrlId';
import resetRedirectedColesUrls from './resetRedirectedColesUrls';

(async () => {
  await AppDataSource.initialize();

  await deleteDisallowedDomains();
  // await colesNationalReplaceUrls();
  await deleteDuplicateUrls();
  await incorrectUIrlIds();
  // await resetRedirectedColesUrls();

  await AppDataSource.destroy();
})();
