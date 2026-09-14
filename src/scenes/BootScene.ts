import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Generate procedural textures programmatically to guarantee 100% offline self-containment
    this.createPlayerTexture();
    this.createItemTextures();
    this.createStationTextures();
    this.createCustomerTexture();
    this.createParticleTextures();
  }

  create() {
    this.scene.start('ShopScene');
    this.scene.start('UIScene');
  }

  private createPlayerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;

    // Soft ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(24, 42, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - saffron kurta
    ctx.fillStyle = '#e65100'; // Saffron orange
    ctx.beginPath();
    ctx.roundRect(14, 18, 20, 22, [6, 6, 4, 4]);
    ctx.fill();

    // White festive chef apron
    ctx.fillStyle = '#fff8e1';
    ctx.beginPath();
    ctx.roundRect(17, 21, 14, 16, [3, 3, 2, 2]);
    ctx.fill();

    // Red sash/border
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(17, 29, 14, 3);

    // Head
    ctx.fillStyle = '#ffcc80'; // Warm skin tone
    ctx.beginPath();
    ctx.arc(24, 14, 8, 0, Math.PI * 2);
    ctx.fill();

    // Traditional red topi/cap
    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.ellipse(24, 9, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(22, 6, 4, 4);

    this.textures.addCanvas('player', canvas);
  }

  private createItemTextures() {
    // 1. Recipe Bundle (Jute sack with jaggery & coconut)
    const bundleCanvas = document.createElement('canvas');
    bundleCanvas.width = 36;
    bundleCanvas.height = 36;
    const bCtx = bundleCanvas.getContext('2d')!;

    bCtx.fillStyle = '#8d6e63'; // Jute brown
    bCtx.beginPath();
    bCtx.roundRect(6, 10, 24, 22, 6);
    bCtx.fill();

    // Tied rope
    bCtx.fillStyle = '#ffb300';
    bCtx.fillRect(6, 16, 24, 3);

    // Flour crest / symbol
    bCtx.fillStyle = '#ffffff';
    bCtx.beginPath();
    bCtx.arc(18, 24, 4, 0, Math.PI * 2);
    bCtx.fill();

    this.textures.addCanvas('item_bundle', bundleCanvas);

    // 2. Cooked Batch (Steamed modaks on brass plate)
    const batchCanvas = document.createElement('canvas');
    batchCanvas.width = 36;
    batchCanvas.height = 36;
    const mCtx = batchCanvas.getContext('2d')!;

    // Golden brass thali
    mCtx.fillStyle = '#fbc02d';
    mCtx.beginPath();
    mCtx.arc(18, 20, 14, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.strokeStyle = '#f57f17';
    mCtx.lineWidth = 2;
    mCtx.stroke();

    // Steamed white & saffron modaks
    const drawModak = (x: number, y: number) => {
      mCtx.fillStyle = '#fffde7';
      mCtx.beginPath();
      mCtx.moveTo(x, y - 6);
      mCtx.quadraticCurveTo(x + 5, y + 2, x, y + 4);
      mCtx.quadraticCurveTo(x - 5, y + 2, x, y - 6);
      mCtx.fill();
      // Kesar (saffron) dot
      mCtx.fillStyle = '#ff6f00';
      mCtx.fillRect(x - 1, y - 4, 2, 2);
    };

    drawModak(18, 17);
    drawModak(13, 21);
    drawModak(23, 21);

    this.textures.addCanvas('item_batch', batchCanvas);

    // 3. Packed Modak Box (Festive red & gold box)
    const boxCanvas = document.createElement('canvas');
    boxCanvas.width = 36;
    boxCanvas.height = 36;
    const boxCtx = boxCanvas.getContext('2d')!;

    boxCtx.fillStyle = '#c2185b'; // Festive crimson
    boxCtx.beginPath();
    boxCtx.roundRect(5, 7, 26, 22, 4);
    boxCtx.fill();

    // Golden ribbon cross
    boxCtx.fillStyle = '#ffd54f';
    boxCtx.fillRect(16, 7, 4, 22);
    boxCtx.fillRect(5, 16, 26, 4);

    // Golden corner ornament
    boxCtx.fillStyle = '#fff9c4';
    boxCtx.beginPath();
    boxCtx.arc(18, 18, 3, 0, Math.PI * 2);
    boxCtx.fill();

    this.textures.addCanvas('item_box', boxCanvas);

    // 4. Coin
    const coinCanvas = document.createElement('canvas');
    coinCanvas.width = 24;
    coinCanvas.height = 24;
    const cCtx = coinCanvas.getContext('2d')!;

    cCtx.fillStyle = '#ffb300';
    cCtx.beginPath();
    cCtx.arc(12, 12, 10, 0, Math.PI * 2);
    cCtx.fill();

    cCtx.strokeStyle = '#ffe082';
    cCtx.lineWidth = 2;
    cCtx.beginPath();
    cCtx.arc(12, 12, 8, 0, Math.PI * 2);
    cCtx.stroke();

    cCtx.fillStyle = '#5d4037';
    cCtx.font = 'bold 10px sans-serif';
    cCtx.textAlign = 'center';
    cCtx.textBaseline = 'middle';
    cCtx.fillText('₹', 12, 12);

    this.textures.addCanvas('coin', coinCanvas);
  }

  private createStationTextures() {
    // Ingredient Station (Storage Shelf)
    const shelfCanvas = document.createElement('canvas');
    shelfCanvas.width = 80;
    shelfCanvas.height = 64;
    const sCtx = shelfCanvas.getContext('2d')!;

    sCtx.fillStyle = '#5d4037'; // Dark wood
    sCtx.beginPath();
    sCtx.roundRect(6, 8, 68, 50, 6);
    sCtx.fill();

    // Shelves
    sCtx.fillStyle = '#8d6e63';
    sCtx.fillRect(10, 24, 60, 6);
    sCtx.fillRect(10, 42, 60, 6);

    // Jars and sacks
    sCtx.fillStyle = '#ffecb3'; // Flour sack
    sCtx.fillRect(14, 12, 14, 12);
    sCtx.fillStyle = '#6d4c41'; // Jaggery pot
    sCtx.fillRect(34, 12, 12, 12);
    sCtx.fillStyle = '#fff9c4'; // Coconut basket
    sCtx.fillRect(52, 12, 14, 12);

    this.textures.addCanvas('station_ingredient', shelfCanvas);

    // Steamer Station (Traditional Brass Ukadiche Steamer)
    const steamerCanvas = document.createElement('canvas');
    steamerCanvas.width = 80;
    steamerCanvas.height = 64;
    const stCtx = steamerCanvas.getContext('2d')!;

    // Stove platform
    stCtx.fillStyle = '#37474f';
    stCtx.beginPath();
    stCtx.roundRect(10, 14, 60, 44, 8);
    stCtx.fill();

    // Brass steamer pot
    stCtx.fillStyle = '#fbc02d';
    stCtx.beginPath();
    stCtx.arc(40, 36, 18, 0, Math.PI * 2);
    stCtx.fill();

    // Brass handles
    stCtx.fillStyle = '#f57f17';
    stCtx.fillRect(18, 33, 4, 6);
    stCtx.fillRect(58, 33, 4, 6);

    // Pot lid knob
    stCtx.fillStyle = '#d84315';
    stCtx.beginPath();
    stCtx.arc(40, 36, 6, 0, Math.PI * 2);
    stCtx.fill();

    this.textures.addCanvas('station_steamer', steamerCanvas);

    // Packing Station (Wooden Packaging Table)
    const packCanvas = document.createElement('canvas');
    packCanvas.width = 80;
    packCanvas.height = 64;
    const pCtx = packCanvas.getContext('2d')!;

    pCtx.fillStyle = '#795548';
    pCtx.beginPath();
    pCtx.roundRect(8, 10, 64, 48, 6);
    pCtx.fill();

    // Work surface highlight
    pCtx.fillStyle = '#a1887f';
    pCtx.fillRect(12, 14, 56, 40);

    // Packing tape & decorative paper
    pCtx.fillStyle = '#ff8f00';
    pCtx.fillRect(16, 20, 14, 10);
    pCtx.fillStyle = '#ad1457';
    pCtx.fillRect(36, 26, 24, 20);

    this.textures.addCanvas('station_packing', packCanvas);

    // Locked Steamer 2 Station (Blueprint / Padlock)
    const lockedSteamerCanvas = document.createElement('canvas');
    lockedSteamerCanvas.width = 80;
    lockedSteamerCanvas.height = 64;
    const lsCtx = lockedSteamerCanvas.getContext('2d')!;

    lsCtx.fillStyle = '#263238';
    lsCtx.beginPath();
    lsCtx.roundRect(10, 14, 60, 44, 8);
    lsCtx.fill();
    lsCtx.strokeStyle = '#546e7a';
    lsCtx.lineWidth = 2;
    lsCtx.stroke();

    // Padlock body
    lsCtx.fillStyle = '#ffb300';
    lsCtx.beginPath();
    lsCtx.roundRect(30, 32, 20, 16, 4);
    lsCtx.fill();
    // Shackle
    lsCtx.strokeStyle = '#ffd54f';
    lsCtx.lineWidth = 3;
    lsCtx.beginPath();
    lsCtx.arc(40, 32, 7, Math.PI, 0, false);
    lsCtx.stroke();

    this.textures.addCanvas('station_steamer_locked', lockedSteamerCanvas);

    // Upgrade Station (Mahal Office / Desk)
    const upCanvas = document.createElement('canvas');
    upCanvas.width = 90;
    upCanvas.height = 64;
    const upCtx = upCanvas.getContext('2d')!;

    // Desk wood
    upCtx.fillStyle = '#3e2723';
    upCtx.beginPath();
    upCtx.roundRect(6, 12, 78, 46, 6);
    upCtx.fill();
    upCtx.fillStyle = '#5d4037';
    upCtx.fillRect(10, 16, 70, 36);

    // Ledger book & brass bell
    upCtx.fillStyle = '#fff9c4';
    upCtx.fillRect(16, 22, 22, 16);
    upCtx.fillStyle = '#d84315';
    upCtx.fillRect(26, 22, 2, 16);

    // Brass bell
    upCtx.fillStyle = '#ffd54f';
    upCtx.beginPath();
    upCtx.arc(58, 30, 8, 0, Math.PI * 2);
    upCtx.fill();

    this.textures.addCanvas('station_upgrade', upCanvas);

    // Diya (Brass Lamp with Flame)
    const diyaCanvas = document.createElement('canvas');
    diyaCanvas.width = 24;
    diyaCanvas.height = 24;
    const dCtx = diyaCanvas.getContext('2d')!;
    dCtx.fillStyle = '#ffb300';
    dCtx.beginPath();
    dCtx.ellipse(12, 16, 8, 4, 0, 0, Math.PI * 2);
    dCtx.fill();
    // Warm flame
    dCtx.fillStyle = '#ff5722';
    dCtx.beginPath();
    dCtx.moveTo(12, 6);
    dCtx.quadraticCurveTo(15, 12, 12, 14);
    dCtx.quadraticCurveTo(9, 12, 12, 6);
    dCtx.fill();
    dCtx.fillStyle = '#ffeb3b';
    dCtx.beginPath();
    dCtx.arc(12, 11, 2, 0, Math.PI * 2);
    dCtx.fill();
    this.textures.addCanvas('diya', diyaCanvas);

    // Staff Packer Texture
    const packerCanvas = document.createElement('canvas');
    packerCanvas.width = 44;
    packerCanvas.height = 44;
    const pkrCtx = packerCanvas.getContext('2d')!;
    pkrCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    pkrCtx.beginPath();
    pkrCtx.ellipse(22, 38, 14, 5, 0, 0, Math.PI * 2);
    pkrCtx.fill();
    // Green festive kurta
    pkrCtx.fillStyle = '#2e7d32';
    pkrCtx.beginPath();
    pkrCtx.roundRect(12, 16, 20, 20, 5);
    pkrCtx.fill();
    // Yellow apron
    pkrCtx.fillStyle = '#fff59d';
    pkrCtx.fillRect(15, 20, 14, 14);
    // Head
    pkrCtx.fillStyle = '#ffcc80';
    pkrCtx.beginPath();
    pkrCtx.arc(22, 12, 7, 0, Math.PI * 2);
    pkrCtx.fill();
    // Green headband
    pkrCtx.fillStyle = '#1b5e20';
    pkrCtx.fillRect(15, 7, 14, 3);
    this.textures.addCanvas('staff_packer', packerCanvas);

    // Staff Cashier Texture
    const cashCanvas = document.createElement('canvas');
    cashCanvas.width = 44;
    cashCanvas.height = 44;
    const cshCtx = cashCanvas.getContext('2d')!;
    cshCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    cshCtx.beginPath();
    cshCtx.ellipse(22, 38, 14, 5, 0, 0, Math.PI * 2);
    cshCtx.fill();
    // Royal Purple Kurta
    cshCtx.fillStyle = '#6a1b9a';
    cshCtx.beginPath();
    cshCtx.roundRect(12, 16, 20, 20, 5);
    cshCtx.fill();
    // Golden stole
    cshCtx.fillStyle = '#ffd54f';
    cshCtx.fillRect(14, 18, 4, 18);
    cshCtx.fillRect(26, 18, 4, 18);
    // Head
    cshCtx.fillStyle = '#ffcc80';
    cshCtx.beginPath();
    cshCtx.arc(22, 12, 7, 0, Math.PI * 2);
    cshCtx.fill();
    // Purple topi
    cshCtx.fillStyle = '#4a148c';
    cshCtx.beginPath();
    cshCtx.ellipse(22, 8, 7, 3, 0, 0, Math.PI * 2);
    cshCtx.fill();
    this.textures.addCanvas('staff_cashier', cashCanvas);

    // Counter Station (Teak Counter with Marigold Garland)
    const counterCanvas = document.createElement('canvas');
    counterCanvas.width = 120;
    counterCanvas.height = 64;
    const cCtx = counterCanvas.getContext('2d')!;

    // Counter wood body
    cCtx.fillStyle = '#4e342e';
    cCtx.beginPath();
    cCtx.roundRect(4, 10, 112, 48, 6);
    cCtx.fill();

    // Counter top polish
    cCtx.fillStyle = '#6d4c41';
    cCtx.fillRect(8, 14, 104, 30);

    // Brass payment dish
    cCtx.fillStyle = '#fbc02d';
    cCtx.beginPath();
    cCtx.ellipse(90, 26, 12, 6, 0, 0, Math.PI * 2);
    cCtx.fill();

    // Marigold Garland (Toran) across front
    for (let x = 12; x <= 108; x += 12) {
      cCtx.fillStyle = (x / 12) % 2 === 0 ? '#ff6f00' : '#ffd600';
      cCtx.beginPath();
      cCtx.arc(x, 48, 5, 0, Math.PI * 2);
      cCtx.fill();
    }

    this.textures.addCanvas('station_counter', counterCanvas);
  }

  private createCustomerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 44;
    canvas.height = 44;
    const ctx = canvas.getContext('2d')!;

    // Soft shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(22, 38, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kurta / Saree (Festive teal or maroon)
    ctx.fillStyle = '#00897b'; // Festive deep teal
    ctx.beginPath();
    ctx.roundRect(12, 16, 20, 20, 5);
    ctx.fill();

    // Golden border dupatta
    ctx.fillStyle = '#fbc02d';
    ctx.fillRect(14, 18, 5, 18);

    // Head
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(22, 12, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Dupatta drape
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(22, 10, 7, Math.PI, 0);
    ctx.fill();

    this.textures.addCanvas('customer', canvas);
  }

  private createParticleTextures() {
    // Steam puff
    const steamCanvas = document.createElement('canvas');
    steamCanvas.width = 16;
    steamCanvas.height = 16;
    const sCtx = steamCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(8, 8, 1, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    sCtx.fillStyle = grad;
    sCtx.beginPath();
    sCtx.arc(8, 8, 8, 0, Math.PI * 2);
    sCtx.fill();
    this.textures.addCanvas('particle_steam', steamCanvas);

    // Marigold petal
    const petalCanvas = document.createElement('canvas');
    petalCanvas.width = 10;
    petalCanvas.height = 10;
    const pCtx = petalCanvas.getContext('2d')!;
    pCtx.fillStyle = '#ff9100';
    pCtx.beginPath();
    pCtx.ellipse(5, 5, 4, 2, 0.5, 0, Math.PI * 2);
    pCtx.fill();
    this.textures.addCanvas('particle_petal', petalCanvas);
  }
}
