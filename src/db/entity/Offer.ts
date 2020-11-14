import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Base } from '../util/Base';
import { Organization } from './Organization';
import { Product } from './Product';
import { Url } from './Url';

@Entity()
// @Index("UNIQUE_ITEM_SELLER", ["itemOffered", "seller"], { unique: true })
export class Offer extends Base {
  @Column({ nullable: true })
  availability?: string;
  @Column({ nullable: true })
  itemCondition?: string;
  @Column({ nullable: true })
  price?: number;
  @Column({ nullable: true })
  priceCurrency?: string;

  @ManyToOne(() => Organization)
  @JoinColumn()
  seller?: Organization;

  @ManyToOne(() => Product)
  @JoinColumn()
  itemOffered?: Product;

  @OneToOne(() => Url)
  @JoinColumn()
  url?: Url;
}
