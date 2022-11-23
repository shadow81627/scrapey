import 'reflect-metadata';
import getOrCreateConnection from '../../utils/getOrCreateConnection';
import { Organization } from '../entity';
import createThing from './createThing';
import ThingParmas from './ThingParams';

export default async function createOrganization(params: ThingParmas): Promise<Organization> {
  const connection = await getOrCreateConnection();
  const thing = await createThing(params);
  const { dated } = thing;
  const org =
    (await connection.manager.findOne(Organization, {
      where: [{ thing: { id: thing.id } }],
      relations: { thing: true },
    })) ??
    connection.manager.create(Organization, {
      dated,
      thing,
    });
  await connection.manager.save(org);
  return org;
}