import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Article } from '../../articles/entities/article.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column({ unique: true })
  @Exclude()
  email: string;

  @Column({ unique: true })
  @Expose()
  username: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Exclude()
  source?: string | null;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId' })
  @Expose()
  role: Role;

  @Column({ type: 'uuid' })
  @Exclude()
  roleId: string;

  @OneToMany(() => Article, (article) => article.author)
  @Exclude()
  articles: Article[];

  @CreateDateColumn()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
