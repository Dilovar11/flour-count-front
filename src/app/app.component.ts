import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CameraComponent } from './camera/camera.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CameraComponent],
  template: `<app-camera></app-camera>`,
})
export class AppComponent {
  title = 'flour-bag-count-front';
}
