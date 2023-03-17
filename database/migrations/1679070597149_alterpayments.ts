import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('paymenttable_id').notNullable().alter()
      table.text('paymenttable_type').notNullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('paymenttable_id').notNullable().alter()
      table.text('paymenttable_type').notNullable().alter()
    })
  }
}
