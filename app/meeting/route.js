import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default Route.extend({
  model() {
    const store = this.store;

    return hash({
      meetings: store.findAll('meeting')
    })

  }

});
