/**
 * Contract source: https://git.io/JOdiQ
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */
import { XummOauthDriverConfig, XummOauthDriverContract } from 'App/Ally/Drivers/XummOauthDriver'

declare module '@ioc:Adonis/Addons/Ally' {
  interface SocialProviders {
    google: {
      config: GoogleDriverConfig
      implementation: GoogleDriverContract
    }
    twitter: {
      config: TwitterDriverConfig
      implementation: TwitterDriverContract
    }
    discord: {
      config: DiscordDriverConfig
      implementation: DiscordDriverContract
    }
    facebook: {
      config: FacebookDriverConfig
      implementation: FacebookDriverContract
    }
    xumm: {
      config: XummOauthDriverConfig
      implementation: XummOauthDriverContract
    }
  }
}
