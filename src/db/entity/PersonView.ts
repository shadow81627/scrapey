import { Connection, ViewColumn, ViewEntity } from "typeorm";
import { Person } from "./Person";
import { Thing } from "./Thing";

@ViewEntity({
  expression: (connection: Connection) => connection.createQueryBuilder()
    .select("p.id, thing.name, thing.description, thing.createdAt, thing.updatedAt")
    .from(Thing, "thing")
    .innerJoin(Person, "p", "thing.id = p.thingId")
})
export class PersonView {

  @ViewColumn()
  id?: number;

  @ViewColumn()
  name?: string;

  @ViewColumn()
  description?: string;

}