// Phaser 3 game setup
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#222222", // Set a background color to ensure rendering
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    console.log("📥 Loading assets...");

    this.load.image("background", "assets/backgrounds/space-bg.png");
    this.load.image("player", "assets/characters/player.png");
    this.load.image("spaceDragon", "assets/enemies/space-dragon.png");
    this.load.image("fireball", "assets/effects/fireball.png"); // Load fireball attack sprite
    this.load.image("dragonFireball", "assets/effects/dragon-fireball.png"); // Load dragon fireball

    this.load.on("complete", () => {
        console.log("✅ All assets loaded!", this.textures.list);
    });
}

function spawnDragon(scene) {
    if (scene.spaceDragon) {
        scene.spaceDragon.destroy(); // Remove old dragon before spawning new one
    }

    let speedMultiplier = 1 + (scene.dragonKillCount * 0.1); // Increase speed by 10% per kill
    let velocityX = Phaser.Math.Between(-100, 100) * speedMultiplier;
    let velocityY = Phaser.Math.Between(-50, 50) * speedMultiplier;

    scene.spaceDragon = scene.physics.add.sprite(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 400), "spaceDragon");
    scene.spaceDragon.setOrigin(0.5).setScale(0.1).setDepth(1);
    scene.spaceDragon.setVelocity(velocityX, velocityY);
    scene.spaceDragon.setCollideWorldBounds(true);
    scene.spaceDragon.setBounce(1, 1);

    // Start dragon fireball attack
    let fireRate = Phaser.Math.Between(1500, 3000) / speedMultiplier; // Fire rate increases as dragons are defeated
    scene.dragonFireEvent = scene.time.addEvent({
        delay: fireRate,
        callback: () => shootDragonFireball(scene),
        loop: true
    });

    // Collision detection between fireballs and the dragon
    scene.physics.add.collider(scene.fireballs, scene.spaceDragon, (fireball, dragon) => {
        fireball.destroy(); // Remove fireball on collision
        console.log("🐉 Dragon defeated!");
        scene.dragonKillCount += 1; // Increment kill count
        scene.killCountText.setText(`Dragons Defeated: ${scene.dragonKillCount}`); // Update UI
        dragon.destroy(); // Remove dragon
        scene.dragonFireEvent.remove(); // Stop dragon's fireball attack
        scene.time.delayedCall(1000, () => { spawnDragon(scene); }); // Respawn after delay
    });
}

function shootDragonFireball(scene) {
    if (!scene.spaceDragon || !scene.spaceDragon.active) return;

    let dragonFireball = scene.physics.add.sprite(scene.spaceDragon.x, scene.spaceDragon.y, "dragonFireball");
    dragonFireball.setVelocityY(300);
    dragonFireball.setScale(0.05);

    scene.physics.add.collider(dragonFireball, scene.player, () => {
        console.log("💀 Player hit! Game Over!");
        scene.physics.pause();
        scene.add.text(300, 250, "Game Over", { fontSize: '32px', fill: '#ff0000' });
    });
}

function create() {
    console.log("🎮 Creating game scene...");

    // Background
    this.add.image(400, 300, "background").setOrigin(0.5);

    // Counter for tracking defeated dragons
    this.dragonKillCount = 0;

    // Display dragon kill count
    this.killCountText = this.add.text(20, 20, `Dragons Defeated: ${this.dragonKillCount}`, {
        fontSize: '20px',
        fill: '#fff'
    });

    // Adjusted Player setup with proper scaling and higher depth
    this.player = this.physics.add.sprite(400, 500, "player");
    this.player.setOrigin(0.5).setScale(0.1).setCollideWorldBounds(true).setDepth(2); // Player placed at higher depth

    // Enable keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Fireball attack group
    this.fireballs = this.physics.add.group();

    // Spawn first dragon after defining function
    spawnDragon(this);

    console.log("✅ Game scene created successfully!");
}

function update() {
    if (!this.player) return;

    // Ensure player is always in front of the enemy when moving
    if (this.spaceDragon && this.spaceDragon.body) {
        if (this.player.y < this.spaceDragon.y) {
            this.player.setDepth(1);
            this.spaceDragon.setDepth(2);
        } else {
            this.player.setDepth(2);
            this.spaceDragon.setDepth(1);
        }
    }

    // Player movement
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

    // Fireball attack when SPACE is pressed
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        let fireball = this.fireballs.create(this.player.x, this.player.y, "fireball");
        fireball.setVelocityY(-300);
        fireball.setScale(0.05);
        console.log("🔥 Fireball launched!");
    }
}
