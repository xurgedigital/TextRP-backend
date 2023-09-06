import Features from 'App/Models/Features'

export default class FeaturesController {
  public static async getAllFeatures() {
    console.log('featrues')

    const featureList = await Features.query()

    return { featureList }
  }
}
