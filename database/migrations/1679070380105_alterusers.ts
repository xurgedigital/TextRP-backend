import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_active').nullable().defaultTo(true)
    })
  }

  public async down() {
    await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP COLUMN is_active;`)
  }
}
