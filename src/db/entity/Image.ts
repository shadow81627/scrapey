import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "../util/Base";
import { Url } from "./Url";


@Entity()
export class Image extends Base {
  @Column()
  height?: number;
  @Column()
  width?: number;

  @ManyToOne(() => Url)
  url?: Url;
}