let video;
let audio;
let fft;
let trailLayer;
let prevPixels = null;
let colorLevel = 0;

const MOTION_STEP = 6;
const MOTION_THRESHOLD = 28;
const SOUND_VOLUME_THRESHOLD = 0.012;
const SOUND_SPECTRAL_THRESHOLD = 24;

function getTrailColor(normalizedLevel) {
  let level = constrain(normalizedLevel, 0, 1);

  if (level < 0.33) {
    return [255, 120, 40]; // Rosso/arancio
  }
  if (level < 0.66) {
    return [80, 230, 120]; // Verde
  }
  return [170, 90, 255]; // Viola
}

function setup() {
  createCanvas(500, 400);
  video = createCapture(VIDEO);
  video.size(500, 400);
  video.hide();

  audio = new p5.AudioIn();
  audio.start();

  fft = new p5.FFT(0.8, 1024);
  fft.setInput(audio);

  trailLayer = createGraphics(width, height);
  trailLayer.clear();
  
  background(0); // Sfondo iniziale nero
}

function draw() {
  background(0);
  let volume = audio.getLevel();
  fft.analyze();

  let bass = fft.getEnergy("bass");
  let mids = fft.getEnergy("mid");
  let highs = fft.getEnergy("treble");

  // Ancora più sensibilità a medi/alti per attivare più facilmente verde e viola.
  let weightedBands = bass * 0.15 + mids * 1.25 + highs * 1.65;
  let normalizedBands = weightedBands / (255 * (0.15 + 1.25 + 1.65));
  let bandBoost = constrain(normalizedBands * 1.5, 0, 1);
  let volumeBoost = map(constrain(volume, 0, 0.12), 0, 0.12, 0, 0.55);
  let targetColorLevel = constrain(bandBoost + volumeBoost, 0, 1);
  colorLevel = lerp(colorLevel, targetColorLevel, 0.25);

  // La scia si imprime solo quando c'è davvero suono (volume o medi/alti sopra soglia).
  let spectralActivity = (mids + highs) * 0.5;
  let hasSound = volume > SOUND_VOLUME_THRESHOLD || spectralActivity > SOUND_SPECTRAL_THRESHOLD;

  // Mostriamo il video in trasparenza come riferimento e poi la scia persistente.
  tint(255, 40);
  image(video, 0, 0, width, height);
  noTint();

  video.loadPixels();
  if (video.pixels.length > 0) {
    if (prevPixels && hasSound) {
      let trailColor = getTrailColor(colorLevel);

      trailLayer.noStroke();
      trailLayer.fill(trailColor[0], trailColor[1], trailColor[2], 170);

      // Scriviamo sul layer solo dove rileviamo movimento.
      for (let y = 0; y < video.height; y += MOTION_STEP) {
        for (let x = 0; x < video.width; x += MOTION_STEP) {
          let idx = (x + y * video.width) * 4;

          let currLuma = (video.pixels[idx] + video.pixels[idx + 1] + video.pixels[idx + 2]) / 3;
          let prevLuma = (prevPixels[idx] + prevPixels[idx + 1] + prevPixels[idx + 2]) / 3;

          if (abs(currLuma - prevLuma) > MOTION_THRESHOLD) {
            trailLayer.rect(x, y, MOTION_STEP, MOTION_STEP);
          }
        }
      }
    }

    prevPixels = video.pixels.slice();
  }

  image(trailLayer, 0, 0, width, height);

  // Più il volume sale, più riduciamo e ri-ingrandiamo il frame per pixelarlo.
  let pixelFactor = floor(map(constrain(volume, 0, 0.25), 0, 0.25, 1, 30));
  if (pixelFactor > 1) {
    let smallW = max(1, floor(width / pixelFactor));
    let smallH = max(1, floor(height / pixelFactor));

    noSmooth();
    copy(0, 0, width, height, 0, 0, smallW, smallH);
    copy(0, 0, smallW, smallH, 0, 0, width, height);
  } else {
    smooth();
  }

  smooth();
}

function keyPressed() {
  if (key === 's') {
    saveCanvas('ghosting_effect', 'png');
  }
  // Premendo 'c' pulisci lo schermo se diventa troppo caotico
  if (key === 'c') {
    background(0);
    trailLayer.clear();
  }
}