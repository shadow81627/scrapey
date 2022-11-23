import { Entity, Column, ManyToMany, JoinTable, Relation } from "typeorm";
import { Base } from "../util/Base";
import { ThingType } from "../util/ThingType";
import { Url } from "./Url";
import { Image } from "./Image";
import ThingSchema from '../../models/Thing'
import AppDataSource from "../data-source";

@Entity()
export class Thing extends Base {

  @Column({ nullable: false, type: 'enum', enum: ThingType })
  type!: ThingType;
  @Column({ nullable: false, unique: true })
  slug!: string;
  @Column({ nullable: true, unique: true })
  name!: string;
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @ManyToMany(() => Url, { nullable: true })
  @JoinTable({
    name: "thing_urls",
  })
  urls?: Relation<Url[]>;

  @ManyToMany(() => Image, { nullable: true })
  @JoinTable({
    name: "thing_images",
  })
  images?: Relation<Image[]>;

  @Column({ type: "simple-json", nullable: true })
  additionalProperty?: Array<{ name: string, value: string }>

  async toObject(): Promise<ThingSchema> {
    const { type, name, description = undefined, additionalProperty = undefined } = this;
    const connection = AppDataSource;
    const thing = (await connection.manager.findOneOrFail(Thing, {
      where: [{ slug: this.slug }],
      relations: {images: true, urls: true},
    }));
    const images = thing.images;
    const image = images ? await Promise.all(images.map(image => image.toObject())) : undefined;
    return new ThingSchema({ '@type': type, name, description, image, additionalProperty, sameAs: thing.urls?.map(url => url.url) });
  }
}
