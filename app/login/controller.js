import Controller from '@ember/controller';
import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';


export default Controller.extend({
  session: service(),
  openNP: false,

  login(email, password) {
    this.session
      .authenticate('authenticator:application', email, password)
      .catch((err)=> {
        let message;
        const statusCode = err.status;

        if(!navigator.onLine){
          message = 'Überprüfen Sie ihre Internetverbindung';
        }

        if(!message) {
          switch (statusCode) {
            case 400:
              message = 'Ungültige Logindaten';
              break;
            case 401:
              message = 'Ungültige Logindaten';
              break;
            case 404:
              message = 'Ungültige Logindaten';
              break;
            case 500:
              message = 'Ein Serverfehler ist aufgetreten';
              break;
            default:
              message = 'Login fehlgeschlagen';
              break;
          }
        }
        this.notifications.warning(message)
      });
  },

  actions: {
    submit(model) {
      this.login(get(model, 'email'), get(model, 'password'));
    },

    open() {
      set(this, 'openNP', true);
    }
  }
});
