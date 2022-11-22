import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';
import { Dated } from './Dated';

@Entity()
export class Base {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column(() => Dated, {
    prefix: false,
  })
  dated?: Dated;

  @VersionColumn()
  version?: number;
}
