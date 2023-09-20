import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import axios from 'axios'
import { RippleAPI } from 'ripple-lib'
import SupportedNft from 'App/Models/SupportedNft'
import UserExternalId from 'App/Models/UserExternalId'
import User from 'App/Models/User'
import { convertHexToString } from 'xrpl'

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

  public static async AllNfts(addressA: string, network: string) {
    let address = addressA
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }

    const { data: res } = await axios.post(NETWORKS[network.toUpperCase()], {
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
  public static async verifyAddress(address: string) {
    // const { RippleAPI } = require('ripple-lib');

    // // Create a RippleAPI instance and connect to the XRP Ledger Testnet server
    const api = new RippleAPI({
      //   server: 'wss://s1.ripple.com', // Use the mainnet server or a testnet server
      server: 'wss://s.altnet.rippletest.net:51233', // Ripple Testnet server
    })
    // // Replace with the wallet address you want to check
    // const accountAddress = 'r4A7yTguEqq1XUZ8eaq4DyKeyZGGmngY74';
    let result = {}
    //     const rippleCodec = require('ripple-address-codec');

    // function isValidXrpAddress(address) {
    //   try {
    //     return rippleCodec.isValidClassicAddress(address);
    //   } catch (error) {
    //     return false;
    //   }
    // }

    // // Example usage:
    // const walletAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';

    // if (isValidXrpAddress(walletAddress)) {
    //   console.log('The XRP wallet address is valid.');
    // } else {
    //   console.log('The XRP wallet address is invalid.');
    // }

    // // Connect to the XRP Ledger Testnet server
    await api.connect().then(async () => {
      try {
        // Fetch the transaction history for the account
        const transactions = await api.getTransactions(address, {
          limit: 1, // You can adjust the limit as needed
        })
        // console.log("LLLLLLLLL", transactions);
        // Check if the account has any transaction history
        if (transactions.length > 0) {
          result['active'] = true
        } else {
          result['active'] = false
        }
      } catch (error) {
        result['active'] = false
      }
      try {
        // Fetch account info
        const accountInfo = await api.getAccountInfo(address)

        if (accountInfo) {
          result['isValid'] = true
        } else result['isValid'] = false
      } catch (error) {
        result['isValid'] = false
      } finally {
        // Disconnect from the XRP Ledger Testnet server
        api.disconnect()
      }
    })
    return result
  }
  // get available nfts

  public static async verify(addressA: string, network: string) {
    let address = addressA
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }
    // console.log('address', address)
    console.log(NETWORKS[network.toUpperCase()])

    // const { data: res } = await axios.post(NETWORKS[network.toUpperCase()], {
    //   method: 'account_nfts',
    //   params: [
    //     {
    //       account: address,
    //       ledger_index: 'validated',
    //     },
    //   ],
    // })
    // console.log(res.result)

    // if (res.result?.error) return undefined
    const internalNFTs = await SupportedNft.query()
    // .whereIn(
    //   'contract_address',
    //   res.result.account_nfts.map((nft) => nft.Issuer)
    // )
    // .whereIn(
    //   'taxon',
    //   res.result.account_nfts.map((nft) => nft.NFTokenTaxon)
    // )
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

  public static async enabledNfts(addressA: string, network: string) {
    let address = addressA
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }

    console.log(NETWORKS[network.toUpperCase()])

    const { data: res } = await axios.post(NETWORKS[network.toUpperCase()], {
      method: 'account_nfts',
      params: [
        {
          account: address,
          ledger_index: 'validated',
        },
      ],
    })
    // if (res.result?.error) return { msg: 'Invalid Account' }
    let internalNFTs: any = []
    if (res.result.account_nfts) {
      internalNFTs = await SupportedNft.query()
        .whereIn(
          'contract_address',
          res.result.account_nfts.map((nft) => nft.Issuer)
        )
        .whereIn(
          'taxon',
          res.result.account_nfts.map((nft) => nft.NFTokenTaxon)
        )
    }
    const authUser = await User.firstOrCreate(
      {
        address: address,
      },
      {}
    )

    // console.log(res.result.account_nfts.map((nft) => nft.Issuer))
    const alwayEnabledNfts = await SupportedNft.query().whereIn('rule', ['always_enabled'])

    if (alwayEnabledNfts.length > 0) {
      internalNFTs = [...internalNFTs, ...alwayEnabledNfts]
    }
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
