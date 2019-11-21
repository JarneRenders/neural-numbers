import {
  Paint
} from './Paint.js';

import {
  View
} from './View.js';

import {
  MnistData
} from './MnistData.js';

import {
  NeuralNetwork
} from './NeuralNetwork.js';

import {
  ValidationPreview
} from './ValidationPreview.js';

export class Controller {
  constructor() {
    this.view = new View(this);
    this.data = new MnistData();
    this.vp = new ValidationPreview(this.data);
    this.nn = new NeuralNetwork(this.vp);
  }

  async initPaint(drawcanvas, normalizecanvas, output) {
    const model = await tf.loadLayersModel('assets/models/my-model.json');
    this.paint = new Paint(drawcanvas, normalizecanvas, output, model);
  }

  cleanupPaint() {
    this.paint.cleanup();
  }

  async loadData() {
    await this.data.load();
  }

  async initTraining(els) {
    await this.vp.initValidationImages(els);
    this.nn.train(this.data);
  }

  pauseTraining() {
    this.nn.training = false;
  }

  async toggleTraining() {
    this.nn.toggleTraining();
    if (this.nn.training)
      this.nn.train(this.data); //TODO offset
  }
}
