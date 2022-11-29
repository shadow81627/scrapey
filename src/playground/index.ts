import AppDataSource from '../db/data-source';
import deleteDisallowedDomains from './deleteDisallowedDomains';
import deleteDuplicateUrls from './deleteDuplicateUrls';
import colesNationalReplaceUrls from './colesNationalReplaceUrls';
import incorrectUrlIds from './incorrectUrlId';
import resetRedirectedColesUrls from './resetRedirectedColesUrls';
import countUrlSearch from './countUrlSearch';
import gitTimeStamps from './gitTimeStamps';
import urlsMissingUrls from './urlsMissingUrls';
import probeImages from './probeImages';
import imageUrls from './imageUrls';

(async () => {
  await AppDataSource.initialize();

  const responses = {
    deleteDisallowedDomains: '',
    colesNationalReplaceUrls: '',
    incorrectUrlIds: '',
    deleteDuplicateUrls: '',
    resetRedirectedColesUrls: '',
    probeImages: '',
    urlsMissingUrls: '',
    imageUrls: '',
  }

  responses.deleteDisallowedDomains = await deleteDisallowedDomains();
  responses.colesNationalReplaceUrls = await colesNationalReplaceUrls();
  responses.incorrectUrlIds = await incorrectUrlIds();
  responses.deleteDuplicateUrls = await deleteDuplicateUrls();
  responses.resetRedirectedColesUrls = await resetRedirectedColesUrls();
  await countUrlSearch();
  responses.imageUrls = await imageUrls();
  responses.probeImages = await probeImages();
  responses.urlsMissingUrls = await urlsMissingUrls();
  await gitTimeStamps();

  console.table(responses);

  await AppDataSource.destroy();
})();
