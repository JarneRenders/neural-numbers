/* jshint esversion: 8*/

export class NeuralNetwork {
  constructor(vp, els) {
    this.els = els;
    this.vp = vp;
    this.createModel();
    this.training = true;
  }

  toggleTraining(data) {
    this.training = !this.training;
    if (this.training) {
      this.train(data);
    }
  }

  createModel() {
    //TODO: once UI is finished
    const modelid = "dense"; //TODO document.getElementById("modelid").value;
    const model = this.model = tf.sequential();

    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const IMAGE_CHANNELS = 1;

    if (modelid == "cnn") {
      //CNN
      // In the first layer of our convolutional neural network we have
      // to specify the input shape. Then we specify some parameters for
      // the convolution operation that takes place in this layer.
      model.add(tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
      }));

      // The MaxPooling layer acts as a sort of downsampling using max values
      // in a region instead of averaging.
      model.add(tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2]
      }));

      // Repeat another conv2d + maxPooling stack.
      // Note that we have more filters in the convolution.
      model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: 16,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
      }));
      model.add(tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2]
      }));

      // Now we flatten the output from the 2D filters into a 1D vector to prepare
      // it for input into our last layer. This is common practice when feeding
      // higher dimensional data to a final classification output layer.
      model.add(tf.layers.flatten());
    } else if (modelid == "dense") {
      model.add(
        tf.layers.flatten({
          inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS]
        })
      );

      model.add(tf.layers.dense({
        units: 100,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
      }));
    } else if (modelid == "nohidden") {
      model.add(
        tf.layers.flatten({
          inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS]
        })
      );
    }

    // Our last layer is a dense layer which has 10 output units, one for each
    // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
    const NUM_OUTPUT_CLASSES = 10;
    model.add(tf.layers.dense({
      units: NUM_OUTPUT_CLASSES,
      kernelInitializer: 'varianceScaling',
      activation: 'softmax'
    }));

    const learningRate = 0.001; //TODO Math.pow(10, document.getElementById('learningrate').value);

    // Choose an optimizer, loss function and accuracy metric,
    // then compile and return the model
    const optimizer =
      //TODO document.getElementById('optimizer').value == "adam" ? tf.train.adam(learningRate) : tf.train.sgd(learningRate);
      tf.train.adam(learningRate);

    model.compile({
      optimizer: optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  async train(data) {
    const model = this.model;
    let trainingcallcnt = 0;
    let trainXs, trainYs;

    while (this.training) {
      const BATCH_SIZE = 32; //document.getElementById("BATCH_SIZE").value | 0;
      //const TRAIN_DATA_SIZE = 5500;
      const TRAIN_DATA_SIZE = BATCH_SIZE * 16;

      [trainXs, trainYs] = tf.tidy(() => {
        const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
        return [
          d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
          d.labels
        ];
      });

      await model.fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        //validationData: [testXs, testYs],
        //epochs: 1,
        //shuffle: true,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            this.vp.updateValidationImages(this.model);
            this.vp.updateAccuracy(this.model);
          },
          onBatchEnd: async (batch, logs) => {
            this.els.trainingAccuracy.innerHTML = `Accuracy on current training data: ${(logs.acc * 1000 | 0)/10}%`;
            this.els.trainingProgress.innerHTML = `${trainingcallcnt*TRAIN_DATA_SIZE +batch*BATCH_SIZE} images used for training.`;
          }
        }
      });
      trainingcallcnt++;
    }
  }

  cleanup() {
    this.model.dispose();
  }
}