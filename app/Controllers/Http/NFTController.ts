import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import axios from 'axios'
const xrpl = require('xrpl')
import SupportedNft from 'App/Models/SupportedNft'
import UserExternalId from 'App/Models/UserExternalId'
import Nfts from 'App/Models/Nfts'
import NftFeatureMap from 'App/Models/NftFeatureMap'
import Features from 'App/Models/Features'
import User from 'App/Models/User'
import { convertHexToString } from 'xrpl'
import { GetAllConfigs } from './GetConfig'

export default class NFTController {
  public static async verifyHolding(
    address: string,
    service: string,
    network: string | null
  ): Promise<boolean> {
    const verified = await NFTController.verify(address, network || 'main')
    return !!verified?.nfts?.find((nft) => nft[service] === true)
  }
  public static async getIPFSMetadata(nft) {
    const hexToString = convertHexToString(nft.URI)

    const uriString = hexToString.split('://')

    if (uriString[0] === 'ipfs') {
      const response: any = await axios.get(`https://ipfs.io/ipfs/${uriString[1]}`)
      if (response.data) {
        return {
          contract_address: nft.Issuer,
          taxon: nft.NFTokenTaxon,
          nft: response.data,
        }
      }
    } else {
      return { contract_address: nft.Issuer, taxon: nft.NFTokenTaxon }
    }
  }

  // get all nfts
  public static async addFeature(feature: string, rule: string, description: string) {
    try {
      const res = await Features.create({ feature, rules: rule, description })
      return res
    } catch (e) {
      return false
    }
  }

  public static async updateFeature(
    id: number,
    feature: string,
    rule: string,
    description: string
  ) {
    try {
      const res = await Features.updateOrCreate({ id }, { feature, rules: rule, description })
      return res
    } catch (e) {
      return false
    }
  }

  public static async deleteFeature(id: number) {
    try {
      try {
        await Features.query().where('id', id).delete()
      } catch (err) {
        await NftFeatureMap.query().where('feature_id', id).delete()
        await Features.query().where('id', id).delete()
      }
      return { delete: true }
    } catch (e) {
      console.log('HHHHHHHH', e)
      return false
    }
  }
  public static async getAllNftOfFeature(id: number) {
    try {
      const res = await NftFeatureMap.query().select().where('feature_id', id)
      return res
    } catch (e) {
      return false
    }
  }
  public static async setAllNftOfFeature(id: number, nfts: number[]) {
    try {
      await NftFeatureMap.query().delete().where('feature_id', id)
      let toAdd = nfts.map((nft) => {
        return { nft_id: nft, feature_id: id }
      })
      const res = await NftFeatureMap.createMany(toAdd)
      return res
    } catch (e) {
      return false
    }
  }
  public static async getAllFeature() {
    try {
      const res = await Features.query()

      return res
    } catch (e) {
      return false
    }
  }

  public static async addNFT(
    contractAddress: string,
    title: string,
    description: string,
    taxon: string,
    url: string,
    imageLink: string
  ) {
    try {
      const res = await Nfts.create({
        // contractSddress:contractAddress,
        contract_address: contractAddress,
        title,
        description,
        taxon,
        url,
        image_link: imageLink,
      })
      return res
    } catch (e) {
      // console.log
      return false
    }
  }

  public static async updateNFT(
    id: number,
    contract_address: string,
    title: string,
    description: string,
    taxon: string,
    url: string,
    image_link: string
  ) {
    try {
      const res = await Nfts.updateOrCreate(
        { id },
        { contract_address, title, description, taxon, url, image_link }
      )
      return res
    } catch (e) {
      // console.log
      return false
    }
  }

  public static async deleteNFT(id: number) {
    try {
      await Nfts.query().where('id', id).delete()
      return { delete: true }
    } catch (e) {
      // console.log
      return false
    }
  }

  public static async getAllNFTS() {
    try {
      const res = await Nfts.query()
      // res.delete();
      return res
    } catch (e) {
      return false
    }
  }
  public static async getAllFeatures() {
    try {
      const res = await Features.query()
      // res.delete();
      return res
    } catch (e) {
      return false
    }
  }

  public static async AllNfts(addressA: string, network: string) {
    console.log(network)
    const NETWORK = await GetAllConfigs()
    let address = addressA
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }

    const { data: res } = await axios.post(NETWORK.MAIN, {
      method: 'account_nfts',
      params: [
        {
          account: address,
          ledger_index: 'validated',
        },
      ],
    })

    if (res.result.account_nfts) {
      const getAllNfts = res.result.account_nfts.map(async (nft: any) =>
        Promise.resolve(this.getIPFSMetadata(nft))
      )

      const resolve = await Promise.all(getAllNfts)

      return resolve
    }
    return { msg: 'No NFTS Found' }
  }
  public static async getAllHoldings(addressA: string) {
    const NETWORK = await GetAllConfigs()
    const client = new xrpl.Client(NETWORK.WALLET)
    try {
      await client.connect()

      // const request = {
      //     command: 'account_info',
      //     account: addressA,
      //     ledger_index: 'validated'
      // };
      // const response = await client.request(request);
      const existingBalance = await client.getBalances(addressA)

      return existingBalance
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      await client.disconnect()
    }
  }
  public static async verifyAddress(address: string) {
    const NETWORK = await GetAllConfigs()
    const client = new xrpl.Client(NETWORK.WALLET) // Testnet server
    let result = {}
    try {
      await client.connect()

      const accountInfo = await client.request({
        command: 'account_info',
        account: address,
      })

      if (accountInfo) {
        console.log('The address is active on the XRP testnet.', accountInfo)
        result['active'] = true
        result['isValid'] = true
      } else {
        console.log('The address is not active on the XRP testnet.')
        result['active'] = false
        result['isValid'] = true
      }
    } catch (error) {
      console.error('Error occurred:', error)
      result['active'] = false
      result['isValid'] = false
    } finally {
      await client.disconnect()
    }
    return result
  }

  public static async verify(addressA: string, network: string) {
    const NETWORK = await GetAllConfigs()
    let address = addressA
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }
    console.log(network, NETWORK)

    const internalNFTs = await SupportedNft.query()

    const authUser = await User.firstOrCreate(
      {
        address: address,
      },
      {}
    )
    await authUser.load('subscriptions', (q) => {
      q.where('expires_at', '>', new Date())
    })

    return {
      nfts: internalNFTs.map((nft) => ({
        address,
        contract_address: nft.contract_address,
        image: nft?.image_link,
        taxon: nft.taxon,
        feature: nft.feature,
        rule: nft.rule,
      })),
    }
  }
  public static extractWalletAddress = (inputString: string) => {
    // Define a regular expression pattern to match XRPL addresses
    const addressRegex = /@([a-zA-Z0-9]{25,34})/

    // Use the RegExp.exec method to find the address in the input string
    const match = addressRegex.exec(inputString)

    // Check if a match was found and extract the address
    if (match && match[1]) {
      return match[1]
    }
    // Return null if no address was found
    return null
  }

  public static async enabledNfts(addressA: string, network: string) {
    const NETWORKS = await GetAllConfigs()
    let address = this.extractWalletAddress(addressA)

    console.log(network)
    // if (address.length !== 34) {
    //   const externalUser = await UserExternalId.query()
    //     .where('user_id', address)
    //     .where('auth_provider', 'oidc-xumm')
    //     .firstOrFail()
    //   address = externalUser.externalId
    // }
    // console.log("UUUUUUUUUU");
    const { data: res } = await axios.post(NETWORKS.MAIN, {
      method: 'account_nfts',
      params: [
        {
          account: address,
          ledger_index: 'validated',
        },
      ],
    })
    console.log('GGGGGG', res)

    // if (res.result?.error) return { msg: 'Invalid Account' }
    let internalNFTs: any = []

    // if (res.result.account_nfts) {
    //   internalNFTs = await SupportedNft.query()
    //     .whereIn(
    //       'contract_address',
    //       res.result.account_nfts.map((nft) => nft.Issuer)
    //     )
    //     .whereIn(
    //       'taxon',
    //       res.result.account_nfts.map((nft) => nft.NFTokenTaxon)
    //     )
    // }
    const authUser = await User.firstOrCreate(
      {
        address: address ? address : '',
      },
      {}
    )
    let allNFTSS: any = {}
    // console.log(res.result.account_nfts.map((nft) => nft.Issuer))
    const alwayEnabledNfts = await SupportedNft.query().whereIn('rule', ['always_enabled'])
    const features = await Features.query().whereIn('rules', ['always_enabled', 'nft_enabled'])
    let allFeaturesWithKey: any = {}
    let mappings: any = []
    let allNftsWithKey: any = {}

    for (const f of features) {
      const maps = await NftFeatureMap.query().where('feature_id', f.id)
      mappings = [...mappings, ...maps]
      allFeaturesWithKey[f.id] = f
    }

    for (const m of mappings) {
      const data = await Nfts.query().where('id', m.nft_id)
      allNftsWithKey[data[0].id] = data[0]
    }

    for (const m of mappings) {
      const data = {
        feature: [allFeaturesWithKey[m.feature_id].feature],
        name: allNftsWithKey[m.nft_id].title,
        taxon: allNftsWithKey[m.nft_id].taxon,
        image: allNftsWithKey[m.nft_id].image_link,
        url: allNftsWithKey[m.nft_id].url,
        rules: allFeaturesWithKey[m.feature_id].rules,
        contract_address: allNftsWithKey[m.nft_id].contract_address,
      }
      if (allNFTSS[m.nft_id]?.feature) {
        allNFTSS[m.nft_id] = {
          ...data,
          feature: [...allNFTSS[m.nft_id].feature, ...data.feature],
        }
      } else {
        allNFTSS[m.nft_id] = data
      }
    }
    // for (const m of Object.keys(allNFTSS)) {
    //   nftss = [...nftss, allNFTSS[m]]
    // }
    // console.log(allNFTSS)

    if (alwayEnabledNfts.length > 0) {
      internalNFTs = [...internalNFTs, ...alwayEnabledNfts]
    }
    await authUser.load('subscriptions', (q) => {
      q.where('expires_at', '>', new Date())
    })

    return {
      nfts: Object.keys(allNFTSS).map((items) => {
        return allNFTSS[items]
      }),
    }
  }

  public async check({ request, response }: HttpContextContract) {
    const verified = await NFTController.verify(
      request.param('address'),
      request.param('network', 'main')
    )
    // const service = request.param('service')
    // response.abortIf(verified === undefined, 'Something went wrong', 500)
    // if (service) {
    //   response.abortUnless(
    //     verified?.nfts?.find((nft) => nft[service] === true),
    //     'Unauthorised',
    //     403
    //   )
    // }
    return response.json(verified)
  }
}
