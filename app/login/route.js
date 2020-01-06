import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Route.extend({
  session: service(),

  beforeModel(/* transition */) {
    console.log(get(this,'session'))
    if (get(this, 'session.isAuthenticated')) {
      this.transitionTo('meeting');
    }
  },

  model(){
    return {
      email: '',
      password: ''
    }
  }
});
