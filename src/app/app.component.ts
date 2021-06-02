import { Component } from '@angular/core';
import { saveAs } from 'file-saver';

import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'laser-eyes';

  file: File = null;
  ready: boolean = false;
  glows: string[] = ['red','blue','pink','white','yellow','purple','green','glow'];

  async ngOnInit() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('assets/models');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri('assets/models');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('assets/models');
    this.ready = true;
  }

  async blockFaces(confidence: number, mask: string) {
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
      let source = document.createElement("img");
      source.src = "assets/images/" + mask + ".png";
      input.src = url;
      input.onload = async function () {
        output.width = input.width;
        output.height = input.height;
        const detections = await faceapi.detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: confidence })).withFaceLandmarks(true);
        context.drawImage(input, 0, 0);
        context.fillStyle = "#000000";
        console.log(detections.length);
        detections.sort((a, b) => {return a.detection.box.area - b.detection.box.area});
        detections.forEach(d => {
          let left = getCenter(d.landmarks.getLeftEye());
          let right = getCenter(d.landmarks.getRightEye());
          let width = d.detection.box.width;
          context.drawImage(source, left.x - width, left.y - width, width*2, width*2);
          context.drawImage(source, right.x - width, right.y - width, width*2, width*2);
          
        });
        //faceapi.draw.drawFaceLandmarks(output, detections);
        //faceapi.draw.drawDetections(output, detections);
        let dl = document.getElementById('download');
        dl.hidden = false;
        URL.revokeObjectURL(input.src);
      }
    }
  }

  async handleFileInput(files: FileList, confidence: number, mask: string) {
    if (files) {
      this.hideDownloadButton();
      this.file = files.item(0);
      this.blockFaces(confidence, mask);
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
    let filename = "masked_" + this.file.name;
    let output = <HTMLCanvasElement>document.getElementById('overlay');
    var image = output.toDataURL(filetype);
    saveAs(image, filename);
  }
}

function getCenter(array: faceapi.Point[]) {
  let x = array.reduce((acc, v) => acc + v.x / array.length, 0);
  let y = array.reduce((acc, v) => acc + v.y / array.length, 0);
  return {
    x, 
    y
  };
}

