import { DataSource } from "typeorm"
import ormconfig from "../../ormconfig.json"

const MyDataSource = new DataSource(ormconfig)