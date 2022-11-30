import { Like } from 'typeorm';
import AppDataSource from '../db/data-source';
import { Url } from '../db/entity';

export default async function deleteBudgetBytesCommentUrls(): Promise<string> {
  const connection = AppDataSource;
  const links = await connection.manager.find(Url, {
    where: [
      {
        hostname: 'budgetbytes.com',
        pathname: Like('%/comment-page-%'),
      },
    ],
  });
  await connection.manager.softRemove(links);
  const response = `budget bytes comment urls soft deleted ${links.length}`;
  console.log(response);
  return response;
}
