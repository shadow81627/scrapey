import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';
import { Base } from '../util/Base';
import { Offer } from './Offer';
import { Organization } from './Organization';
import { Thing } from './Thing';
import { promises as fsPromises } from 'fs';
const { writeFile } = fsPromises;
import { head, map, omit, pickBy } from 'lodash';
import deepSort from '../../utils/deepSort';
import { Product as ProductSchema, Offer as OfferSchema } from 'schema-dts';
import getOrCreateConnection from '../../utils/getOrCreateConnection';

@Entity()
export class Product extends Base {
  @Column({ unique: true, nullable: true, unsigned: true, type: 'bigint' })
  gtin13?: number;

  @ManyToOne(() => Organization)
  brand?: Relation<Organization>;

  @OneToMany(() => Offer, (offer: Offer) => offer.itemOffered)
  offers?: Relation<Offer[]>;

  @OneToOne(() => Thing, { nullable: false })
  @JoinColumn()
  thing?: Relation<Thing>;

  async toObject(): Promise<Partial<ProductSchema>> {
    const connection = getOrCreateConnection();
    const product = await connection.manager.findOneOrFail(Product, {
      where: [{ id: this.id }],
      relations: ['thing', 'offers', 'brand'],
    });
    const thing = pickBy(await product.thing?.toObject());
    const brand = pickBy(
      omit(await product.brand?.toObject(), [
        'sameAs',
        'additionalProperty',
        'image',
      ]),
    ) as unknown;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const offerData = (await Promise.all(
      product.offers?.map((offer) => offer.toObject()) ?? [],
    )) as OfferSchema[];
    return <ProductSchema>{
      ...thing,
      '@type': 'Product',
      gtin13: this.gtin13,
      brand: brand,
      offers: {
        '@type': 'AggregateOffer',
        offers: offerData,
        priceCurrency: head(map(offerData, 'priceCurrency')),
        highPrice: Math.max(...map(offerData, 'price').map(Number)),
        lowPrice: Math.min(...map(offerData, 'price').map(Number)),
        offerCount: offerData.length,
      },
    };
  }

  async toFile(): Promise<void> {
    const folder = `content/products`;
    const data = await this.toObject();
    await writeFile(
      `${folder}/${this.thing?.slug}.json`,
      JSON.stringify(deepSort(data), undefined, 2) + '\n',
    );
  }
}
