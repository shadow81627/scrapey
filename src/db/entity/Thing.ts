import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { Base } from "../util/Base";
import { ThingType } from "../util/ThingType";
import { Url } from "./Url";
import { Image } from "./Image";

@Entity()
export class Thing extends Base {
  @Column({ nullable: true, type: 'enum', enum: ThingType })
  type?: ThingType;
  @Column({ nullable: true, unique: true })
  slug?: string;
  @Column({ nullable: true, unique: true })
  name!: string;
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @ManyToMany(() => Url, { nullable: true })
  @JoinTable({
    name: "thing_urls",
  })
  urls?: Url[];

  @ManyToMany(() => Image, { nullable: true })
  @JoinTable({
    name: "thing_images",
  })
  images?: Image[];
}
