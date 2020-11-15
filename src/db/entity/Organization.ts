import { Entity, getConnection, JoinColumn, OneToOne } from "typeorm";
import { Base } from "../util/Base";
import { Thing } from "./Thing";
import ThingSchema from '../../models/Thing'

@Entity()
export class Organization extends Base {
  @OneToOne(() => Thing, { nullable: false })
  @JoinColumn()
  thing!: Thing;

  async toObject(): Promise<ThingSchema> {
    const connection = getConnection();
    const org = await connection.manager.findOneOrFail(Organization, {
      where: [{ id: this.id }],
      relations: ['thing'],
    });
    const thing = await org.thing.toObject();
    return new ThingSchema(thing)
  }
}