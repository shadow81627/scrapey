import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';
import { Base } from '../util/Base';
import { Thing } from './Thing';

@Entity()
export class NutritionInformation extends Base {
  @Column({ nullable: true })
  calories?: string;
  @Column({ nullable: true })
  servingSize?: string;
  @Column({ nullable: true })
  carbohydrateContent?: string;
  @Column({ nullable: true })
  cholesterolContent?: string;
  @Column({ nullable: true })
  fatContent?: string;
  @Column({ nullable: true })
  fiberContent?: string;
  @Column({ nullable: true })
  proteinContent?: string;
  @Column({ nullable: true })
  saturatedFatContent?: string;
  @Column({ nullable: true })
  sodiumContent?: string;
  @Column({ nullable: true })
  sugarContent?: string;
  @Column({ nullable: true })
  transFatContent?: string;
  @Column({ nullable: true })
  unsaturatedFatContent?: string;

  @OneToOne(() => Thing, { nullable: false })
  @JoinColumn()
  thing?: Relation<Thing>;
}
