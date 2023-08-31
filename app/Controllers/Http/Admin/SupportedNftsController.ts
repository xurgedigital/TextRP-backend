/* eslint-disable prettier/prettier */
// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SupportedNft from 'App/Models/SupportedNft'
import axios from 'axios'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'
import { convertHexToString } from 'xrpl'

export default class SupportedNftsController {
  public async index({ request, response }: HttpContextContract) {
    const { title, description, taxon }: Partial<SupportedNft> = request.qs()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const query = SupportedNft.query()
    if (title) {
      query.where('title', 'LIKE', '%' + title + '%')
    }
    if (description) {
      query.where('description', 'LIKE', '%' + description + '%')
    }
    if (taxon) {
      query.where('taxon', 'LIKE', '%' + taxon + '%')
    }
    const users = await query.paginate(page, limit)
    users.baseUrl('/admin/supported_nfts')
    return response.json(users)
  }

  public async create({ request, response }: HttpContextContract) {
    const updateUserSchema = schema.create({
      title: schema.string.optional(),
      description: schema.string.optional(),
      contract_address: schema.string.optional(),
      // features: schema.array().members(schema.string()),
      feature: schema.string(),
      url: schema.string.optional(),
      rule: schema.string(),
      taxon: schema.string.optional(),
      image_link: schema.string.optional(),
    })

    const payload = await request.validate({ schema: updateUserSchema })

    if (payload.url) {
      // eslint-disable-next-line no-debugger

      const nftId = payload.url.split('/nft/')[1]

      const getNftFromURL: any = await axios.post('https://s1.ripple.com:51234/', {
        method: 'nft_info',
        params: [
          {
            nft_id: nftId,
          },
        ],
      })

      console.log(getNftFromURL.data.result)
      if (getNftFromURL.data.result.uri) {
        const hexToString = convertHexToString(getNftFromURL.data.result.uri)
        const uriString = hexToString.includes('ipfs://') && hexToString.split('ipfs://')[1]

        const nftData: any = await axios.get(
          hexToString.includes('ipfs://') ? `https://ipfs.io/ipfs/${uriString}` : hexToString
        )
        console.log(uriString, hexToString)
        console.log('iamge', nftData.data)

        const imageURI = `https://ipfs.io/ipfs/${nftData.data.image.split('ipfs://')[1]}`

        const user = await SupportedNft.create({
          title: nftData.data.name,
          description: nftData.data.description,
          contract_address: getNftFromURL.data.result.issuer,
          // features: schema.array().members(schema.string()),
          feature: payload.feature,
          url: payload.url,
          rule: payload.rule,
          taxon: getNftFromURL.data.nft_taxon,
          image_link: imageURI,
        })
        return response.json(user)
      } else {
        return response.status(400).json(getNftFromURL.data.result.error_message)
      }
    }

    // const user = await SupportedNft.create({
    //   ...payload,
    // })
    // return response.json(user)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, user: SupportedNft) {
    const updateUserSchema = schema.create({
      title: schema.string(),
      description: schema.string(),
      contract_address: schema.string(),
      features: schema.array().members(schema.string()),
      taxon: schema.string(),
      image_link: schema.string.optional(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge({
      ...payload,
      features: JSON.stringify(payload.features),
    })
    await user.save()
    return response.json(user)
  }

  @bind()
  public async delete({ response }: HttpContextContract, user: SupportedNft) {
    await user.delete()
    return response.status(200)
  }
}
