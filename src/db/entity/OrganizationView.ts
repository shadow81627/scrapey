import { Connection, ViewColumn, ViewEntity } from "typeorm";
import { Organization } from "./Organization";
import { Thing } from "./Thing";

@ViewEntity({
  expression: (connection: Connection) => connection.createQueryBuilder()
    .select("org.id, thing.name, thing.description, thing.createdAt, thing.updatedAt")
    .from(Thing, "thing")
    .innerJoin(Organization, "org", "thing.id = org.thingId")
})
export class OrganizationView {

  @ViewColumn()
  id?: number;

  @ViewColumn()
  name?: string;

  @ViewColumn()
  description?: string;

}