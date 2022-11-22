import { getConnection, createConnection } from 'typeorm';
export default async function getOrCreateConnection() {
  try {
    return getConnection();
  } catch {
    return await createConnection();
  }
}