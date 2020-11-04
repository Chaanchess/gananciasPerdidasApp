import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { map } from 'rxjs/operators';
import { User } from './user.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { Store } from '@ngrx/store';
import { AppState } from '../app.reducer';
import {
  ActivarLoadingAction,
  DesctivarLoadingAction,
} from '../shared/ui.accions';
import { SetUserAction, UnsetUserAction } from './auth.accions';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userSubscription: Subscription = new Subscription();
  private usuario: User;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private afDB: AngularFirestore,
    private store: Store<AppState>
  ) {}

  initAuthListener() {
    this.userSubscription = this.afAuth.authState.subscribe((usuario) => {
      if (usuario) {
        this.afDB
          .doc(`${usuario.uid}/usuario`)
          .valueChanges()
          .subscribe((userObj: any) => {
            console.log(userObj);

            const newUser = new User(userObj);
            this.store.dispatch(new SetUserAction(newUser));
            this.usuario = newUser;
          });
      } else {
        this.usuario = null;
        this.userSubscription.unsubscribe();
      }
    });
  }

  crearUsuario(nombre, email, password) {
    this.store.dispatch(new ActivarLoadingAction());

    this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((res) => {
        const user: User = {
          uid: res.user.uid,
          nombre: nombre,
          email: res.user.email,
        };

        this.afDB
          .doc(`${user.uid}/usuario`)
          .set(user)
          .then(() => {
            this.router.navigate(['/']);
            this.store.dispatch(new DesctivarLoadingAction());
          });
      })
      .catch((error) => {
        console.error(error);
        this.store.dispatch(new DesctivarLoadingAction());

        Swal.fire('No se ha podido registrar', error.message, 'error');
      });
  }

  login(email, password) {
    this.store.dispatch(new ActivarLoadingAction());

    this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((res) => {
        this.router.navigate(['/']);
        this.store.dispatch(new DesctivarLoadingAction());
      })
      .catch((err) => {
        console.error('Credenciales incorrectas: ', err);
        this.store.dispatch(new DesctivarLoadingAction());
        Swal.fire('No se ha podido acceder', err.message, 'error');
      });
  }

  logout() {
    this.router.navigate(['/login']);

    this.afAuth.signOut();

    this.store.dispatch(new UnsetUserAction());
  }

  isAuth() {
    return this.afAuth.authState.pipe(
      map((usuario) => {
        if (usuario == null) {
          this.router.navigate(['/login']);
        }

        return usuario != null;
      })
    );
  }

  getUsuario() {
    return {...this.usuario};
  }
}
