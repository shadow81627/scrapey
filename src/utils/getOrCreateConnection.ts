import { DataSource } from 'typeorm';
import AppDataSource from '../db/data-source'
export default function getOrCreateConnection(): DataSource {
  AppDataSource.isInitialized
  return AppDataSource;
}