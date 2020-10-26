import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { Base } from "../Base";
import { Organization } from "./Organization";
import { Thing } from "./Thing";


@Entity()
export class Product extends Base {
  @Column({ unique: true, nullable: true })
  gtin13?: string;

  @ManyToOne(() => Organization)
  brand?: Organization;

  @OneToOne(() => Thing)
  @JoinColumn()
  thing?: Thing;
}