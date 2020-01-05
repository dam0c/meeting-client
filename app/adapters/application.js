import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';
import ENV from 'meeting-client/config/environment';

const {
  APP: {
    api: {
      host,
      apiNamespace
    }
  }
} = ENV;

export default JSONAPIAdapter.extend(DataAdapterMixin,{
  host,
  namespace: apiNamespace,

  authorize(xhr) {
    const { id, code, access_token } = this.get('session.data.authenticated');
    const accessToken = id || code || access_token;

    xhr.setRequestHeader('Authorization', accessToken);
  },
});
