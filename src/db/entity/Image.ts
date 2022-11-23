import { Column, Entity, getConnection, JoinColumn, OneToOne, Relation } from 'typeorm';
import ImageObject from '../../models/ImageObject';
import { Base } from '../util/Base';
import { Url } from './Url';

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
  url!: Relation<Url>;

  async toObject(): Promise<ImageObject> {
    const { height, width, mime } = this;
    const connection = getConnection();
    const image = await connection.manager.findOneOrFail(Image, {
      where: [{ id: this.id }],
      relations: ['url'],
    });
    const url = image.url?.url;
    return new ImageObject({ height, width, mime, url });
  }
}
