import config from '../config'
import TokenService from './token-service'
import IdleService from './idle-service'
const ThingApiService = {
  getThings() {
    return fetch(`${config.API_ENDPOINT}/things`, {
      headers: {
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  getThing(thingId) {
    return fetch(`${config.API_ENDPOINT}/things/${thingId}`, {
      headers: {
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  getThingReviews(thingId) {
    return fetch(`${config.API_ENDPOINT}/things/${thingId}/reviews`, {
      headers: {
        'authorization': `bearer ${TokenService.getAuthToken()}`,
      },
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  postReview(thingId, text, rating) {
    return fetch(`${config.API_ENDPOINT}/reviews`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${TokenService.getAuthToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        thing_id: thingId,
        rating,
        text,
      }),
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  postUser(user) {
    return fetch(`${config.API_ENDPOINT}/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(user),
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
  },
  postLogin({ user_name, password }) {
    return fetch(`${config.API_ENDPOINT}/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ user_name, password }),
    })
      .then(res =>
        (!res.ok)
          ? res.json().then(e => Promise.reject(e))
          : res.json()
      )
      .then(res => {
        /*
          whenever a logint is performed:
          1. save the token in local storage
          2. queue auto logout when the user goes idle
          3. queue a call to the refresh endpoint based on the JWT's exp value
        */
        TokenService.saveAuthToken(res.authToken)
        IdleService.regiserIdleTimerResets()
        TokenService.queueCallbackBeforeExpiry(() => {
          ThingApiService.postRefreshToken()
        })
        return res
      })
  },
  postRefreshToken() {
    return fetch(`${config.API_ENDPOINT}/auth/refresh`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${TokenService.getAuthToken()}`,
      },
    })
    .then(res =>
      (!res.ok)
        ? res.json().then(e => Promise.reject(e))
        : res.json()
    )
    .then(res => {
      /*
        similar logic to whenever a user logs in, the only differences are:
        - we don't need to queue the idle timers again as the user is already logged in.
        - we'll catch the error here as this refresh is happening behind the scenes
      */
      TokenService.saveAuthToken(res.authToken)
      TokenService.queueCallbackBeforeExpiry(() => {
        ThingApiService.postRefreshToken()
      })
      return res
    })
    .catch(err => {
      console.log('refresh token request error')
      console.error(err)
    })
  },
  
}

export default ThingApiService
