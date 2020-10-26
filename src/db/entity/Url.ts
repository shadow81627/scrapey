import { Entity, Column } from "typeorm";
import { v5 as uuidv5 } from 'uuid';
import { Dated } from "../Dated";

@Entity()
export class Url {
    @Column({ type: 'char', length: '36', unique: true, primary: true, update: false })
    id?: string;
    @Column()
    hostname?: string;
    @Column({ default: '/' })
    pathname?: string;
    @Column({ nullable: true })
    search?: string;

    @Column(() => Dated, {
        prefix: false
    })
    dated?: Dated;

    constructor({ hostname, pathname, search, ...params }: Url = {}) {
        Object.assign(this, params);
        this.hostname = hostname;
        this.pathname = pathname;
        this.search = search;
        this.id = uuidv5(`https://${hostname}${pathname}${search}`, uuidv5.URL);
    }

}
