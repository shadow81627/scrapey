import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Url } from './entity/Url';
import { Thing } from './entity/Thing';
import { Recipe } from './entity/Recipe';
import { Image } from './entity/Image';
import { Product } from './entity/Product';
import { CrawlIssue } from './entity/CrawlIssue';
import { Organization } from './entity/Organization';
import { Offer } from './entity/Offer';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'example',
  database: 'scrapey',
  synchronize: true,
  logging: false,
  entities: [
    Url,
    Thing,
    Recipe,
    Image,
    Product,
    CrawlIssue,
    Organization,
    Offer,
  ],
});

export default AppDataSource;
