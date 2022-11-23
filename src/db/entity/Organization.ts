import { Entity, JoinColumn, OneToOne, Relation } from "typeorm";
import { Base } from "../util/Base";
import { Thing } from "./Thing";
import ThingSchema from '../../models/Thing'
import getOrCreateConnection from "../../utils/getOrCreateConnection";

@Entity()
export class Organization extends Base {
  @OneToOne(() => Thing, { nullable: false })
  @JoinColumn()
  thing!: Relation<Thing>;

  async toObject(): Promise<ThingSchema> {
    const connection = getOrCreateConnection();
    const org = await connection.manager.findOneOrFail(Organization, {
      where: [{ id: this.id }],
      relations: ['thing'],
    });
    const thing = await org.thing.toObject();
    return new ThingSchema(thing)
  }
}