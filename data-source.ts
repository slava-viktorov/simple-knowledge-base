import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/users/entities/user.entity';
import { Article } from './src/articles/entities/article.entity';
import { RefreshToken } from './src/auth/entities/refresh-token.entity';
import { Role } from './src/roles/entities/role.entity';
import { Tag } from './src/tags/entities/tag.entity';

// Load environment variables
dotenv.config();

const database = process.env.DB_DATABASE || 'postgres';
const port = process.env.DB_PORT || '5432';
const host = process.env.DB_HOST || 'db_test';

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host,
    port: parseInt(port, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database,
    entities: [User, Article, RefreshToken, Role, Tag],
    migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: ['error'],
};
const dataSource = new DataSource(dataSourceOptions);
export default dataSource; 
