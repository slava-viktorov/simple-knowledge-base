import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticleTagsIndexes1757925000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // article_tags: оставляем индекс (articleId, tagId) для джойнов по articleId,
    // удаляем одиночные индексы, т.к. их покрывают композитные
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS article_tags_articleid_tagid_index ON article_tags ("articleId", "tagId")`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_83a0534713c9e7f6bb2110c7bc"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_acbc7f775fb5e3fe2627477b5f"`,
    );

    // articles
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS articles_ispublic_index ON articles ("isPublic")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS articles_createdat_index ON articles ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS articles_ispublic_true_createdat_index ON articles ("createdAt") WHERE "isPublic" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS articles_authorid_ispublic_index ON articles ("authorId", "isPublic")`,
    );

    // tags: удаляем неуникальный индекс по name, т.к. есть уникальное ограничение
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tags_name"`);

    // users
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS users_roleid_index ON users ("roleId")`,
    );

    // refresh_tokens
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS refresh_tokens_userid_index ON refresh_tokens ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS article_tags_articleid_tagid_index`,
    );
    // вернём одиночные индексы, которые удалили в up
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_83a0534713c9e7f6bb2110c7bc" ON "article_tags" ("tagId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_acbc7f775fb5e3fe2627477b5f" ON "article_tags" ("articleId")`,
    );

    // articles
    await queryRunner.query(`DROP INDEX IF EXISTS articles_ispublic_index`);
    await queryRunner.query(`DROP INDEX IF EXISTS articles_createdat_index`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS articles_ispublic_true_createdat_index`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS articles_authorid_ispublic_index`,
    );

    // tags: вернём неуникальный индекс, если откатываемся
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tags_name" ON "tags" ("name")`,
    );

    // users
    await queryRunner.query(`DROP INDEX IF EXISTS users_roleid_index`);

    // refresh_tokens
    await queryRunner.query(`DROP INDEX IF EXISTS refresh_tokens_userid_index`);
  }
}
