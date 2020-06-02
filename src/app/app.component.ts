import { Component } from '@angular/core';
import { saveAs } from 'file-saver';
import { MatSlider } from '@angular/material/slider'

// per https://github.com/justadudewhohacks/face-api.js/issues/519#issuecomment-578485852
//import * as faceapi from 'face-api.js';
//import { TNetInput } from 'face-api.js';
declare var faceapi:any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'face-block';

  file: File = null;
  ready: boolean = false;

  async ngOnInit() {
    await faceapi.loadTinyFaceDetectorModel('assets/models');
    await faceapi.loadSsdMobilenetv1Model('assets/models');
    this.ready = true;
  }

  async blockFaces(confidence: number) {
    if (this.file) {
      this.hideDownloadButton();
      let output = <HTMLCanvasElement>document.getElementById('overlay');
      let context = output.getContext("2d");
      output.width = 600;
      output.height = 40;
      context.fillStyle = "#FFA500";
      context.fillText("processing...", 10, 10);
      let input = document.createElement("img");
      let url = window.URL.createObjectURL(this.file);
      input.src = url;
      input.onload = async function () {
        output.width = input.width;
        output.height = input.height;
        const detections = await faceapi.detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: confidence }));
        context.drawImage(input, 0, 0);
        context.fillStyle = "#000000";
        console.log(detections.length);
        detections.forEach(d =>
          context.fillRect(d.box.x - d.box.width * .1, d.box.y - d.box.height * .1, d.box.width * 1.2, d.box.height * 1.2)
        );
        let dl = document.getElementById('download');
        dl.hidden = false;
        URL.revokeObjectURL(input.src);
      }
    }
  }

  async handleFileInput(files: FileList, confidence: number) {
    if (files) {
      this.hideDownloadButton();
      this.file = files.item(0);
      this.blockFaces(confidence);
    }
  }

  hideDownloadButton() {
    let dl = document.getElementById('download');
    dl.hidden = true;
  }

  exportAsImage() {
    if (this.file == null) {
      return;
    }
    let filetype = this.file.type;
    let filename = "censored_" + this.file.name;
    let output = <HTMLCanvasElement>document.getElementById('overlay');
    var image = output.toDataURL(filetype);
    saveAs(image, filename);
  }
}
