import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('text_rp_username').nullable()
      table.text('about').nullable()
    })
  }

  public async down() {
    await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP COLUMN text_rp_username;`)
    await Database.rawQuery(`ALTER TABLE ${this.tableName} DROP COLUMN about;`)
  }
}
