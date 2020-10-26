import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { Base } from "../Base";
import { Url } from "./Url";

@Entity()
export class Thing extends Base {
  @Column({ nullable: true })
  type?: string;
  @Column({ nullable: true, unique: true })
  slug?: string;
  @Column({ nullable: true, unique: true })
  name?: string;
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @ManyToMany(() => Url)
  @JoinTable({
    name: "thing_urls",
  })
  urls?: Url[];
}
