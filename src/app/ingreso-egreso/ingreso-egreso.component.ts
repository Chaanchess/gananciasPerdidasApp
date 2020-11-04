import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IngresoEgreso } from './ingreso-egreso.model';
import { IngresoEgresoService } from './ingreso-egreso.service';
import Swal from 'sweetalert2';
import { Store } from '@ngrx/store';
import { AppState } from '../app.reducer';
import { Subscription } from 'rxjs';
import { ActivarLoadingAction, DesctivarLoadingAction } from '../shared/ui.accions';

@Component({
  selector: 'app-ingreso-egreso',
  templateUrl: './ingreso-egreso.component.html',
  styles: [],
})
export class IngresoEgresoComponent implements OnInit, OnDestroy {
  formulario: FormGroup;
  tipo = 'ingreso';
  loadingSubs: Subscription = new Subscription();
  cargando: boolean;

  constructor(
    private ingrEgreService: IngresoEgresoService,
    private store: Store<AppState>
  ) {}

  ngOnInit() {

    this.loadingSubs = this.store.select('ui').subscribe(ui=>{
      this.cargando = ui.isLoading;
    });

    this.formulario = new FormGroup({
      descripcion: new FormControl('', Validators.required),
      monto: new FormControl(
        0,
        Validators.compose([Validators.min(0), Validators.required])
      ),
    });
  }

  crearIngresoEgreso() {
    this.store.dispatch(new ActivarLoadingAction());
    const ingresoEgreso = new IngresoEgreso({
      ...this.formulario.value,
      tipo: this.tipo,
    });

    this.ingrEgreService.crearIngresoEgreso(ingresoEgreso).then(() => {
      this.store.dispatch(new DesctivarLoadingAction());
      Swal.fire('Creado', ingresoEgreso.descripcion, 'success');
      this.formulario.reset({
        monto: 0,
      });
    });
  }

  ngOnDestroy(){
    this.loadingSubs.unsubscribe();
  }
}
