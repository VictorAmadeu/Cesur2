import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonInput, IonItem, IonButton, IonCheckbox } from "@ionic/angular/standalone";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { EntregasRepository } from 'src/app/services/database-movil/repositories/entregas_local.repository';
import { ExpedienteLocalRepository } from 'src/app/services/database-movil/repositories/expedientes_local.repository';
import { ExpedientesRepository } from 'src/app/services/database-movil/repositories/expedientes_detalle_local.repository';
import { RutaLocalRepository } from 'src/app/services/database-movil/repositories/rutas_local.repository';
import { UrgenciasRepository } from 'src/app/services/database-movil/repositories/urgencias_local.repository';
import { UsuarioRepository } from 'src/app/services/database-movil/repositories/usuario.repository';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [ReactiveFormsModule, IonContent, IonHeader, IonInput, IonItem, IonButton, IonCheckbox ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent implements OnInit {
    form: FormGroup;
  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
    private entregasLocal: EntregasRepository,
    private expedienteDetalleLocal: ExpedientesRepository,
    private expedienteLocal: ExpedienteLocalRepository,
    private rutaLocalRepository:RutaLocalRepository,
    private urgenciasRepository:UrgenciasRepository,
    private usuarioRepository:UsuarioRepository
  ) {
      this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      this.form.patchValue({ username: savedUsername });
      this.form.get('rememberMe')?.setValue(true);
    }

    // this.deleteAll()
  }

  // async deleteAll(){
  //   try {
  //     await this.entregasLocal.clear()
  //     await this.expedienteDetalleLocal.clear()
  //     await this.expedienteLocal.clear()
  //     await this.rutaLocalRepository.clear()
  //     await this.urgenciasRepository.clear()
  //     await this.usuarioRepository.clear()  
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  async onSubmit() {
    if (this.form.valid) {
      const { username, password, rememberMe} = this.form.value;
      try {
        await this.authService.login(username, password, rememberMe);
        this.toastService.show('Inicio de sesión exitoso', 'success');
        this.router.navigate(['/privado/rutas']);
      } catch (error: any) {
        this.toastService.show('Verificar usuario y contraseña', 'danger');
      }
    } else {
      this.form.markAllAsTouched();
      this.toastService.show(
        'Por favor complete todos los campos',
        'warning'
      );
    }
  }
}
