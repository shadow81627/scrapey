import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Base } from "../util/Base";
import { Thing } from "./Thing";


@Entity()
export class Recipe extends Base {
  @Column()
  prepTime?: string;
  @Column()
  totalTime?: string;
  @Column()
  cookTime?: string;
  @Column()
  recipeYield?: string;
  @Column()
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