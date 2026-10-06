import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791319278672 implements MigrationInterface {
  name = 'InitialSchema1791319278672';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password" text NOT NULL, "name" text NOT NULL, "birthDate" date, "weight" numeric(10,2), "height" numeric(10,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "primaryMuscles" text array NOT NULL, "equipment" text, "instructions" text array NOT NULL DEFAULT '{}', "sourceId" text, "createdById" uuid, CONSTRAINT "UQ_a521b5cac5648eedc036e17d1bd" UNIQUE ("name"), CONSTRAINT "UQ_1b52756847cc3ec6d95152ba348" UNIQUE ("sourceId"), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_images" ("id" SERIAL NOT NULL, "url" text NOT NULL, "exerciseId" uuid, "uploadedById" uuid, CONSTRAINT "PK_579f0774a15a8dd53bab2ac5e76" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "routine_days" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayNumber" integer NOT NULL, "description" text NOT NULL, "userId" uuid, CONSTRAINT "UQ_b47f8ea241397ae0041d39eb187" UNIQUE ("userId", "dayNumber"), CONSTRAINT "PK_93d1f85dcb39314da38cdd583f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "routine_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "notes" text, "userId" uuid, "routineDayId" uuid, "exerciseId" uuid, CONSTRAINT "PK_1e557a3e724e3497b89112bfd6b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "weight" numeric(10,2) NOT NULL, "reps" integer NOT NULL, "restSeconds" integer, "notes" text, "routineExerciseId" uuid, "userId" uuid, CONSTRAINT "PK_5d15ed8b3e2a5cb6e9c9921d056" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "weekly_goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "weekStart" date NOT NULL, "targetDays" integer NOT NULL, "userId" uuid, CONSTRAINT "UQ_cf5e5d2cac7e3ed146002d44f60" UNIQUE ("userId", "weekStart"), CONSTRAINT "PK_d77dd12601fb2f7314207d01436" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "history_sets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "weight" numeric(10,2) NOT NULL, "reps" integer NOT NULL, "restSeconds" integer, "notes" text, "historyExerciseId" uuid, "userId" uuid, CONSTRAINT "PK_1e57b9d43785982954659c81897" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "history_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "notes" text, "historyEntryId" uuid, "exerciseId" uuid, "userId" uuid, CONSTRAINT "PK_7448830f3eaafe427a2517fdcf9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "history_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "userId" uuid, "routineDayId" uuid, CONSTRAINT "PK_779ab5373855af6b50b6a586f41" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."calendar_entries_status_enum" AS ENUM('empty', 'planned', 'done')`,
    );
    await queryRunner.query(
      `CREATE TABLE "calendar_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "status" "public"."calendar_entries_status_enum" NOT NULL DEFAULT 'empty', "userId" uuid, "routineDayId" uuid, "historyEntryId" uuid, CONSTRAINT "PK_5e2835bf73f59874b0f6793a4a2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "planned_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "calendarEntryId" uuid, "exerciseId" uuid, CONSTRAINT "PK_4041b1d616cc18bb9d0061ca230" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD CONSTRAINT "FK_9f847dfd076ba00bb1f22d454f3" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_images" ADD CONSTRAINT "FK_625ff7d076b14bb176874142763" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_images" ADD CONSTRAINT "FK_f880da37e99434a5e041eebce45" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_days" ADD CONSTRAINT "FK_e4f53f9a3b4133a444eae18b005" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_exercises" ADD CONSTRAINT "FK_05ebd3b3b9b9ff7ee093582f52e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_exercises" ADD CONSTRAINT "FK_3d2cf1c8e9c4ee4fe917c71a0ad" FOREIGN KEY ("routineDayId") REFERENCES "routine_days"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_exercises" ADD CONSTRAINT "FK_dcf00c4d9726b955280b9ad9cb3" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sets" ADD CONSTRAINT "FK_b1ebe417b8359c22baffd84cb79" FOREIGN KEY ("routineExerciseId") REFERENCES "routine_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sets" ADD CONSTRAINT "FK_264696c515efbaa9f2bd217862e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weekly_goals" ADD CONSTRAINT "FK_8a2c7f3d9ddab438a179c7fd050" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_sets" ADD CONSTRAINT "FK_27e07ea075a9c3610c0df42f421" FOREIGN KEY ("historyExerciseId") REFERENCES "history_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_sets" ADD CONSTRAINT "FK_7343f5be5e599b2cecfa44e664e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_exercises" ADD CONSTRAINT "FK_a5a4e1b542ac3cbdc29fed8016f" FOREIGN KEY ("historyEntryId") REFERENCES "history_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_exercises" ADD CONSTRAINT "FK_f9f3f8d1077a3e1cc36fb287797" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_exercises" ADD CONSTRAINT "FK_19858b6c862059568abd5f395a2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_entries" ADD CONSTRAINT "FK_deb23627078c033dc48783e7521" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_entries" ADD CONSTRAINT "FK_23634bde378d9bf7200c59c8a52" FOREIGN KEY ("routineDayId") REFERENCES "routine_days"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_entries" ADD CONSTRAINT "FK_659e6aee4960176804215bef7ce" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_entries" ADD CONSTRAINT "FK_6a92c9d6fa284e5dfe8438e2625" FOREIGN KEY ("routineDayId") REFERENCES "routine_days"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_entries" ADD CONSTRAINT "FK_4680fb32098c298f4476efd3d7a" FOREIGN KEY ("historyEntryId") REFERENCES "history_entries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_exercises" ADD CONSTRAINT "FK_356b7e09dd5e1eb9cbb5441e82f" FOREIGN KEY ("calendarEntryId") REFERENCES "calendar_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_exercises" ADD CONSTRAINT "FK_022fef85e34ce4d8bdee704d7a7" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planned_exercises" DROP CONSTRAINT "FK_022fef85e34ce4d8bdee704d7a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planned_exercises" DROP CONSTRAINT "FK_356b7e09dd5e1eb9cbb5441e82f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_entries" DROP CONSTRAINT "FK_4680fb32098c298f4476efd3d7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_entries" DROP CONSTRAINT "FK_6a92c9d6fa284e5dfe8438e2625"`,
    );
    await queryRunner.query(
      `ALTER TABLE "calendar_entries" DROP CONSTRAINT "FK_659e6aee4960176804215bef7ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_entries" DROP CONSTRAINT "FK_23634bde378d9bf7200c59c8a52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_entries" DROP CONSTRAINT "FK_deb23627078c033dc48783e7521"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_exercises" DROP CONSTRAINT "FK_19858b6c862059568abd5f395a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_exercises" DROP CONSTRAINT "FK_f9f3f8d1077a3e1cc36fb287797"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_exercises" DROP CONSTRAINT "FK_a5a4e1b542ac3cbdc29fed8016f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_sets" DROP CONSTRAINT "FK_7343f5be5e599b2cecfa44e664e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_sets" DROP CONSTRAINT "FK_27e07ea075a9c3610c0df42f421"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weekly_goals" DROP CONSTRAINT "FK_8a2c7f3d9ddab438a179c7fd050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sets" DROP CONSTRAINT "FK_264696c515efbaa9f2bd217862e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sets" DROP CONSTRAINT "FK_b1ebe417b8359c22baffd84cb79"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_exercises" DROP CONSTRAINT "FK_dcf00c4d9726b955280b9ad9cb3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_exercises" DROP CONSTRAINT "FK_3d2cf1c8e9c4ee4fe917c71a0ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_exercises" DROP CONSTRAINT "FK_05ebd3b3b9b9ff7ee093582f52e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routine_days" DROP CONSTRAINT "FK_e4f53f9a3b4133a444eae18b005"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_images" DROP CONSTRAINT "FK_f880da37e99434a5e041eebce45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_images" DROP CONSTRAINT "FK_625ff7d076b14bb176874142763"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" DROP CONSTRAINT "FK_9f847dfd076ba00bb1f22d454f3"`,
    );
    await queryRunner.query(`DROP TABLE "planned_exercises"`);
    await queryRunner.query(`DROP TABLE "calendar_entries"`);
    await queryRunner.query(
      `DROP TYPE "public"."calendar_entries_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "history_entries"`);
    await queryRunner.query(`DROP TABLE "history_exercises"`);
    await queryRunner.query(`DROP TABLE "history_sets"`);
    await queryRunner.query(`DROP TABLE "weekly_goals"`);
    await queryRunner.query(`DROP TABLE "sets"`);
    await queryRunner.query(`DROP TABLE "routine_exercises"`);
    await queryRunner.query(`DROP TABLE "routine_days"`);
    await queryRunner.query(`DROP TABLE "exercise_images"`);
    await queryRunner.query(`DROP TABLE "exercises"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
