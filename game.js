class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        this.load.image("background", "assets/backgrounds/space-bg.png");
    }

    create() {
        this.add.image(400, 300, "background").setOrigin(0.5);
        this.add.text(200, 95, "Dragon Space Battle", { fontSize: '32px', fill: '#fff' });
        this.add.text(200, 130, "By Nexxus", { fontSize: '32px', fill: '#fff' });
        this.add.text(200, 220, "Rules:", { fontSize: '24px', fill: '#fff' });
        this.add.text(200, 250, "- Move with arrow keys", { fontSize: '18px', fill: '#fff' });
        this.add.text(200, 280, "- Shoot fireballs with SPACE", { fontSize: '18px', fill: '#fff' });
        this.add.text(200, 310, "- Avoid the dragon's fireballs!", { fontSize: '18px', fill: '#fff' });
        this.add.text(250, 390, "Press SPACE to Begin", { fontSize: '24px', fill: '#ffff00' });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        console.log("📥 Loading assets...");
        this.load.image("player", "assets/characters/player.png");
        this.load.image("spaceDragon", "assets/enemies/space-dragon.png");
        this.load.image("fireball", "assets/effects/fireball.png");
        this.load.image("dragonFireball", "assets/effects/dragon-fireball.png");
    }

    create() {
        console.log("🎮 Creating game scene...");
        this.add.image(400, 300, "background").setOrigin(0.5);
        this.dragonKillCount = 0;

        this.killCountText = this.add.text(20, 20, `Dragons Defeated: ${this.dragonKillCount}`, { fontSize: '20px', fill: '#fff' });

        this.player = this.physics.add.sprite(400, 500, "player");
        this.player.setOrigin(0.5).setScale(0.2).setCollideWorldBounds(true).setDepth(2);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.fireballs = this.physics.add.group();
        this.spawnDragon();

        // Collision detection for dragon touching the player
        this.physics.add.collider(this.player, this.spaceDragon, this.handlePlayerDeath, null, this);

        console.log("✅ Game scene created successfully!");
    }

    spawnDragon() {
        if (this.spaceDragon) {
            this.spaceDragon.destroy();
        }

        let speedMultiplier = 1 + (this.dragonKillCount * 0.1);
        let velocityX = Phaser.Math.Between(-100, 100) * speedMultiplier;
        let velocityY = Phaser.Math.Between(-50, 50) * speedMultiplier;

        this.spaceDragon = this.physics.add.sprite(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 400), "spaceDragon");
        this.spaceDragon.setOrigin(0.5).setScale(0.1).setDepth(1);
        this.spaceDragon.setVelocity(velocityX, velocityY);
        this.spaceDragon.setCollideWorldBounds(true);
        this.spaceDragon.setBounce(1, 1);

        let fireRate = Phaser.Math.Between(1500, 3000) / speedMultiplier;
        this.dragonFireEvent = this.time.addEvent({
            delay: fireRate,
            callback: () => this.shootDragonFireball(),
            loop: true
        });

        this.physics.add.collider(this.fireballs, this.spaceDragon, (fireball, dragon) => {
            fireball.destroy();
            console.log("🐉 Dragon defeated!");
            this.dragonKillCount += 1;
            this.killCountText.setText(`Dragons Defeated: ${this.dragonKillCount}`);
            dragon.destroy();
            this.dragonFireEvent.remove();
            this.time.delayedCall(1000, () => { this.spawnDragon(); });
        });
    }

    shootDragonFireball() {
        if (!this.spaceDragon || !this.spaceDragon.active) return;

        let dragonFireball = this.physics.add.sprite(this.spaceDragon.x, this.spaceDragon.y, "dragonFireball");
        
        let direction = new Phaser.Math.Vector2(this.player.x - this.spaceDragon.x, this.player.y - this.spaceDragon.y);
        direction.normalize();
        dragonFireball.setVelocity(direction.x * 300, direction.y * 300);
        dragonFireball.setScale(0.05);

        this.physics.add.collider(dragonFireball, this.player, this.handlePlayerDeath, null, this);
    }

    handlePlayerDeath() {
        console.log("💀 Player hit! Game Over!");
        this.physics.pause();
        this.add.text(300, 250, "Game Over", { fontSize: '32px', fill: '#ff0000' });
        this.add.text(200, 300, "Press SPACE to Play Again", { fontSize: '24px', fill: '#ffff00' });
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    update() {
        if (!this.player) return;

        if (this.spaceDragon && this.spaceDragon.body) {
            if (this.player.y < this.spaceDragon.y) {
                this.player.setDepth(1);
                this.spaceDragon.setDepth(2);
            } else {
                this.player.setDepth(2);
                this.spaceDragon.setDepth(1);
            }
        }

        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-200);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(200);
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            let fireball = this.fireballs.create(this.player.x, this.player.y, "fireball");
            let velocityX = this.player.body.velocity.x * 2;
            let velocityY = this.player.body.velocity.y * 2;
            if (velocityX === 0 && velocityY === 0) velocityY = -300; 
            fireball.setVelocity(velocityX, velocityY);
            fireball.setScale(0.1);
            console.log("🔥 Fireball launched!");
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#222222",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: true 
        }
    },
    scene: [TitleScene, GameScene]
};

const game = new Phaser.Game(config);