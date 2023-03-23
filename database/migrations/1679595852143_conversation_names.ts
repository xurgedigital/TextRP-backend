import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'conversations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name')
    })
  }
}
