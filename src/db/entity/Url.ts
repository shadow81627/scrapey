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
  Relation,
  JoinColumn,
} from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { Dated } from '../util/Dated';
import { CrawlIssue } from './CrawlIssue';

interface UrlParts {
  hostname: string;
  pathname?: string;
  search?: string;
}

const disallowedParams = [
  'adobe_mc',
]

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

  @Column({ nullable: true, type: 'bigint' })
  duration?: number;

  @Column(() => Dated, {
    prefix: false,
  })
  dated?: Dated;

  @VersionColumn()
  version?: number;

  @ManyToOne(() => Url, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  canonical?: Relation<Url>;

  // all the urls on this page
  @ManyToMany(() => Url, { nullable: true, cascade: true })
  @JoinTable({
    name: 'url_urls',
  })
  urls?: Relation<Url[]>;

  @OneToMany(() => CrawlIssue, (issue: CrawlIssue) => issue.url)
  issues?: Relation<CrawlIssue>;

  // computed full url property
  @Column({ select: false, readonly: true, insert: false, nullable: true, })
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
    const filteredSearch = new URLSearchParams(search ?? '')
    disallowedParams.forEach(param => filteredSearch.delete(param))
    return `https://${hostname}${pathname ?? ''}${filteredSearch}`;
  }

  public static urlToParts(url: string): UrlParts {
    const { hostname, pathname, search } = new URL(
      normalizeUrl(url, {
        forceHttps: true,
        stripHash: true,
        removeQueryParameters: ['reviewPageNumber', 'adobe_mc'],
      }),
    );
    return { hostname, pathname, search };
  }

  public static generateId(urlParts: UrlParts): string {
    return uuidv5(Url.getUrl(urlParts), uuidv5.URL);
  }
}
