import { Entity, JoinColumn, OneToOne, Relation } from "typeorm";
import { Base } from "../util/Base";
import { Thing } from "./Thing";


@Entity()
export class Person extends Base {
  @OneToOne(() => Thing, { nullable: false })
  @JoinColumn()
  thing?: Relation<Thing>;
}