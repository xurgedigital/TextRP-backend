import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('userId')
      table.bigInteger('user_id').unsigned()
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('user_id')
      table.string('userId')
    })
  }
}
