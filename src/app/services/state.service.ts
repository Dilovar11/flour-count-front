import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private readonly KEY = 'cycle_state';

  save(state: {
    newCycle: any,
    selected_camera: any,
    selected_data: any,
    activeCycle: boolean,
    creatingCycle: boolean
  }): void {
    localStorage.setItem(this.KEY, JSON.stringify(state));
  }

  load(): {
    newCycle: any,
    selected_camera: any,
    selected_data: any,
    activeCycle: boolean,
    creatingCycle: boolean
  } | null {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
  }
}
