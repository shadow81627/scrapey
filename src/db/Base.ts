import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Dated } from "./Dated";

@Entity()
export class Base {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column(() => Dated, {
    prefix: false
  })
  dated?: Dated;
}