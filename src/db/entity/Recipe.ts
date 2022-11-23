import { Duration } from "luxon";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, Relation } from "typeorm";
import { Base } from "../util/Base";
import { Thing } from "./Thing";


@Entity()
export class Recipe extends Base {
  @Column({ nullable: true })
  prepTime?: string;
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
  thing?: Relation<Thing>;

  @ManyToOne(() => Thing, { nullable: true })
  @JoinColumn()
  author?: Relation<Thing>;

  // video?: Record<string, unknown>;
  // image?: ImageObject;
  // recipeIngredient?: Array<string>;
  // recipeInstructions?: Array<string | HowToSection | HowToStep> = [];

  get totalTime(): string {
    return Duration.fromISO(this.cookTime ?? 'PT0H').plus(Duration.fromISO(this.prepTime ?? 'PT0H')).toISO();
  }

}