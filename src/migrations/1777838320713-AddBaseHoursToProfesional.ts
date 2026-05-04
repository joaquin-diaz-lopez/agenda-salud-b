import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBaseHoursToProfesional1777838320713 implements MigrationInterface {
    name = 'AddBaseHoursToProfesional1777838320713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agenda_salud_dev"."profesionales" ADD "hora_inicio_base" character varying(5) NOT NULL DEFAULT '08:00'`);
        await queryRunner.query(`ALTER TABLE "agenda_salud_dev"."profesionales" ADD "hora_fin_base" character varying(5) NOT NULL DEFAULT '16:00'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agenda_salud_dev"."profesionales" DROP COLUMN "hora_fin_base"`);
        await queryRunner.query(`ALTER TABLE "agenda_salud_dev"."profesionales" DROP COLUMN "hora_inicio_base"`);
    }

}
