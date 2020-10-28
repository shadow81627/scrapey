

import { Column, Entity } from "typeorm";
import { Base } from "../util/Base";
// import { Thing } from "./Thing";
import { Url } from "./Url";


@Entity()
export class Video extends Base {

  @Column()
  duration?: string;

  contentUrl?: Url;
  // thumbnail?: Image;

  // "publisher": {
  //   "@type": "Organization";
  //   "logo": {
  //     "@type": "ImageObject";
  //     "url": "https://tasty.co/favicon.ico"
  //   };
  //   "name": "Tasty"
  // };

}