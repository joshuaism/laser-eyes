import { Component, Output } from '@angular/core';

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

  fileToUpload: File = null;

  async ngOnInit() {
    await faceapi.loadTinyFaceDetectorModel('assets/models');
    await faceapi.loadSsdMobilenetv1Model('assets/models');
  }

  async blockFaces(input : HTMLImageElement) {
    input.onload = async function() {
      let output = <HTMLCanvasElement>document.getElementById('overlay');
      let context = output.getContext("2d");
      output.width = input.width;
      output.height = input.height;
      //const detections = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions());
      const detections = await faceapi.detectAllFaces(input);
      context.drawImage(input, 0, 0);
      detections.forEach( d =>
        context.fillRect(d.box.x, d.box.y, d.box.width, d.box.height)
      );
      URL.revokeObjectURL(input.src);
    }
  }

  async handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
    let input = document.createElement("img");
    let url = window.URL.createObjectURL(this.fileToUpload);
    input.src = url;
    this.blockFaces(input);
  }
}
