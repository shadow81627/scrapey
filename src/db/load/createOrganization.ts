import 'reflect-metadata';
import { getConnection } from 'typeorm';
import { Organization } from '../entity/Organization';
import createThing from './createThing';
import ThingParmas from './ThingParams';

export default async function createOrganization(params: ThingParmas): Promise<Organization> {
  const connection = getConnection();
  const thing = await createThing(params);
  const { dated } = thing;
  const org =
    (await connection.manager.findOne(Organization, {
      where: [{ thing }],
      relations: ['thing'],
    })) ??
    connection.manager.create(Organization, {
      dated,
      thing,
    });
  await connection.manager.save(org);
  return org;
}