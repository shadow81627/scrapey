import { getConnection, createConnection, Connection } from 'typeorm';
export default async function getOrCreateConnection(): Promise<Connection> {
  try {
    return getConnection();
  } catch {
    return await createConnection();
  }
}