import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { IngresoEgreso } from './ingreso-egreso.model';
import { AuthService } from '../auth/auth.service';
import { Store } from '@ngrx/store';
import { AppState } from '../app.reducer';
import { filter, map } from 'rxjs/operators';
import { SetItemsActions, UnsetItemsAction } from './ingreso-egreso.actions';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IngresoEgresoService {
  ingresoEgresoListenerSubs: Subscription = new Subscription();
  ingresoEgresoItemsSubs: Subscription = new Subscription();

  constructor(
    private afDB: AngularFirestore,
    private authService: AuthService,
    private store: Store<AppState>
  ) {}

  crearIngresoEgreso(ingresoEgreso: IngresoEgreso) {
    const user = this.authService.getUsuario();
    return this.afDB
      .doc(`${user.uid}/ingresos-egresos`)
      .collection('items')
      .add({ ...ingresoEgreso });
  }

  initIngresoEgresoListener() {
    this.ingresoEgresoListenerSubs = this.store
      .select('auth')
      .pipe(filter((auth) => auth.user != null))
      .subscribe((auth) => {
        this.ingresoEgresoItems(auth.user.uid);
      });
  }

  cancelarSubscriptions() {
    this.ingresoEgresoListenerSubs.unsubscribe();
    this.ingresoEgresoItemsSubs.unsubscribe();
    this.store.dispatch(new UnsetItemsAction());
  }

  private ingresoEgresoItems(uid: string) {
    this.ingresoEgresoItemsSubs = this.afDB
      .collection(`${uid}/ingresos-egresos/items`)
      .snapshotChanges()
      .pipe(
        map((docData) => {
          return docData.map((doc: any) => {
            return {
              uid: doc.payload.doc.id,
              ...doc.payload.doc.data(),
            };
          });
        })
      )
      .subscribe((coleccion: any) => {
        console.log(coleccion);

        this.store.dispatch(new SetItemsActions(coleccion));
      });
  }


  borrarItem(uid){
    const user = this.authService.getUsuario();
    return this.afDB.doc(`${user.uid}/ingresos-egresos/items/${uid}`).delete();
  }
}
