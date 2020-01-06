import BaseAuthenticator from 'ember-simple-auth/authenticators/base';
import { isEmpty } from '@ember/utils';
import { run } from '@ember/runloop';
import { Promise, all } from 'rsvp';
import { assign } from '@ember/polyfills';
import fetch from 'fetch';
import ENV from 'meeting-client/config/environment';

const {
  APP: {
    api: {
      host,
      apiNamespace
    }
  }
} = ENV;

/**
 Authenticator that works with Loopback's default authentication

 @class LoopbackAuthenticator
 @module ember-simple-auth-loopback/authenticators/loopback
 @extends BaseAuthenticator
 @public
 */
export default BaseAuthenticator.extend({
  /**
   The endpoint on the server that authentication and token refresh requests
   are sent to.

   @property loginEndpoint
   @type String
   @default '/token'
   @public
   */
  loginEndpoint: host + '/' + apiNamespace + '/users/login',

  /**
   The endpoint on the server that token revocation requests are sent to. Only
   set this if the server actually supports token revokation. If this is
   `null`, the authenticator will not revoke tokens on session invalidation.

   __If token revocation is enabled but fails, session invalidation will be
   intercepted and the session will remain authenticated (see
   {{#crossLink "OAuth2PasswordGrantAuthenticator/invalidate:method"}}{{/crossLink}}).__

   @property logoutEndpoint
   @type String
   @default null
   @public
   */
  logoutEndpoint: host + '/' + apiNamespace + '/users/logout',

  /**
   Restores the session from a session data object; __will return a resolving
   promise when there is a non-empty `id` in the session data__ and
   a rejecting promise otherwise.

   @method restore
   @param {Object} data The data to restore the session from
   @return {Promise} A promise that when it resolves results in the session becoming or remaining authenticated
   @public
   */
  restore(data) {
    return new Promise((resolve, reject) => {
      if (isEmpty(data['id'])) {
        reject();
      } else {
        resolve(data);
      }
    });
  },

  /**
   Authenticates the session with the specified `username`, and `password`;
   issues a `POST` request to the loginEndpoint.

   __If the credentials are valid and thus authentication succeeds,
   a promise that resolves with the server's response is returned__,
   otherwise a promise that rejects with the
   error as returned by the server is returned.

   @method authenticate
   @param {String} username The resource owner username
   @param {String} password The resource owner password
   @return {Promise} A promise that when it resolves results in the session becoming authenticated
   @public
   */
  authenticate(email, password) {
    return new Promise((resolve, reject) => {
      const data = { email, password };
      const loginEndpoint = this.loginEndpoint;

      this.makeRequest(loginEndpoint, data).then((response) => {
        run(() => {
          resolve(response);
        });
      }, (error) => {
        run(null, reject, error);
      });
    });
  },

  /**
   If token revocation is enabled, this will revoke the access token (and the
   refresh token if present). If token revocation succeeds, this method
   returns a resolving promise, otherwise it will return a rejecting promise,
   thus intercepting session invalidation.

   If token revocation is not enabled this method simply returns a resolving
   promise.

   @method invalidate
   @param {Object} data The current authenticated session data
   @return {Promise} A promise that when it resolves results in the session being invalidated
   @public
   */
  invalidate(data) {
    const logoutEndpoint = this.logoutEndpoint;
    function success(resolve) {
      run.cancel(this._refreshTokenTimeout);
      delete this._refreshTokenTimeout;
      resolve();
    }
    return new Promise((resolve) => {
      if (isEmpty(logoutEndpoint)) {
        success.apply(this, [resolve]);
      } else {
        const requests = [];
        ['id'].forEach((tokenType) => {
          const token = data[tokenType];
          if (!isEmpty(token)) {
            requests.push(this.makeRequest(logoutEndpoint, {
              'token_type_hint': tokenType, token
            }, {
              'Authorization': token
            }));
          }
        });
        const succeed = () => {
          success.apply(this, [resolve]);
        };
        all(requests).then(succeed, succeed);
      }
    });
  },

  /**
   * Makes a request to the OAuth 2.0 server.
   *
   @method makeRequest
   @param {Object} url Server endpoint
   @param {Object} data Object that will be sent to server
   @param {Object} headers Additional headers that will be sent to server
   @private
   */
  makeRequest(url, data, headers) {
    return new Promise((resolve, reject) => {
      return fetch(url, {
        method: 'POST',
        headers: assign({
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }, headers),
        body: JSON.stringify(data)
      }).then(response => {
        const res = {
          statusText: response.statusText,
          status: response.status,
          headers: response.headers
        };

        response.text().then(text => {
          res.text = text;
          try {
            res.json = JSON.parse(text);
          } catch (e) {
            return reject(res);
          }

          if (response.ok) {
            resolve(res.json);
          } else {
            reject(res);
          }
        }).catch(() => reject(res));
      }).catch(reject);
    });
  }
});
