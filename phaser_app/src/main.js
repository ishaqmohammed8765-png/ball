import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const radius = 24;

    const ballGraphic = this.add.graphics();
    ballGraphic.fillStyle(0x0077ff, 1);
    ballGraphic.fillCircle(radius, radius, radius);
    ballGraphic.generateTexture("ball", radius * 2, radius * 2);
    ballGraphic.destroy();

    this.physics.world.setBounds(0, 0, width, height);

    const ball = this.physics.add.image(width / 2, height / 2, "ball");
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.setVelocity(240, 180);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#ffffff",
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: MainScene
};

new Phaser.Game(config);
