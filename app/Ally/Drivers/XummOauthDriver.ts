/*
|--------------------------------------------------------------------------
| Ally Oauth driver
|--------------------------------------------------------------------------
|
| This is a dummy implementation of the Oauth driver. Make sure you
|
| - Got through every line of code
| - Read every comment
|
*/

import type { AllyUserContract, AllyDriverContract } from '@ioc:Adonis/Addons/Ally'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Oauth2Driver, ApiRequest } from '@adonisjs/ally/build/standalone'

/**
 * Define the access token object properties in this type. It
 * must have "token" and "type" and you are free to add
 * more properties.
 *
 * ------------------------------------------------
 * Change "XummOauthDriver" to something more relevant
 * ------------------------------------------------
 */
export type XummOauthDriverAccessToken = {
  token: string
  type: 'bearer'
}

/**
 * Define a union of scopes your driver accepts. Here's an example of same
 * https://github.com/adonisjs/ally/blob/develop/adonis-typings/ally.ts#L236-L268
 *
 * ------------------------------------------------
 * Change "XummOauthDriver" to something more relevant
 * ------------------------------------------------
 */
export type XummOauthDriverScopes = string

/**
 * Define the configuration options accepted by your driver. It must have the following
 * properties and you are free add more.
 *
 * ------------------------------------------------
 * Change "XummOauthDriver" to something more relevant
 * ------------------------------------------------
 */
export type XummOauthDriverConfig = {
  driver: 'xumm'
  clientId: string
  clientSecret: string
  callbackUrl: string
  authorizeUrl?: string
  accessTokenUrl?: string
  userInfoUrl?: string
}

export interface XummOauthDriverContract
  extends AllyDriverContract<XummOauthDriverAccessToken, XummOauthDriverScopes> {}
/**
 * Driver implementation. It is mostly configuration driven except the user calls
 *
 * ------------------------------------------------
 * Change "XummOauthDriver" to something more relevant
 * ------------------------------------------------
 */
export class XummOauthDriver extends Oauth2Driver<
  XummOauthDriverAccessToken,
  XummOauthDriverScopes
> {
  public async user(
    _callback: ((_request: ApiRequest) => void) | undefined
  ): Promise<AllyUserContract<XummOauthDriverAccessToken>> {
    const token = await this.getCode()
    const request = this.getAuthenticatedRequest(this.config.userInfoUrl || this.userInfoUrl, token)
    const body = await request.get()
    return {
      id: body.sub,
      name: body.name,
      nickName: body.account,
      token: {
        token: token || '',
        type: 'bearer',
      },
      email: body.email,
      avatarUrl: body.picture,
      emailVerificationState: 'unsupported',
      original: body,
    }
  }

  public async userFromToken(
    token: string,
    _callback: ((request: ApiRequest) => void) | undefined
  ): Promise<AllyUserContract<{ token: string; type: 'bearer' }>> {
    const request = this.getAuthenticatedRequest(this.config.userInfoUrl || this.userInfoUrl, token)
    const body = await request.get()
    return {
      id: body.sub,
      name: body.name,
      nickName: body.account,
      token: {
        token: token || '',
        type: 'bearer',
      },
      email: body.email,
      avatarUrl: body.picture,
      emailVerificationState: 'unsupported',
      original: body,
    }
  }
  /**
   * The URL for the redirect request. The user will be redirected on this page
   * to authorize the request.
   *
   * Do not define query strings in this URL.
   */
  protected authorizeUrl = 'https://oauth2.xumm.app/auth'

  /**
   * The URL to hit to exchange the authorization code for the access token
   *
   * Do not define query strings in this URL.
   */
  protected accessTokenUrl = 'https://oauth2.xumm.app/token'

  /**
   * The URL to hit to get the user details
   *
   * Do not define query strings in this URL.
   */
  protected userInfoUrl = 'https://oauth2.xumm.app/userinfo'

  /**
   * The param name for the authorization code. Read the documentation of your oauth
   * provider and update the param name to match the query string field name in
   * which the oauth provider sends the authorization_code post redirect.
   */
  protected codeParamName = 'access_token'

  /**
   * The param name for the error. Read the documentation of your oauth provider and update
   * the param name to match the query string field name in which the oauth provider sends
   * the error post redirect
   */
  protected errorParamName = 'error'

  /**
   * Cookie name for storing the CSRF token. Make sure it is always unique. So a better
   * approach is to prefix the oauth provider name to `oauth_state` value. For example:
   * For example: "facebook_oauth_state"
   */
  protected stateCookieName = 'xumm_oauth_state'

  /**
   * Parameter name to be used for sending and receiving the state from.
   * Read the documentation of your oauth provider and update the param
   * name to match the query string used by the provider for exchanging
   * the state.
   */
  protected stateParamName = 'state'
  /**
   * Parameter name for sending the scopes to the oauth provider.
   */
  protected scopeParamName = 'scope'

  /**
   * The separator indentifier for defining multiple scopes
   */
  protected scopesSeparator = ' '

  constructor(ctx: HttpContextContract, public config: XummOauthDriverConfig) {
    super(ctx, config)
    this.isStateless = true
    /**
     * Extremely important to call the following method to clear the
     * state set by the redirect request.
     *
     * DO NOT REMOVE THE FOLLOWING LINE
     */
    this.loadState()
  }

  /**
   * Optionally configure the authorization redirect request. The actual request
   * is made by the base implementation of "Oauth2" driver and this is a
   * hook to pre-configure the request.
   */
  // protected configureRedirectRequest(request: RedirectRequest<XummOauthDriverScopes>) {}

  /**
   * Optionally configure the access token request. The actual request is made by
   * the base implementation of "Oauth2" driver and this is a hook to pre-configure
   * the request
   */
  // protected configureAccessTokenRequest(request: ApiRequest) {}

  /**
   * Update the implementation to tell if the error received during redirect
   * means "ACCESS DENIED".
   */
  public accessDenied() {
    return this.ctx.request.input('error') === 'user_denied'
  }

  private getAuthenticatedRequest(url, token) {
    const request = this.httpClient(url)
    request.header('Authorization', `Bearer ${token}`)
    request.header('Accept', 'application/json')
    request.parseAs('json')
    return request
  }
  /**
   * Get the user details by query the provider API. This method must return
   * the access token and the user details both. Checkout the google
   * implementation for same.
   *
   * https://github.com/adonisjs/ally/blob/develop/src/Drivers/Google/index.ts#L191-L199
   */
  // public async user(
  //   callback?: (request: ApiRequest) => void
  // ): Promise<AllyUserContract<XummOauthDriverAccessToken>> {
  //   const accessToken = await this.accessToken()
  //   const request = this.httpClient(this.config.userInfoUrl || this.userInfoUrl)
  //
  //   /**
  //    * Allow end user to configure the request. This should be called after your custom
  //    * configuration, so that the user can override them (if required)
  //    */
  //   if (typeof callback === 'function') {
  //     callback(request)
  //   }
  //
  //   /**
  //    * Write your implementation details here
  //    */
  // }

  // public async userFromToken(
  //   accessToken: string,
  //   callback?: (request: ApiRequest) => void
  // ): Promise<AllyUserContract<{ token: string; type: 'bearer' }>> {
  //   const request = this.httpClient(this.config.userInfoUrl || this.userInfoUrl)
  //
  //   /**
  //    * Allow end user to configure the request. This should be called after your custom
  //    * configuration, so that the user can override them (if required)
  //    */
  //   if (typeof callback === 'function') {
  //     callback(request)
  //   }
  //
  //   /**
  //    * Write your implementation details here
  //    */
  // }
}
