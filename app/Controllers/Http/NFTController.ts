import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import axios from 'axios'
import SupportedNft from 'App/Models/SupportedNft'
import UserExternalId from 'App/Models/UserExternalId'
import User from 'App/Models/User'

export enum NETWORKS {
  MAIN = 'https://xrplcluster.com',
  DEV = 'https://s.devnet.rippletest.net:51234',
  TEST = 'https://testnet.xrpl-labs.com',
}

export default class NFTController {
  public static async verifyHolding(
    address: string,
    service: string,
    network: string | null
  ): Promise<boolean> {
    const verified = await NFTController.verify(address, network || 'main')
    return !!verified?.nfts?.find((nft) => nft[service] === true)
  }

  public static async verify(addressA: string, network: string) {
    let address = addressA
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }
    console.log('address', address)
    const { data: res } = await axios.post(NETWORKS[network.toUpperCase()], {
      method: 'account_nfts',
      params: [
        {
          account: address,
          ledger_index: 'validated',
        },
      ],
    })
    if (res.result?.error) return undefined
    const internalNFTs = await SupportedNft.query()
      .whereIn(
        'contract_address',
        res.result.account_nfts.map((nft) => nft.Issuer)
      )
      .whereIn(
        'taxon',
        res.result.account_nfts.map((nft) => nft.NFTokenTaxon)
      )
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
      address,
      nfts: internalNFTs.map((nft) => ({
        contract_address: nft.contract_address,
        image_link: nft?.image_link,
        NFTokenID: res.result.account_nfts.find(
          // eslint-disable-next-line eqeqeq
          (nf) => nf.Issuer === nft.contract_address && nf.NFTokenTaxon == nft.taxon
        ),

        discord: nft.features.includes('discord'),
        twitter: nft.features.includes('twitter'),
        twilio: nft.features.includes('twilio') && authUser.subscriptions.length > 0,
        dark_mode: nft.features.includes('dark_mode'),
      })),
    }
  }

  public async check({ request, response }: HttpContextContract) {
    const verified = await NFTController.verify(
      request.param('address'),
      request.param('network', 'main')
    )
    const service = request.param('service')
    response.abortIf(verified === undefined, 'Something went wrong', 500)
    if (service) {
      response.abortUnless(
        verified?.nfts?.find((nft) => nft[service] === true),
        'Unauthorised',
        403
      )
    }
    return response.json(verified)
  }
}
