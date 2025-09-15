import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1757918114855 implements MigrationInterface {
  name = 'InitialSchema1757918114855';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_tags_name" ON "tags" ("name") `);
    await queryRunner.query(
      `CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "content" text NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" uuid, CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_articles_author_id" ON "articles" ("authorId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "jti" character varying(36) NOT NULL, "token" character varying(64) NOT NULL, "isRevoked" boolean NOT NULL DEFAULT false, "revokedAt" TIMESTAMP, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f3752400c98d5c0b3dca54d66d5" UNIQUE ("jti"), CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    // Seed default roles
    await queryRunner.query(`
            INSERT INTO "roles" (id, name, description)
            VALUES
              ('550e8400-e29b-41d4-a716-446655440001', 'author', 'Regular user role'),
              ('550e8400-e29b-41d4-a716-446655440002', 'admin',  'Administrator role')
            ON CONFLICT (id) DO NOTHING
        `);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying NOT NULL, "passwordHash" character varying NOT NULL, "source" character varying(50), "roleId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "article_tags" ("tagId" uuid NOT NULL, "articleId" uuid NOT NULL, CONSTRAINT "PK_bfcd6ae5865482ee63ece446586" PRIMARY KEY ("tagId", "articleId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83a0534713c9e7f6bb2110c7bc" ON "article_tags" ("tagId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acbc7f775fb5e3fe2627477b5f" ON "article_tags" ("articleId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" ADD CONSTRAINT "FK_83a0534713c9e7f6bb2110c7bcc" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" ADD CONSTRAINT "FK_acbc7f775fb5e3fe2627477b5f7" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_tags" DROP CONSTRAINT "FK_acbc7f775fb5e3fe2627477b5f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" DROP CONSTRAINT "FK_83a0534713c9e7f6bb2110c7bcc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_acbc7f775fb5e3fe2627477b5f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83a0534713c9e7f6bb2110c7bc"`,
    );
    await queryRunner.query(`DROP TABLE "article_tags"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."idx_articles_author_id"`);
    await queryRunner.query(`DROP TABLE "articles"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tags_name"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
