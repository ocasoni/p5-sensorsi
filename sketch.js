let video;
let audio;
let fft;

function setup() {
  createCanvas(500, 400);
  video = createCapture(VIDEO);
  video.size(500, 400);
  video.hide();

  audio = new p5.AudioIn();
  audio.start();

  fft = new p5.FFT();
  fft.setInput(audio);
  
  background(0); // Sfondo iniziale nero
}

function draw() {
  // --- LOGICA DEL GHOSTING ---
  // Invece di background(0), disegniamo un rettangolo nero semitrasparente.
  // Più il valore alpha (l'ultimo numero) è basso, più la scia sarà lunga.
  fill(0, 20); 
  rect(0, 0, width, height);

  let volume = audio.getLevel();
  fft.analyze();

  // Estraiamo le frequenze
  let bass = fft.getEnergy("bass");
  let mids = fft.getEnergy("mid");
  let highs = fft.getEnergy("treble");

  // Calcoliamo un colore basato sulle frequenze (HSB è più fluido per i gradienti)
  colorMode(HSB, 360, 100, 100, 100);
  
  // Mappiamo le frequenze su una tonalità (Hue)
  // Bassi -> Rosso/Arancio, Medi -> Verde, Alti -> Blu/Viola
  let dynamicHue = map(bass, 0, 255, 0, 360);
  let ghostAlpha = map(volume, 0, 0.2, 10, 100); // Più volume = scia più visibile

  // Applichiamo il colore al video
  // Il video apparirà solo dove c'è movimento o dove la tinta è applicata
  tint(dynamicHue, 80, 100, ghostAlpha);

  // --- EFFETTO DINAMICO ---
  // Se i bassi sono forti, l'immagine "trema" o si ingrandisce leggermente
  let zoom = map(bass, 150, 255, 0, 20);
  
  image(video, -zoom/2, -zoom/2, width + zoom, height + zoom);

  // Riportiamo la modalità colore a RGB per altre eventuali funzioni
  colorMode(RGB, 255);
  noTint();
}

function keyPressed() {
  if (key === 's') {
    saveCanvas('ghosting_effect', 'png');
  }
  // Premendo 'c' pulisci lo schermo se diventa troppo caotico
  if (key === 'c') {
    background(0);
  }
}