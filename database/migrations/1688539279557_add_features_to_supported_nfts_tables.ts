import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'supported_nfts'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.json('features').nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
