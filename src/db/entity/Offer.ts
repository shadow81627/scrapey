import {
  Column,
  Entity,
  getConnection,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Base } from '../util/Base';
import { Organization } from './Organization';
import { Product } from './Product';
import { Url } from './Url';
import { Offer as OfferSchema } from 'schema-dts';
import { omit, pickBy } from 'lodash';

@Entity()
// @Index("UNIQUE_ITEM_SELLER", ["itemOffered", "seller"], { unique: true })
export class Offer extends Base {
  @Column({ nullable: true })
  availability?: string;
  @Column({ nullable: true })
  itemCondition?: string;
  @Column({
    nullable: true, type: 'decimal', precision: 10, scale: 2, transformer: {
      to(value) {
        return value;
      },
      from(value) {
        return parseFloat(value);
      },
    },
  })
  price!: number;
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

  async toObject(): Promise<OfferSchema> {
    const connection = getConnection();
    const offer = await connection.manager.findOneOrFail(Offer, {
      where: [{ id: this.id }],
      relations: ['url', 'seller'],
    });
    const url = offer.url?.url;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const seller = pickBy(omit(await offer.seller?.toObject() ?? {}, ['sameAs', 'additionalProperty', 'image']));
    return <OfferSchema>{
      price: offer.price,
      availability: offer.availability,
      itemCondition: offer.itemCondition,
      url,
      priceCurrency: offer.priceCurrency,
      seller,
    };
  }
}
