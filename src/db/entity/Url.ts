import normalizeUrl from "normalize-url";
import { Entity, Column, AfterLoad, ManyToMany, JoinTable } from "typeorm";
import { v5 as uuidv5 } from 'uuid';
import { Dated } from "../util/Dated";

interface UrlParts { hostname: string, pathname?: string, search?: string }

@Entity()
export class Url {
    @Column({ type: 'char', length: '36', unique: true, primary: true, update: false })
    id?: string;
    @Column()
    hostname!: string;
    @Column({ default: '/' })
    pathname?: string;
    @Column({ nullable: true })
    search?: string;
    @Column({ nullable: true, type: 'timestamp' })
    crawledAt?: Date;

    @Column(() => Dated, {
        prefix: false
    })
    dated?: Dated;

    // all the urls on this page
    @ManyToMany(() => Url, { nullable: true })
    @JoinTable({
        name: "url_urls",
    })
    urls?: Url[];

    // computed full url property
    url?: string;

    @AfterLoad()
    computed(): string {
        const { hostname, pathname, search } = this;
        this.url = Url.getUrl({ hostname, pathname, search });
        return this.url;
    }

    constructor({ hostname, pathname, search, ...params }: UrlParts & Partial<Url> = { hostname: '' }) {
        Object.assign(this, { hostname, pathname, search, ...params });
        this.id = Url.generateId({ hostname, pathname, search });
    }

    public static getUrl({ hostname, pathname, search }: UrlParts): string {
        return `https://${hostname}${pathname}${search}`
    }

    public static urlToParts(url: string): UrlParts {
        const { hostname, pathname, search } = new URL(normalizeUrl(url));
        return { hostname, pathname, search };
    }

    public static generateId(urlParts: UrlParts): string {
        return uuidv5(Url.getUrl(urlParts), uuidv5.URL)
    }

}
