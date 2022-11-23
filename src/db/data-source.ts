import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as entities from './entity';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'example',
  database: 'scrapey',
  synchronize: true,
  logging: false,
  entities: entities,
});

export default AppDataSource;
