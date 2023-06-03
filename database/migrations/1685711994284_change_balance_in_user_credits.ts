import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'user_credits'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('balance').defaultTo(0).alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('balance').defaultTo(0).alter()
    })
  }
}
