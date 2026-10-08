import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultWeeklyGoal1791401668301 implements MigrationInterface {
  name = 'AddDefaultWeeklyGoal1791401668301';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "defaultWeeklyGoal" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "defaultWeeklyGoal"`,
    );
  }
}
