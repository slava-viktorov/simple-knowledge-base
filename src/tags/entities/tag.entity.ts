import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

@Index('idx_tags_name', ['name'])
@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeNameCase() {
    if (typeof this.name === 'string') {
      this.name = this.name.trim().toLowerCase();
    }
  }

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Article, (article) => article.tags, {
    cascade: false,
  })
  @JoinTable({
    name: 'article_tags',
    joinColumn: {
      name: 'tagId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'articleId',
      referencedColumnName: 'id',
    },
  })
  articles: Article[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
