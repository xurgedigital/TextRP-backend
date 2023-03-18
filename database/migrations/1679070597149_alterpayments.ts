import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'
export default class extends BaseSchema {
  protected tableName = 'payments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('paymenttable_id').notNullable()
      table.text('paymenttable_type').notNullable()
    })
  }

  public async down() {
    await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP COLUMN paymenttable_id;`)
    await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP COLUMN paymenttable_type;`)
  }
}
