import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private readonly artScale = 2;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.image('bg_hall_illustrated', 'assets/generated/bg_hall_illustrated-v3-clean.png');
    this.load.image('pandal_ganesha', 'assets/generated/pandal_ganesha-v2.png');
    this.load.image('raster_steamer_brass', 'assets/generated/steamer_brass-v1.png');
    this.load.image('raster_steamer_input_table', 'assets/generated/steamer_input_table-v1.png');
    this.load.image('raster_steamer_output_table', 'assets/generated/steamer_output_table-v1.png');
    this.load.image('raster_supply_shelf', 'assets/generated/station_supply_shelf-v1.png');
    this.load.image('raster_supply_shelf_v2', 'assets/generated/station_supply_shelf-v2.png');
    this.load.image('raster_upgrade_desk', 'assets/generated/station_upgrade_desk-v1.png');
    this.load.image('raster_packing_bench', 'assets/generated/station_packing_bench-v1.png');
    this.load.image('raster_service_counter', 'assets/generated/station_service_counter-v1.png');
    this.load.image('raster_modak_platter', 'assets/generated/modak_platter-v1.png');

    // Generate procedural textures programmatically to guarantee 100% offline self-containment
    this.createPlayerTexture();
    this.createItemTextures();
    this.createStationTextures();
    this.createCompartmentTextures();
    this.createCustomerTexture();
    this.createParticleTextures();
  }

  create() {
    this.scene.start('ShopScene');
  }

  private makeArtCanvas(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width * this.artScale;
    canvas.height = height * this.artScale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(this.artScale, this.artScale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return { canvas, ctx };
  }

  private createPlayerTexture() {
    const { canvas, ctx } = this.makeArtCanvas(56, 64);

    // Soft ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(28, 57, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - saffron kurta
    ctx.fillStyle = '#e65100'; // Saffron orange
    ctx.beginPath();
    ctx.roundRect(16, 25, 24, 29, [9, 9, 6, 6]);
    ctx.fill();

    ctx.strokeStyle = '#45362e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // White festive chef apron
    ctx.fillStyle = '#fff8e1';
    ctx.beginPath();
    ctx.roundRect(20, 30, 16, 20, [4, 4, 3, 3]);
    ctx.fill();

    // Red sash/border
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(20, 41, 16, 3);

    // Head
    ctx.fillStyle = '#ffcc80'; // Warm skin tone
    ctx.beginPath();
    ctx.arc(28, 19, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#45362e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Traditional red topi/cap
    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.ellipse(28, 11, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(26, 6, 4, 5);

    ctx.fillStyle = '#45362e';
    ctx.beginPath();
    ctx.arc(24.5, 19, 1, 0, Math.PI * 2);
    ctx.arc(31.5, 19, 1, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas('player', canvas);
  }

  private createItemTextures() {
    // 1. Recipe Bundle (Jute sack with jaggery & coconut)
    const { canvas: bundleCanvas, ctx: bCtx } = this.makeArtCanvas(36, 36);

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
    const { canvas: batchCanvas, ctx: mCtx } = this.makeArtCanvas(36, 36);

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
    const { canvas: boxCanvas, ctx: boxCtx } = this.makeArtCanvas(36, 36);

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
    const { canvas: coinCanvas, ctx: cCtx } = this.makeArtCanvas(24, 24);

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
    const { canvas: shelfCanvas, ctx: sCtx } = this.makeArtCanvas(80, 64);

    sCtx.fillStyle = 'rgba(69,54,46,0.2)';
    sCtx.beginPath();
    sCtx.ellipse(40, 57, 32, 5, 0, 0, Math.PI * 2);
    sCtx.fill();

    sCtx.fillStyle = '#6f5141';
    sCtx.beginPath();
    sCtx.roundRect(6, 7, 68, 48, 7);
    sCtx.fill();
    sCtx.strokeStyle = '#45362e';
    sCtx.lineWidth = 2;
    sCtx.stroke();

    sCtx.fillStyle = '#9a755f';
    sCtx.fillRect(10, 11, 60, 38);

    // Shelves
    sCtx.fillStyle = '#45362e';
    sCtx.fillRect(9, 25, 62, 5);
    sCtx.fillRect(9, 46, 62, 5);

    // Jars and sacks
    sCtx.fillStyle = '#ffecb3'; // Flour sack
    sCtx.beginPath();
    sCtx.roundRect(13, 13, 16, 12, 3);
    sCtx.fill();
    sCtx.fillStyle = '#6d4c41'; // Jaggery pot
    sCtx.beginPath();
    sCtx.roundRect(34, 13, 13, 12, 3);
    sCtx.fill();
    sCtx.fillStyle = '#fff9c4'; // Coconut basket
    sCtx.beginPath();
    sCtx.roundRect(52, 13, 15, 12, 3);
    sCtx.fill();

    sCtx.fillStyle = '#f4c451';
    sCtx.fillRect(16, 34, 12, 9);
    sCtx.fillStyle = '#fffdf7';
    sCtx.fillRect(35, 34, 13, 9);
    sCtx.fillStyle = '#35765a';
    sCtx.fillRect(55, 34, 10, 9);

    this.textures.addCanvas('station_ingredient', shelfCanvas);

    // Steamer Station (Traditional Brass Ukadiche Steamer)
    const { canvas: steamerCanvas, ctx: stCtx } = this.makeArtCanvas(80, 64);

    stCtx.fillStyle = 'rgba(69,54,46,0.22)';
    stCtx.beginPath();
    stCtx.ellipse(40, 57, 30, 5, 0, 0, Math.PI * 2);
    stCtx.fill();

    // Stove platform and front face
    stCtx.fillStyle = '#68736f';
    stCtx.beginPath();
    stCtx.roundRect(9, 37, 62, 18, 6);
    stCtx.fill();
    stCtx.strokeStyle = '#45362e';
    stCtx.lineWidth = 2;
    stCtx.stroke();

    // Brass steamer pot
    const brass = stCtx.createLinearGradient(23, 13, 57, 50);
    brass.addColorStop(0, '#f4d27b');
    brass.addColorStop(0.45, '#c9953d');
    brass.addColorStop(1, '#9e6d25');
    stCtx.fillStyle = brass;
    stCtx.beginPath();
    stCtx.roundRect(22, 19, 36, 28, 10);
    stCtx.fill();
    stCtx.strokeStyle = '#6b4a23';
    stCtx.lineWidth = 2;
    stCtx.stroke();

    stCtx.fillStyle = '#e8bc5a';
    stCtx.beginPath();
    stCtx.ellipse(40, 19, 20, 6, 0, 0, Math.PI * 2);
    stCtx.fill();
    stCtx.strokeStyle = '#6b4a23';
    stCtx.stroke();

    // Brass handles
    stCtx.strokeStyle = '#6b4a23';
    stCtx.lineWidth = 3;
    stCtx.beginPath();
    stCtx.moveTo(22, 30);
    stCtx.lineTo(15, 30);
    stCtx.moveTo(58, 30);
    stCtx.lineTo(65, 30);
    stCtx.stroke();

    // Pot lid knob
    stCtx.fillStyle = '#9e6d25';
    stCtx.beginPath();
    stCtx.arc(40, 13, 4, 0, Math.PI * 2);
    stCtx.fill();

    this.textures.addCanvas('station_steamer', steamerCanvas);

    // Packing Station (Wooden Packaging Table)
    // Packing Station (Solid Teak Packaging Bench with Bevels, Lower Storage, and Ribbon Rolls)
    const { canvas: packCanvas, ctx: pCtx } = this.makeArtCanvas(100, 68);

    // Soft drop shadow
    pCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    pCtx.beginPath();
    pCtx.ellipse(50, 62, 44, 5.5, 0, 0, Math.PI * 2);
    pCtx.fill();

    // Solid Walnut Lower Cabinet & Drawer Base
    pCtx.fillStyle = '#4e342e';
    pCtx.beginPath();
    pCtx.roundRect(8, 28, 84, 32, 6);
    pCtx.fill();
    pCtx.strokeStyle = '#2d1f17';
    pCtx.lineWidth = 1.5;
    pCtx.stroke();

    // Lower Open Shelf with stacked packaging rolls
    pCtx.fillStyle = '#37241e';
    pCtx.fillRect(14, 42, 72, 14);
    // Rolls of festive paper (crimson, gold, green)
    pCtx.fillStyle = '#c2185b';
    pCtx.beginPath();
    pCtx.roundRect(18, 45, 18, 9, 3);
    pCtx.fill();
    pCtx.fillStyle = '#ffd54f';
    pCtx.beginPath();
    pCtx.roundRect(40, 45, 20, 9, 3);
    pCtx.fill();
    pCtx.fillStyle = '#388e3c';
    pCtx.beginPath();
    pCtx.roundRect(64, 45, 18, 9, 3);
    pCtx.fill();

    // Polished Teak Wood Work Surface (2.5D Top Face)
    pCtx.fillStyle = '#8d6245';
    pCtx.beginPath();
    pCtx.roundRect(6, 16, 88, 16, 5);
    pCtx.fill();
    pCtx.strokeStyle = '#3e2723';
    pCtx.lineWidth = 1.5;
    pCtx.stroke();

    // Work surface front bevel / highlight
    pCtx.fillStyle = '#a67554';
    pCtx.fillRect(8, 17, 84, 3);

    // Center Assembly Mat (white parchment sheet)
    pCtx.fillStyle = '#fffdf7';
    pCtx.beginPath();
    pCtx.roundRect(36, 18, 28, 12, 2);
    pCtx.fill();
    pCtx.strokeStyle = '#c9953d';
    pCtx.lineWidth = 1;
    pCtx.stroke();

    // Golden Ribbon Spool & Tape Dispenser
    pCtx.fillStyle = '#ffd54f';
    pCtx.beginPath();
    pCtx.arc(28, 24, 4.5, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.strokeStyle = '#c9953d';
    pCtx.stroke();

    // Brass corner braces on bench
    pCtx.fillStyle = '#c9953d';
    pCtx.fillRect(8, 28, 4, 4);
    pCtx.fillRect(88, 28, 4, 4);

    this.textures.addCanvas('station_packing', packCanvas);

    // Locked Steamer 2 Station (Blueprint / Padlock)
    const { canvas: lockedSteamerCanvas, ctx: lsCtx } = this.makeArtCanvas(80, 64);

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


    // Diya (Brass Lamp with Flame)
    const { canvas: diyaCanvas, ctx: dCtx } = this.makeArtCanvas(24, 24);
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

    // Pandal Dispatch Station (Festive Teak Shipping Crate)
    const { canvas: dispatchCanvas, ctx: dpCtx } = this.makeArtCanvas(72, 60);
    // Ground shadow
    dpCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    dpCtx.beginPath();
    dpCtx.ellipse(36, 54, 28, 5, 0, 0, Math.PI * 2);
    dpCtx.fill();

    // Teak crate body
    dpCtx.fillStyle = '#6d4c41';
    dpCtx.beginPath();
    dpCtx.roundRect(8, 12, 56, 42, 4);
    dpCtx.fill();
    dpCtx.strokeStyle = '#3e2723';
    dpCtx.lineWidth = 1.5;
    dpCtx.stroke();

    // Wood slats
    dpCtx.fillStyle = '#8d6e63';
    dpCtx.fillRect(10, 15, 52, 10);
    dpCtx.fillRect(10, 28, 52, 10);
    dpCtx.fillRect(10, 41, 52, 10);

    // Diagonal reinforcing cross braces
    dpCtx.strokeStyle = '#5d4037';
    dpCtx.lineWidth = 2;
    dpCtx.beginPath();
    dpCtx.moveTo(12, 15);
    dpCtx.lineTo(60, 50);
    dpCtx.moveTo(60, 15);
    dpCtx.lineTo(12, 50);
    dpCtx.stroke();

    // Brass corner braces and rivets
    dpCtx.fillStyle = '#ffd54f';
    dpCtx.fillRect(8, 12, 6, 6);
    dpCtx.fillRect(58, 12, 6, 6);
    dpCtx.fillRect(8, 48, 6, 6);
    dpCtx.fillRect(58, 48, 6, 6);

    // Festive marigold garland draped across top rim
    dpCtx.fillStyle = '#ff9800';
    for (let gx = 14; gx <= 58; gx += 8) {
      dpCtx.beginPath();
      dpCtx.arc(gx, 14, 3.5, 0, Math.PI * 2);
      dpCtx.fill();
    }
    dpCtx.fillStyle = '#ffeb3b';
    for (let gx = 18; gx <= 54; gx += 8) {
      dpCtx.beginPath();
      dpCtx.arc(gx, 15, 2.5, 0, Math.PI * 2);
      dpCtx.fill();
    }

    // Center brass emblem stamp
    dpCtx.fillStyle = '#ffc107';
    dpCtx.beginPath();
    dpCtx.arc(36, 33, 6, 0, Math.PI * 2);
    dpCtx.fill();
    dpCtx.strokeStyle = '#ff8f00';
    dpCtx.lineWidth = 1;
    dpCtx.stroke();

    this.textures.addCanvas('station_dispatch', dispatchCanvas);

    // Subtle Inactive Pandal Dispatch Silhouette (Locked State)
    const { canvas: dispatchLockedCanvas, ctx: dplCtx } = this.makeArtCanvas(72, 60);
    dplCtx.fillStyle = 'rgba(69, 54, 46, 0.15)';
    dplCtx.beginPath();
    dplCtx.ellipse(36, 54, 26, 4.5, 0, 0, Math.PI * 2);
    dplCtx.fill();

    // Muted dark walnut silhouette
    dplCtx.fillStyle = '#45362e';
    dplCtx.beginPath();
    dplCtx.roundRect(8, 12, 56, 42, 4);
    dplCtx.fill();
    dplCtx.strokeStyle = '#2d1f18';
    dplCtx.lineWidth = 1.5;
    dplCtx.stroke();

    // Subdued slats
    dplCtx.fillStyle = '#544238';
    dplCtx.fillRect(10, 15, 52, 10);
    dplCtx.fillRect(10, 28, 52, 10);
    dplCtx.fillRect(10, 41, 52, 10);

    // Subdued cross braces
    dplCtx.strokeStyle = '#382a22';
    dplCtx.lineWidth = 1.5;
    dplCtx.beginPath();
    dplCtx.moveTo(12, 15);
    dplCtx.lineTo(60, 50);
    dplCtx.moveTo(60, 15);
    dplCtx.lineTo(12, 50);
    dplCtx.stroke();

    // Muted dark brass corners
    dplCtx.fillStyle = '#795548';
    dplCtx.fillRect(8, 12, 6, 6);
    dplCtx.fillRect(58, 12, 6, 6);
    dplCtx.fillRect(8, 48, 6, 6);
    dplCtx.fillRect(58, 48, 6, 6);

    this.textures.addCanvas('station_dispatch_locked', dispatchLockedCanvas);

    // Staff Packer Texture
    const { canvas: packerCanvas, ctx: pkrCtx } = this.makeArtCanvas(44, 44);
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
    const { canvas: cashCanvas, ctx: cshCtx } = this.makeArtCanvas(44, 44);
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

    // Service Counter Station (Grand Carved Teak Counter with White Marble Top & Brass Details)
    const { canvas: counterCanvas, ctx: cCtx } = this.makeArtCanvas(130, 70);

    // Soft drop shadow
    cCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    cCtx.beginPath();
    cCtx.ellipse(65, 64, 58, 5.5, 0, 0, Math.PI * 2);
    cCtx.fill();

    // Solid Walnut Front Body (2.5D Face)
    cCtx.fillStyle = '#4e342e';
    cCtx.beginPath();
    cCtx.roundRect(6, 18, 118, 44, 6);
    cCtx.fill();
    cCtx.strokeStyle = '#2d1f17';
    cCtx.lineWidth = 1.5;
    cCtx.stroke();

    // Carved Wood Recessed Panels
    cCtx.fillStyle = '#3a251e';
    cCtx.beginPath();
    cCtx.roundRect(14, 28, 46, 28, 4);
    cCtx.fill();
    cCtx.beginPath();
    cCtx.roundRect(68, 28, 48, 28, 4);
    cCtx.fill();

    // Brass corner studs on wood panels
    cCtx.fillStyle = '#c9953d';
    const studs = [
      [17, 31], [57, 31], [17, 53], [57, 53],
      [71, 31], [113, 31], [71, 53], [113, 53]
    ];
    for (const [sx, sy] of studs) {
      cCtx.beginPath();
      cCtx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      cCtx.fill();
    }

    // Polished White Marble Countertop (2.5D Top Face)
    cCtx.fillStyle = '#fffdf7';
    cCtx.beginPath();
    cCtx.roundRect(4, 10, 122, 18, 5);
    cCtx.fill();
    cCtx.strokeStyle = '#c9953d';
    cCtx.lineWidth = 1.5;
    cCtx.stroke();

    // Top surface shine / bevel
    cCtx.fillStyle = '#f5eedf';
    cCtx.fillRect(6, 11, 118, 4);

    // Brass Payment Dish on right counter top (customer payment zone)
    cCtx.fillStyle = '#c9953d';
    cCtx.beginPath();
    cCtx.ellipse(104, 20, 14, 6, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.fillStyle = '#ffd54f';
    cCtx.beginPath();
    cCtx.ellipse(104, 19, 12, 5, 0, 0, Math.PI * 2);
    cCtx.fill();
    // Currency coin inside payment dish
    cCtx.fillStyle = '#f57f17';
    cCtx.beginPath();
    cCtx.arc(104, 19, 3, 0, Math.PI * 2);
    cCtx.fill();

    // Festive Marigold Toran Garland across front
    for (let x = 14; x <= 116; x += 11) {
      cCtx.fillStyle = (x / 11) % 2 === 0 ? '#ff6f00' : '#ffd54f';
      cCtx.beginPath();
      cCtx.arc(x, 26, 3.5, 0, Math.PI * 2);
      cCtx.fill();
    }

    this.textures.addCanvas('station_counter', counterCanvas);
  }

  private createCustomerTexture() {
    const { canvas, ctx } = this.makeArtCanvas(44, 44);

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
    const { canvas: steamCanvas, ctx: sCtx } = this.makeArtCanvas(16, 16);
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
    const { canvas: petalCanvas, ctx: pCtx } = this.makeArtCanvas(10, 10);
    pCtx.fillStyle = '#ff9100';
    pCtx.beginPath();
    pCtx.ellipse(5, 5, 4, 2, 0.5, 0, Math.PI * 2);
    pCtx.fill();
    this.textures.addCanvas('particle_petal', petalCanvas);
  }

  private createCompartmentTextures() {
    // 1. Locked Staircase ("First floor — later upgrade")
    const { canvas: stairCanvas, ctx: stCtx } = this.makeArtCanvas(64, 150);
    // Soft ground shadow
    stCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    stCtx.beginPath();
    stCtx.ellipse(32, 142, 28, 6, 0, 0, Math.PI * 2);
    stCtx.fill();

    // Wood steps rising upward (8 steps)
    for (let i = 0; i < 8; i++) {
      const stepY = 16 + i * 14;
      // Step riser (front face)
      stCtx.fillStyle = '#4a3325';
      stCtx.fillRect(10, stepY + 7, 44, 7);
      // Step tread (top surface)
      stCtx.fillStyle = '#7a5438';
      stCtx.fillRect(10, stepY, 44, 7);
      // Red carpet runner down center
      stCtx.fillStyle = '#b71c1c';
      stCtx.fillRect(20, stepY, 24, 14);
      // Polished brass stair rod
      stCtx.fillStyle = '#ffd54f';
      stCtx.fillRect(19, stepY + 7, 26, 2);
    }

    // Left outer wood stringer/panel
    stCtx.fillStyle = '#3a271d';
    stCtx.fillRect(8, 14, 4, 120);

    // Left brass railing
    stCtx.strokeStyle = '#c9953d';
    stCtx.lineWidth = 3;
    stCtx.beginPath();
    stCtx.moveTo(8, 12);
    stCtx.lineTo(8, 128);
    stCtx.stroke();
    // Railing balusters
    stCtx.fillStyle = '#c9953d';
    for (let b = 0; b < 4; b++) {
      stCtx.fillRect(7, 26 + b * 32, 3, 22);
    }
    // Finial ball on top post
    stCtx.beginPath();
    stCtx.arc(8, 12, 4, 0, Math.PI * 2);
    stCtx.fill();

    // Two brass stanchions at base
    const drawStanchion = (x: number, y: number) => {
      // Base
      stCtx.fillStyle = '#c9953d';
      stCtx.beginPath();
      stCtx.ellipse(x, y + 10, 7, 3, 0, 0, Math.PI * 2);
      stCtx.fill();
      stCtx.strokeStyle = '#8d6318';
      stCtx.lineWidth = 1;
      stCtx.stroke();
      // Post
      stCtx.fillStyle = '#ffd54f';
      stCtx.fillRect(x - 2, y - 12, 4, 22);
      // Ball top with ring
      stCtx.fillStyle = '#c9953d';
      stCtx.beginPath();
      stCtx.arc(x, y - 14, 4.5, 0, Math.PI * 2);
      stCtx.fill();
    };
    drawStanchion(14, 124);
    drawStanchion(50, 124);

    // Velvet rope hanging between stanchions
    stCtx.strokeStyle = '#c62828';
    stCtx.lineWidth = 3.5;
    stCtx.beginPath();
    stCtx.moveTo(14, 112);
    stCtx.quadraticCurveTo(32, 122, 50, 112);
    stCtx.stroke();
    stCtx.strokeStyle = '#ffd54f';
    stCtx.lineWidth = 1;
    stCtx.stroke();

    // Plaque sign
    stCtx.fillStyle = '#fffdf7';
    stCtx.beginPath();
    stCtx.roundRect(6, 48, 52, 28, 5);
    stCtx.fill();
    stCtx.strokeStyle = '#45362e';
    stCtx.lineWidth = 2;
    stCtx.stroke();
    stCtx.strokeStyle = '#c9953d';
    stCtx.lineWidth = 1;
    stCtx.strokeRect(9, 51, 46, 22);
    stCtx.fillStyle = '#45362e';
    stCtx.font = 'bold 7px sans-serif';
    stCtx.textAlign = 'center';
    stCtx.fillText('FIRST FLOOR', 32, 60);
    stCtx.fillStyle = '#b84e3b';
    stCtx.font = 'italic 6px sans-serif';
    stCtx.fillText('Later upgrade', 32, 69);

    this.textures.addCanvas('staircase_locked', stairCanvas);

    // 2. Department Badges
    const drawBadge = (key: string, num: string, title: string) => {
      const { canvas, ctx } = this.makeArtCanvas(88, 24);
      ctx.fillStyle = '#275239';
      ctx.beginPath();
      ctx.roundRect(2, 2, 84, 20, 10);
      ctx.fill();
      ctx.strokeStyle = '#c9953d';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(13, 12, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#275239';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num, 13, 12);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 49, 12);

      this.textures.addCanvas(key, canvas);
    };
    drawBadge('dept_badge_supplies', '1', 'SUPPLIES');
    drawBadge('dept_badge_steaming', '2', 'STEAMING');
    drawBadge('dept_badge_packing', '3', 'PACKING');
    drawBadge('dept_badge_service', '4', 'SERVICE');
    drawBadge('dept_badge_dispatch', '5', 'DISPATCH');

    // 3. High-Detail Supply Shelf (4 distinct shape & color bins: Rice Flour, Coconut, Jaggery, Packaging; NO wheat)
    const { canvas: shelfCanvas, ctx: shCtx } = this.makeArtCanvas(100, 78);
    // Soft ground shadow
    shCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    shCtx.beginPath();
    shCtx.ellipse(50, 74, 46, 5, 0, 0, Math.PI * 2);
    shCtx.fill();

    // Solid Teak Cabinet Frame with 2.5D bevel
    shCtx.fillStyle = '#4a3528';
    shCtx.beginPath();
    shCtx.roundRect(4, 6, 92, 66, 6);
    shCtx.fill();
    shCtx.strokeStyle = '#2d1f17';
    shCtx.lineWidth = 2;
    shCtx.stroke();

    // Top surface edge highlight
    shCtx.fillStyle = '#7a5238';
    shCtx.fillRect(6, 6, 88, 4);

    // Inner back panel with subtle wood slats
    shCtx.fillStyle = '#8d6245';
    shCtx.fillRect(8, 10, 84, 58);
    shCtx.fillStyle = '#6b4833';
    for (let py = 12; py < 68; py += 7) {
      shCtx.fillRect(8, py, 84, 1);
    }

    // Mid shelf and bottom shelf ledges (3D depth)
    shCtx.fillStyle = '#3a271d';
    shCtx.fillRect(6, 38, 88, 5);
    shCtx.fillStyle = '#5c3e2e';
    shCtx.fillRect(6, 38, 88, 2); // Highlight on shelf edge

    shCtx.fillStyle = '#3a271d';
    shCtx.fillRect(6, 68, 88, 5);
    shCtx.fillStyle = '#5c3e2e';
    shCtx.fillRect(6, 68, 88, 2);

    // --- TOP SHELF ---
    // 1. Bin 1: RICE FLOUR (Rolled canvas sack, bright white mound, wooden scoop)
    // Canvas sack body
    shCtx.fillStyle = '#f5f0e6';
    shCtx.beginPath();
    shCtx.roundRect(12, 17, 34, 20, [4, 4, 6, 6]);
    shCtx.fill();
    shCtx.strokeStyle = '#cfc2ad';
    shCtx.lineWidth = 1.5;
    shCtx.stroke();
    // Blue decorative binding cord
    shCtx.fillStyle = '#1976d2';
    shCtx.fillRect(12, 22, 34, 2);
    // Rolled rim
    shCtx.fillStyle = '#e8dfcc';
    shCtx.fillRect(10, 16, 38, 4);
    // Pure white flour mound peaking over rim
    shCtx.fillStyle = '#ffffff';
    shCtx.beginPath();
    shCtx.arc(29, 16, 12, Math.PI, Math.PI * 2);
    shCtx.fill();
    // Wooden scoop handle resting in flour
    shCtx.strokeStyle = '#8d6e63';
    shCtx.lineWidth = 2.5;
    shCtx.beginPath();
    shCtx.moveTo(22, 9);
    shCtx.lineTo(31, 17);
    shCtx.stroke();

    // 2. Bin 2: FRESH COCONUT (Terracotta bowl with halved brown coconut showing pure white meat)
    // Terracotta bowl
    shCtx.fillStyle = '#b85d36';
    shCtx.beginPath();
    shCtx.ellipse(72, 32, 18, 6, 0, 0, Math.PI * 2);
    shCtx.fill();
    shCtx.strokeStyle = '#823719';
    shCtx.lineWidth = 1;
    shCtx.stroke();
    // Coconut half 1 (outer husk brown)
    shCtx.fillStyle = '#4e342e';
    shCtx.beginPath();
    shCtx.arc(66, 23, 9, 0, Math.PI * 2);
    shCtx.fill();
    // Coconut half 1 (inner pure white meat)
    shCtx.fillStyle = '#ffffff';
    shCtx.beginPath();
    shCtx.arc(66, 23, 6.5, 0, Math.PI * 2);
    shCtx.fill();
    // Coconut half 2 (tilted)
    shCtx.fillStyle = '#5d4037';
    shCtx.beginPath();
    shCtx.arc(78, 24, 8, 0, Math.PI * 2);
    shCtx.fill();
    shCtx.fillStyle = '#ffffff';
    shCtx.beginPath();
    shCtx.arc(78, 24, 5.5, 0, Math.PI * 2);
    shCtx.fill();
    // Fresh green coconut leaf garnish
    shCtx.fillStyle = '#4caf50';
    shCtx.beginPath();
    shCtx.ellipse(84, 18, 6, 2.5, 0.4, 0, Math.PI * 2);
    shCtx.fill();

    // --- BOTTOM SHELF ---
    // 3. Bin 3: ORGANIC CANE JAGGERY / GUR (Stacked golden-amber blocks in polished brass vessel)
    // Brass container
    const brassUrnGrad = shCtx.createLinearGradient(12, 54, 46, 68);
    brassUrnGrad.addColorStop(0, '#ffd54f');
    brassUrnGrad.addColorStop(0.5, '#c9953d');
    brassUrnGrad.addColorStop(1, '#8d6318');
    shCtx.fillStyle = brassUrnGrad;
    shCtx.beginPath();
    shCtx.roundRect(14, 54, 30, 14, [2, 2, 6, 6]);
    shCtx.fill();
    shCtx.strokeStyle = '#6d4c18';
    shCtx.lineWidth = 1;
    shCtx.stroke();
    // Stacked rich dark-golden jaggery blocks (cubes)
    shCtx.fillStyle = '#6d3c12';
    shCtx.fillRect(16, 46, 12, 9);
    shCtx.fillStyle = '#a6591b';
    shCtx.fillRect(17, 45, 10, 3); // top face highlight
    shCtx.fillStyle = '#7a4214';
    shCtx.fillRect(27, 47, 13, 8);
    shCtx.fillStyle = '#b86622';
    shCtx.fillRect(28, 46, 11, 3);
    shCtx.fillStyle = '#8f4f19';
    shCtx.fillRect(21, 42, 13, 7);
    shCtx.fillStyle = '#cc7529';
    shCtx.fillRect(22, 41, 11, 2.5);

    // 4. Bin 4: PACKAGING SUPPLIES & BANANA LEAVES (Festive crimson gift boxes + fresh banana leaves)
    // Banana leaves stacked underneath
    shCtx.fillStyle = '#388e3c';
    shCtx.beginPath();
    shCtx.roundRect(56, 60, 34, 7, 2);
    shCtx.fill();
    shCtx.fillStyle = '#66bb6a';
    shCtx.fillRect(58, 61, 30, 1.5);
    // Festive crimson & gold modak gift boxes
    shCtx.fillStyle = '#c2185b';
    shCtx.beginPath();
    shCtx.roundRect(60, 48, 16, 13, 3);
    shCtx.fill();
    shCtx.strokeStyle = '#880e4f';
    shCtx.lineWidth = 1;
    shCtx.stroke();
    // Golden ribbon cross on box 1
    shCtx.fillStyle = '#ffd54f';
    shCtx.fillRect(67, 48, 2.5, 13);
    shCtx.fillRect(60, 54, 16, 2.5);

    // Box 2 (stacked slightly behind and to the right)
    shCtx.fillStyle = '#b71c1c';
    shCtx.beginPath();
    shCtx.roundRect(75, 45, 15, 13, 3);
    shCtx.fill();
    shCtx.strokeStyle = '#7f0000';
    shCtx.lineWidth = 1;
    shCtx.stroke();
    shCtx.fillStyle = '#ffd54f';
    shCtx.fillRect(81, 45, 2.5, 13);
    shCtx.fillRect(75, 51, 15, 2.5);

    // Center divider accent: Tiny brass spice mortar with cardamom pods (subtle, non-clutter)
    shCtx.fillStyle = '#c9953d';
    shCtx.beginPath();
    shCtx.ellipse(49, 64, 4, 2.5, 0, 0, Math.PI * 2);
    shCtx.fill();
    shCtx.fillStyle = '#388e3c';
    shCtx.beginPath();
    shCtx.ellipse(48, 62, 2, 1, 0.5, 0, Math.PI * 2);
    shCtx.fill();

    this.textures.addCanvas('station_supply_shelf', shelfCanvas);

    // 4. GOODS IN sacks pallet (Clean stacked burlap sacks with pallet bevels)
    const { canvas: goodsCanvas, ctx: gCtx } = this.makeArtCanvas(52, 48);
    gCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    gCtx.beginPath();
    gCtx.ellipse(26, 44, 22, 4, 0, 0, Math.PI * 2);
    gCtx.fill();

    // Wooden pallet slats
    gCtx.fillStyle = '#6d4c41';
    gCtx.fillRect(4, 38, 44, 5);
    gCtx.fillStyle = '#8d6e63';
    gCtx.fillRect(4, 38, 44, 1.5); // Highlight
    gCtx.fillStyle = '#4e342e';
    gCtx.fillRect(6, 42, 8, 4);
    gCtx.fillRect(22, 42, 8, 4);
    gCtx.fillRect(38, 42, 8, 4);

    // Stacked burlap sacks with texture
    gCtx.fillStyle = '#a1887f';
    gCtx.beginPath();
    gCtx.roundRect(6, 25, 20, 14, 4);
    gCtx.fill();
    gCtx.beginPath();
    gCtx.roundRect(24, 25, 22, 14, 4);
    gCtx.fill();
    gCtx.fillStyle = '#8d6e63';
    gCtx.beginPath();
    gCtx.roundRect(14, 14, 22, 14, 4);
    gCtx.fill();
    gCtx.fillStyle = '#ffd54f';
    gCtx.fillRect(8, 29, 16, 2);
    gCtx.fillRect(26, 29, 18, 2);
    gCtx.fillRect(16, 18, 18, 2);

    // Clear wooden plaque
    gCtx.fillStyle = '#fffdf7';
    gCtx.beginPath();
    gCtx.roundRect(10, 2, 32, 11, 3);
    gCtx.fill();
    gCtx.strokeStyle = '#45362e';
    gCtx.lineWidth = 1;
    gCtx.stroke();
    gCtx.fillStyle = '#45362e';
    gCtx.font = 'bold 6.5px Outfit, sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('GOODS IN', 26, 9.5);
    this.textures.addCanvas('goods_in_sacks', goodsCanvas);

    // 5. Polished Brass Steamer with Stove Base
    const { canvas: stmCanvas, ctx: smCtx } = this.makeArtCanvas(72, 80);
    smCtx.fillStyle = 'rgba(69, 54, 46, 0.25)';
    smCtx.beginPath();
    smCtx.ellipse(36, 74, 30, 6, 0, 0, Math.PI * 2);
    smCtx.fill();

    smCtx.fillStyle = '#37474f';
    smCtx.beginPath();
    smCtx.roundRect(8, 54, 56, 18, 5);
    smCtx.fill();
    smCtx.strokeStyle = '#212121';
    smCtx.lineWidth = 2;
    smCtx.stroke();

    smCtx.fillStyle = '#1c2529';
    smCtx.beginPath();
    smCtx.roundRect(20, 59, 32, 11, 3);
    smCtx.fill();
    const emberGrad = smCtx.createRadialGradient(36, 65, 2, 36, 65, 14);
    emberGrad.addColorStop(0, '#fff59d');
    emberGrad.addColorStop(0.4, '#ff9800');
    emberGrad.addColorStop(0.8, '#d84315');
    emberGrad.addColorStop(1, 'transparent');
    smCtx.fillStyle = emberGrad;
    smCtx.fillRect(22, 60, 28, 9);

    const brassGrad = smCtx.createLinearGradient(16, 10, 56, 50);
    brassGrad.addColorStop(0, '#fef0a5');
    brassGrad.addColorStop(0.35, '#e0a93b');
    brassGrad.addColorStop(0.7, '#ba8225');
    brassGrad.addColorStop(1, '#784e11');

    smCtx.fillStyle = brassGrad;
    smCtx.beginPath();
    smCtx.roundRect(16, 40, 40, 16, [4, 4, 8, 8]);
    smCtx.fill();
    smCtx.strokeStyle = '#5a3809';
    smCtx.lineWidth = 1.5;
    smCtx.stroke();

    smCtx.fillStyle = brassGrad;
    smCtx.beginPath();
    smCtx.roundRect(14, 26, 44, 16, 5);
    smCtx.fill();
    smCtx.strokeStyle = '#5a3809';
    smCtx.lineWidth = 1.5;
    smCtx.stroke();

    smCtx.fillStyle = brassGrad;
    smCtx.beginPath();
    smCtx.roundRect(16, 15, 40, 13, 4);
    smCtx.fill();
    smCtx.strokeStyle = '#5a3809';
    smCtx.lineWidth = 1.5;
    smCtx.stroke();

    smCtx.strokeStyle = '#8d6318';
    smCtx.lineWidth = 3;
    smCtx.beginPath();
    smCtx.arc(12, 34, 5, Math.PI * 0.5, Math.PI * 1.5);
    smCtx.stroke();
    smCtx.beginPath();
    smCtx.arc(60, 34, 5, -Math.PI * 0.5, Math.PI * 0.5);
    smCtx.stroke();

    smCtx.fillStyle = '#ffd54f';
    smCtx.beginPath();
    smCtx.ellipse(36, 15, 20, 5, 0, 0, Math.PI * 2);
    smCtx.fill();
    smCtx.strokeStyle = '#5a3809';
    smCtx.lineWidth = 1.5;
    smCtx.stroke();

    smCtx.fillStyle = '#c9953d';
    smCtx.beginPath();
    smCtx.arc(36, 10, 4, 0, Math.PI * 2);
    smCtx.fill();
    smCtx.fillRect(34.5, 5, 3, 5);

    this.textures.addCanvas('station_steamer_brass', stmCanvas);

    // 6. Steamer Input Table (Clean prep table without baked-in colliding text)
    const { canvas: inCanvas, ctx: inCtx } = this.makeArtCanvas(56, 54);
    inCtx.fillStyle = 'rgba(69, 54, 46, 0.2)';
    inCtx.beginPath();
    inCtx.ellipse(28, 48, 24, 5, 0, 0, Math.PI * 2);
    inCtx.fill();
    // Wood base
    inCtx.fillStyle = '#4e342e';
    inCtx.fillRect(6, 20, 44, 28);
    // Stainless steel table top with bevel
    inCtx.fillStyle = '#b0bec5';
    inCtx.beginPath();
    inCtx.roundRect(4, 12, 48, 14, 4);
    inCtx.fill();
    inCtx.strokeStyle = '#37474f';
    inCtx.lineWidth = 1.5;
    inCtx.stroke();
    // Stainless top surface highlight
    inCtx.fillStyle = '#eceff1';
    inCtx.fillRect(6, 13, 44, 4);
    // Lower shelf panel
    inCtx.fillStyle = '#3e2723';
    inCtx.fillRect(8, 30, 40, 15);
    inCtx.strokeStyle = '#5d4037';
    inCtx.lineWidth = 1;
    inCtx.strokeRect(8, 30, 40, 15);
    this.textures.addCanvas('steamer_input_table', inCanvas);

    // 7. Steamer Output Table (Clean serving table without baked-in colliding text)
    const { canvas: outCanvas, ctx: outCtx } = this.makeArtCanvas(56, 54);
    outCtx.fillStyle = 'rgba(69, 54, 46, 0.2)';
    outCtx.beginPath();
    outCtx.ellipse(28, 48, 24, 5, 0, 0, Math.PI * 2);
    outCtx.fill();
    // Wood base
    outCtx.fillStyle = '#4e342e';
    outCtx.fillRect(6, 20, 44, 28);
    // Table top with banana-leaf service inlay
    inCtx.fillStyle = '#b0bec5';
    outCtx.fillStyle = '#cfd8dc';
    outCtx.beginPath();
    outCtx.roundRect(4, 12, 48, 14, 4);
    outCtx.fill();
    outCtx.strokeStyle = '#37474f';
    outCtx.lineWidth = 1.5;
    outCtx.stroke();
    // Fresh green banana leaf inlay on serving surface
    outCtx.fillStyle = '#2e7d32';
    outCtx.beginPath();
    outCtx.roundRect(8, 14, 40, 9, 3);
    outCtx.fill();
    outCtx.fillStyle = '#4caf50';
    outCtx.fillRect(10, 15, 36, 1.5);
    // Lower shelf panel
    outCtx.fillStyle = '#3e2723';
    outCtx.fillRect(8, 30, 40, 15);
    outCtx.strokeStyle = '#5d4037';
    outCtx.lineWidth = 1;
    outCtx.strokeRect(8, 30, 40, 15);
    this.textures.addCanvas('steamer_output_table', outCanvas);

    // 8. Tray with Wrapped Bundle (Recipe Bundle)
    const { canvas: trBndlCanvas, ctx: tbCtx } = this.makeArtCanvas(32, 26);
    tbCtx.fillStyle = '#b0bec5';
    tbCtx.beginPath();
    tbCtx.roundRect(2, 6, 28, 16, 4);
    tbCtx.fill();
    tbCtx.strokeStyle = '#78909c';
    tbCtx.lineWidth = 1;
    tbCtx.stroke();
    tbCtx.fillStyle = '#fffde7';
    tbCtx.beginPath();
    tbCtx.roundRect(6, 7, 20, 13, 6);
    tbCtx.fill();
    tbCtx.strokeStyle = '#d7ccc8';
    tbCtx.stroke();
    tbCtx.fillStyle = '#e65100';
    tbCtx.fillRect(6, 11, 20, 2.5);
    tbCtx.fillStyle = '#fff9c4';
    tbCtx.beginPath();
    tbCtx.arc(16, 7, 3, 0, Math.PI * 2);
    tbCtx.fill();
    this.textures.addCanvas('tray_wrapped_bundle', trBndlCanvas);

    // 9. Tray with Fresh Cooked Modaks
    const { canvas: trMdkCanvas, ctx: tmCtx } = this.makeArtCanvas(44, 28);
    tmCtx.fillStyle = '#2e7d32';
    tmCtx.beginPath();
    tmCtx.roundRect(2, 4, 40, 20, 6);
    tmCtx.fill();
    tmCtx.strokeStyle = '#1b5e20';
    tmCtx.lineWidth = 1.5;
    tmCtx.stroke();
    tmCtx.strokeStyle = '#4caf50';
    tmCtx.lineWidth = 1;
    tmCtx.beginPath();
    tmCtx.moveTo(4, 14);
    tmCtx.lineTo(40, 14);
    tmCtx.stroke();

    const drawCookedModak = (x: number, y: number) => {
      tmCtx.fillStyle = '#fffde7';
      tmCtx.beginPath();
      tmCtx.moveTo(x, y - 5);
      tmCtx.quadraticCurveTo(x + 4.5, y + 2, x, y + 4);
      tmCtx.quadraticCurveTo(x - 4.5, y + 2, x, y - 5);
      tmCtx.fill();
      tmCtx.strokeStyle = '#efebe9';
      tmCtx.lineWidth = 0.8;
      tmCtx.stroke();
      tmCtx.fillStyle = '#ff6f00';
      tmCtx.fillRect(x - 0.75, y - 3.5, 1.5, 1.5);
    };
    drawCookedModak(10, 10);
    drawCookedModak(22, 10);
    drawCookedModak(34, 10);
    drawCookedModak(16, 17);
    drawCookedModak(28, 17);
    this.textures.addCanvas('tray_cooked_modaks', trMdkCanvas);

    // 10. Blueprint Outline for Steamer 2 (Clean single card: "Steamer 2 • ₹90")
    const { canvas: bpCanvas, ctx: bpCtx } = this.makeArtCanvas(76, 80);
    bpCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    bpCtx.beginPath();
    bpCtx.ellipse(38, 74, 32, 5, 0, 0, Math.PI * 2);
    bpCtx.fill();

    bpCtx.fillStyle = '#1c2e38';
    bpCtx.beginPath();
    bpCtx.roundRect(4, 6, 68, 66, 8);
    bpCtx.fill();
    bpCtx.strokeStyle = '#4dd0e1';
    bpCtx.lineWidth = 1.5;
    bpCtx.setLineDash([4, 3]);
    bpCtx.stroke();
    bpCtx.setLineDash([]);

    // Steamer pot silhouette
    bpCtx.strokeStyle = 'rgba(77, 208, 225, 0.4)';
    bpCtx.lineWidth = 1.5;
    bpCtx.strokeRect(20, 16, 36, 18);
    bpCtx.strokeRect(24, 10, 28, 6);

    // Single concise message
    bpCtx.fillStyle = '#ffffff';
    bpCtx.font = 'bold 8.5px Outfit, sans-serif';
    bpCtx.textAlign = 'center';
    bpCtx.fillText('Steamer 2 • ₹90', 38, 52);
    this.textures.addCanvas('station_steamer_blueprint', bpCanvas);

    // 11. Potted Indoor Plant for Entrance Pillars
    const { canvas: plantCanvas, ctx: plCtx } = this.makeArtCanvas(26, 36);
    plCtx.fillStyle = 'rgba(69, 54, 46, 0.22)';
    plCtx.beginPath();
    plCtx.ellipse(13, 33, 10, 3, 0, 0, Math.PI * 2);
    plCtx.fill();
    plCtx.fillStyle = '#b85d36';
    plCtx.beginPath();
    plCtx.moveTo(6, 20);
    plCtx.lineTo(20, 20);
    plCtx.lineTo(18, 32);
    plCtx.lineTo(8, 32);
    plCtx.closePath();
    plCtx.fill();
    plCtx.strokeStyle = '#45362e';
    plCtx.lineWidth = 1.2;
    plCtx.stroke();
    plCtx.fillStyle = '#c86d46';
    plCtx.fillRect(4, 18, 18, 3);

    const drawLeaf = (angle: number, len: number) => {
      plCtx.save();
      plCtx.translate(13, 18);
      plCtx.rotate(angle);
      plCtx.fillStyle = '#2e7d32';
      plCtx.beginPath();
      plCtx.ellipse(0, -len * 0.5, 3.5, len * 0.5, 0, 0, Math.PI * 2);
      plCtx.fill();
      plCtx.strokeStyle = '#1b5e20';
      plCtx.lineWidth = 0.8;
      plCtx.stroke();
      plCtx.restore();
    };
    drawLeaf(-0.7, 14);
    drawLeaf(-0.35, 17);
    drawLeaf(0, 19);
    drawLeaf(0.35, 17);
    drawLeaf(0.7, 14);
    this.textures.addCanvas('plant_pot', plantCanvas);

    // 12. Architectural Wall Pillar
    const { canvas: pilCanvas, ctx: pilCtx } = this.makeArtCanvas(20, 36);
    pilCtx.fillStyle = 'rgba(69, 54, 46, 0.25)';
    pilCtx.beginPath();
    pilCtx.ellipse(10, 34, 8, 2.5, 0, 0, Math.PI * 2);
    pilCtx.fill();
    pilCtx.fillStyle = '#ede0d1';
    pilCtx.fillRect(3, 7, 14, 23);
    pilCtx.strokeStyle = '#45362e';
    pilCtx.lineWidth = 1.5;
    pilCtx.strokeRect(3, 7, 14, 23);
    pilCtx.fillStyle = '#45362e';
    pilCtx.fillRect(1, 28, 18, 6);
    pilCtx.fillStyle = '#45362e';
    pilCtx.fillRect(1, 2, 18, 6);
    pilCtx.fillStyle = '#6d4c41';
    pilCtx.fillRect(3, 1, 14, 2);
    this.textures.addCanvas('wall_pillar', pilCanvas);

    // 13. Low Horizontal Partition Wall Segment
    const { canvas: wHCanvas, ctx: whCtx } = this.makeArtCanvas(48, 28);
    whCtx.fillStyle = 'rgba(69, 54, 46, 0.2)';
    whCtx.fillRect(0, 24, 48, 4);
    whCtx.fillStyle = '#ebdcd0';
    whCtx.fillRect(0, 6, 48, 18);
    whCtx.fillStyle = '#baa392';
    whCtx.fillRect(0, 20, 48, 4);
    whCtx.strokeStyle = '#45362e';
    whCtx.lineWidth = 1.5;
    whCtx.strokeRect(0, 6, 48, 18);
    whCtx.fillStyle = '#45362e';
    whCtx.beginPath();
    whCtx.roundRect(0, 1, 48, 6, 2);
    whCtx.fill();
    whCtx.fillStyle = '#6d4c41';
    whCtx.fillRect(2, 2, 44, 1.5);
    this.textures.addCanvas('wall_partition_h', wHCanvas);
  }
}
