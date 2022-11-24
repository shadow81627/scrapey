import AppDataSource from '../db/data-source';
import deleteDisallowedDomains from './deleteDisallowedDomains';

(async () => {
  await AppDataSource.initialize();
  await deleteDisallowedDomains();
  await AppDataSource.destroy();
})();
