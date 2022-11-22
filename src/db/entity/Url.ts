import normalizeUrl from 'normalize-url';
import {
  Entity,
  Column,
  AfterLoad,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
  VersionColumn,
} from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { Dated } from '../util/Dated';
import { CrawlIssue } from './CrawlIssue';

interface UrlParts {
  hostname: string;
  pathname?: string;
  search?: string;
}

@Entity()
export class Url {
  @Column({
    type: 'char',
    length: '36',
    unique: true,
    primary: true,
    update: false,
  })
  id?: string;
  @Column()
  hostname!: string;
  @Column({ default: '/' })
  pathname?: string;
  @Column({ nullable: true, type: 'text' })
  search?: string;
  @Column({ nullable: true, type: 'timestamp' })
  crawledAt?: Date;

  @Column(() => Dated, {
    prefix: false,
  })
  dated?: Dated;

  @VersionColumn()
  version?: number;

  @ManyToOne(() => Url, { nullable: true, onDelete: 'SET NULL' })
  canonical?: Url;

  // all the urls on this page
  @ManyToMany(() => Url, { nullable: true, cascade: true })
  @JoinTable({
    name: 'url_urls',
  })
  urls?: Url[];

  @OneToMany(() => CrawlIssue, (issue: CrawlIssue) => issue.url)
  issues?: CrawlIssue;

  // computed full url property
  url!: string;

  @AfterLoad()
  computed(): string {
    const { hostname, pathname, search } = this;
    this.url = Url.getUrl({ hostname, pathname, search });
    return this.url;
  }

  constructor(
    { hostname, pathname, search, ...params }: UrlParts & Partial<Url> = {
      hostname: '',
    },
  ) {
    Object.assign(this, { hostname, pathname, search, ...params });
    this.id = Url.generateId({ hostname, pathname, search });
  }

  public static getUrl({ hostname, pathname, search }: UrlParts): string {
    return `https://${hostname}${pathname ?? ''}${search ?? ''}`;
  }

  public static urlToParts(url: string): UrlParts {
    const { hostname, pathname, search } = new URL(
      normalizeUrl(url, {
        forceHttps: true,
        stripHash: true,
        removeQueryParameters: ['reviewPageNumber'],
      }),
    );
    return { hostname, pathname, search };
  }

  public static generateId(urlParts: UrlParts): string {
    return uuidv5(Url.getUrl(urlParts), uuidv5.URL);
  }
}
