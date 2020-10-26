import { Entity, JoinColumn, OneToOne } from "typeorm";
import { Base } from "../Base";
import { Thing } from "./Thing";


@Entity()
export class Person extends Base {
  @OneToOne(() => Thing)
  @JoinColumn()
  thing?: Thing;
}