import PlatformSetting from 'App/Models/PlatformSetting'

export const GetAllConfigs = async () => {
  const active: any = await PlatformSetting.query().where('key', 'xrplActive')
  const data: any = await PlatformSetting.query().where('key', `${active[0].value}`)
  const networks: any = {
    MAIN: JSON.parse(data[0].value).main,
    WALLET: JSON.parse(data[0].value).wallet,
  }
  return networks
}
