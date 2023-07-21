import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'supported_nfts'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('image_link').nullable()
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('image_link')
    })
  }
}
