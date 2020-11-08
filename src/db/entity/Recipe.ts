import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
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
  @Column({ nullable: true })
  recipeCategory?: string;

  @Column({ type: "simple-array", nullable: true })
  suitableForDiet?: string;
  @Column({ type: "simple-array", nullable: true })
  keywords?: string[];

  @OneToOne(() => Thing, { nullable: false })
  @JoinColumn()
  thing?: Thing;

  @ManyToOne(() => Thing, { nullable: true })
  author?: Thing;

  // video?: Record<string, unknown>;
  // image?: ImageObject;
  // recipeIngredient?: Array<string>;
  // recipeInstructions?: Array<string | HowToSection | HowToStep> = [];

}