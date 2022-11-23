import { Column, Entity, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { Base } from '../util/Base';
import { Url } from './Url';

@Entity()
export class CrawlIssue extends Base {
  @Column({ nullable: true, unique: false })
  name!: string;
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @ManyToOne(() => Url, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  url!: Relation<Url>;
}
