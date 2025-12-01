import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { CycleService, CreateCycleDto, CameraDataDto } from '../services/cycle.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BrandService } from '../services/brand.service';
import { SortService } from '../services/sort.service';
import { TypeService } from '../services/type.service';
import { CameraService } from '../services/camera.service';
import { StateService } from '../services/state.service';



@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './camera.component.html',
})
export class CameraComponent implements OnInit, OnDestroy {
  constructor(
    private cycleService: CycleService,
    private brandService: BrandService,
    private sortService: SortService,
    private typeService: TypeService,
    private cameraService: CameraService,
    private stateService: StateService
  ) { }

  allCycles = toSignal(this.cycleService.getCycles(), { initialValue: [] });
  allBrands = toSignal(this.brandService.getAll(), { initialValue: [] })
  allSorts = toSignal(this.sortService.getAll(), { initialValue: [] })
  allTypes = toSignal(this.typeService.getAll(), { initialValue: [] })
  allCameras = toSignal(this.cameraService.getAll(), { initialValue: [] })


  ws!: WebSocket;
  activeCycle = false;
  creatingCycle = false;
  cyclesTableState: { [cycleId: number]: boolean } = {};

  newCycle = {
    selectedCameras: [] as CameraDataDto[],
    cycleName: '',
    startTime: '' as any,
    endTime: '' as any,
    duration: ''
  }
  selected_camera = {
    rtsp: [] as string[],
    count: [] as number[]
  }
  selected_data = {
    brandId: 1,
    typeId: 1,
    sortId: 1,
  };

  get totalBags() {
    return this.newCycle.selectedCameras.reduce((sum, cam) => sum + cam.count, 0);
  }

  ngOnInit() {
    const saved = this.stateService.load();
    if (saved) {
      this.newCycle = saved.newCycle;
      this.selected_camera = saved.selected_camera;
      this.selected_data = saved.selected_data;
      this.activeCycle = saved.activeCycle;
      this.creatingCycle = saved.creatingCycle;
    }
    
    this.connectWS();
    this.startRealTimeClock();
  }

  ngOnDestroy() {
    //this.ws?.close();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    this.autoSave();
  }

  connectWS() {
    this.ws = new WebSocket('ws://localhost:8000');

    this.ws.onopen = () => console.log('Connected to Python WS!');
    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      const cam = this.newCycle.selectedCameras.find(c => String(c.rtsp) === String(data.camera));
      //console.log('WS camera:', data.camera);
      //console.log('Selected cameras:', this.newCycle.selectedCameras.map(c => c.rtsp));
      //console.log("cam =", cam);

      if (cam) cam.count = data.count;
      this.newCycle.selectedCameras = [...this.newCycle.selectedCameras];
      if (this.activeCycle) {
        this.newCycle.duration = this.getDuration(this.newCycle.startTime, new Date());
      }
    };
    this.ws.onclose = () => {
      console.log('WS closed. Reconnecting...');
      setTimeout(() => this.connectWS(), 2000);
    };
    this.ws.onerror = (err) => console.error('WS error', err);
  }


  restoreWebSocket() {
    this.ws = new WebSocket("ws://localhost:8000");
    this.ws.onopen = () => {
      console.log("WS reconnected");
      // Восстанавливаем подписки камер
      for (let cam of this.newCycle.selectedCameras) {
        this.ws.send(JSON.stringify({ action: 'start', camera: cam.rtsp }));
      }
    };
  }

  showCreateCycle() {
    this.creatingCycle = true;
  }

  cancelCreateCycle() {
    this.creatingCycle = false;
    this.newCycle.cycleName = '';
  }

  startCycle() {
    this.activeCycle = true;
    this.newCycle.startTime = new Date();
    this.newCycle.selectedCameras = this.buildSelectedCameras();
    for (let camera of this.newCycle.selectedCameras) {
      this.ws.send(JSON.stringify({ action: 'start', camera: camera.rtsp }));
    }
  }

  stopCycle() {
    this.createCycle();
    this.creatingCycle = false;
    this.activeCycle = false;
    this.newCycle.cycleName = '';
    this.newCycle.duration = '';
    for (let camera of this.newCycle.selectedCameras) {
      this.ws.send(JSON.stringify({ action: 'stop', camera: camera.rtsp }));
    }
  }

  startRealTimeClock() {
    this.newCycle.startTime = new Date();
  }


  getDuration(startTime: Date, endTime: Date) {
    if (!startTime) return '0с';

    const diff = endTime.getTime() - startTime.getTime(); // разница в миллисекундах

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${hours ? hours + 'ч ' : ''}${minutes ? minutes + 'м ' : ''}${seconds}с`.trim();
  }

  createCycle() {
    this.newCycle.endTime = new Date();


    const dto: CreateCycleDto = {
      name: this.newCycle.cycleName,
      total: this.totalBags.toString(),
      cameraData: this.newCycle.selectedCameras,
      startTime: this.newCycle.startTime.toISOString(),
      endTime: this.newCycle.endTime.toISOString(),
      duration: this.getDuration(this.newCycle.startTime, this.newCycle.endTime)
    };

    this.cycleService.createCycle(dto).subscribe({
      next: (res) =>  this.cycleService.reload(),
      error: (err) => console.error('Error creating cycle', err)
    });
  }

  openCameraDropdown = false;

  toggleCamera(ip: string, event: any) {
    if (event.target.checked) {
      this.selected_camera.rtsp.push(ip);
    } else {
      this.selected_camera.rtsp = this.selected_camera.rtsp.filter(c => c !== ip);
    }
  }

  buildSelectedCameras(): CameraDataDto[] {
    return this.selected_camera.rtsp.map((rtsp, i) => ({
      rtsp,
      ...this.selected_data,
      count: this.selected_camera.count[i] ?? 0
    }));
  }

  autoSave() {
    this.stateService.save({
      newCycle: this.newCycle,
      selected_camera: this.selected_camera,
      selected_data: this.selected_data,
      activeCycle: this.activeCycle,
      creatingCycle: this.creatingCycle
    });
  }


}
