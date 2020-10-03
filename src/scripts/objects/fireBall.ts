
export default class FireBall extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'empty-tile');
    scene.add.existing(this);
    this.setDepth(1);
    // scene.physics.add.existing(this);

    const particles = scene.add.particles('fire');
    particles.setDepth(1);
    const emitter = particles.createEmitter({
      alpha: { start: 1, end: 0 },
      scale: { start: 0.5, end: 2.5 },
      tint: { start: 0xff945e, end: 0xff945e },
      speed: 20,
      accelerationY: -300,
      angle: { min: -85, max: -95 },
      rotate: { min: -180, max: 180 },
      lifespan: { min: 1000, max: 1100 },
      blendMode: Phaser.BlendModes.ADD,
      frequency: 110,
      maxParticles: 0,
      x,
      y,
    });
  }
}
