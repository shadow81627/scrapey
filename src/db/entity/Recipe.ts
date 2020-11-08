import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Base } from "../util/Base";
import { Thing } from "./Thing";


@Entity()
export class Recipe extends Base {
  @Column({ nullable: true })
  prepTime?: string;
  @Column({ nullable: true })
  totalTime?: string;
  @Column({ nullable: true })
  cookTime?: string;
  @Column({ nullable: true })
  recipeYield?: string;
  @Column({ nullable: true })
  recipeCuisine?: string;

  @OneToOne(() => Thing, { nullable: false })
  @JoinColumn()
  thing?: Thing;

  // @ManyToOne(() => Person)
  // author?: Person;

  // video?: Record<string, unknown>;
  // image?: ImageObject;
  // recipeIngredient?: Array<string>;
  // recipeInstructions?: Array<string | HowToSection | HowToStep> = [];

}