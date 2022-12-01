import AppDataSource from '../db/data-source';
import deleteDisallowedDomains from './deleteDisallowedDomains';
import deleteDuplicateUrls from './deleteDuplicateUrls';
import colesNationalReplaceUrls from './colesNationalReplaceUrls';
import incorrectUrlIds from './incorrectUrlId';
import resetRedirectedColesUrls from './resetRedirectedColesUrls';
import countUrlSearch from './countUrlSearch';
// import gitTimeStamps from './gitTimeStamps';
// import urlsMissingUrls from './urlsMissingUrls';
import probeImages from './probeImages';
import imageUrls from './imageUrls';
import deleteBudgetBytesCommentUrls from './deleteBudgetBytesCommentUrls';
import diet from './diet';

(async () => {
  await AppDataSource.initialize();

  const responses = {
    deleteBudgetBytesCommentUrls: '',
    deleteDisallowedDomains: '',
    colesNationalReplaceUrls: '',
    incorrectUrlIds: '',
    deleteDuplicateUrls: '',
    resetRedirectedColesUrls: '',
    probeImages: '',
    urlsMissingUrls: '',
    imageUrls: '',
    // gitTimeStamps: '',
  }

  responses.deleteBudgetBytesCommentUrls = await deleteBudgetBytesCommentUrls()
  responses.deleteDisallowedDomains = await deleteDisallowedDomains();
  responses.colesNationalReplaceUrls = await colesNationalReplaceUrls();
  responses.incorrectUrlIds = await incorrectUrlIds();
  responses.deleteDuplicateUrls = await deleteDuplicateUrls();
  responses.resetRedirectedColesUrls = await resetRedirectedColesUrls();
  responses.imageUrls = await imageUrls();
  responses.probeImages = await probeImages();
  // responses.urlsMissingUrls = await urlsMissingUrls();
  // responses.gitTimeStamps = await gitTimeStamps();
  await diet();
  await countUrlSearch();

  console.table(responses);

  await AppDataSource.destroy();
})();
