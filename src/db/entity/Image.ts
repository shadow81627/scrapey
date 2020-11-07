import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Base } from "../util/Base";
import { Url } from "./Url";


@Entity()
export class Image extends Base {
  @Column({ nullable: true })
  height?: number;
  @Column({ nullable: true })
  width?: number;
  @Column({ nullable: true })
  mime?: string;

  @OneToOne(() => Url)
  @JoinColumn()
  url?: Url;
}