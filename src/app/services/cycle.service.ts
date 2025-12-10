import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';

export interface CameraDataDto {
  rtsp: string;
  brandId: number;
  typeId: number;
  sortId: number;
  count: number
}

export interface CreateCycleDto {
  name: string;
  cameraData: CameraDataDto[];
  total: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: Boolean
}

@Injectable({
  providedIn: 'root'
})
export class CycleService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  private apiUrl = 'http://localhost:3000/cycles';

  constructor(private http: HttpClient) { }

  reload() {
    this.refresh$.next();
  }

  getCycles() {
    return this.refresh$.pipe(
      switchMap(() => this.http.get<any[]>(this.apiUrl))
    );
  }

  getCycle(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createCycle(dto: CreateCycleDto): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  deleteCycle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateCount(dto: CreateCycleDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-count`, dto);
  }

}
