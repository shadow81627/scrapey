import { Column, Entity, JoinColumn, OneToMany, Relation } from 'typeorm';
import { Base } from '../util/Base';
import { Url } from './Url';

@Entity()
export class Hostname extends Base {
  @Column()
  hostname!: string;

  @OneToMany(() => Url, (url: Url) => url.url)
  urls?: Relation<Url>;
}
