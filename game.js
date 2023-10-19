let game


const gameOptions = {
    playerGravity: 800,
    playerSpeed: 300,
    enemySpeed: 150
}

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#99ccff",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 3000,
            height: 1300,
        },
        pixelArt: true,
        physics: {
            default: "arcade",
            arcade: {
                debug: false,
                gravity: {
                    y: 0
                }
            }
        },
        scene: PlayGame
    }
    game = new Phaser.Game(gameConfig)
    window.focus();
}

class PlayGame extends Phaser.Scene {

    constructor() {
        super("PlayGame")
    }

    preload() {
        const playerBodySprite = this.load.image("playerBody", "assets/tank_model_1_1_b.png")
        this.load.image("playerGun", "assets/tank_model_1_3_w1.png")

        this.load.image("enemyBody", "assets/tank_model_4_1_b.png")
        this.load.image("enemyGun", "assets/tank_model_4_3_w1.png")
    }

    create() {


        const graphics = this.add.graphics();
        const mapWidth = game.config.width;
        const mapHeight = game.config.height;
        let playerScore = 0;
        document.getElementById("score").innerHTML = "Score: " + playerScore

        this.firingCooldown = false;
        this.nextShotAt = 0;
        this.shotDelay = 1000
        this.hasPowerUp = false;
        this.multiShot = false;

        this.enemyNextShotAt = 0;
        this.enemyShotDelay = 1000;


        graphics.lineStyle(80, 0x00ff00, 1);

        let linePoints = [-10000, mapHeight / 1.5, mapWidth + 10000, mapHeight / 1.5];           //Remnants of procedurally generated map, scrapped for linear level for weekly task completion

        const mapMiddleX = linePoints[2] - (linePoints[2] - linePoints[0]) / 2;
        const mapMiddleY = linePoints[3] - (linePoints[3] - linePoints[1]) / 2;

        graphics.lineBetween(linePoints[0], linePoints[1], linePoints[2], linePoints[3])

        let zones = this.physics.add.staticGroup();
        zones.add(this.add.zone(mapMiddleX, mapMiddleY, mapWidth * 4, 80))


        this.playerTank = this.physics.add.sprite(mapMiddleX, mapMiddleY - 200, "playerBody");
        this.playerGun = this.physics.add.sprite(mapMiddleX, mapMiddleY - 200, "playerGun").setOrigin(0.6, 0.5);

        this.playerTank.setScale(0.45)
        this.playerGun.setScale(0.75)

        this.playerTank.body.setSize(200,125)
        this.playerGun.setSize(140,90)

        this.playerGun.flipX = true;

        this.playerTank.body.gravity.y = gameOptions.playerGravity;
        this.physics.add.collider(this.playerTank, zones)

        this.bullets = this.add.group();
        this.enemyBullets = this.add.group();
        this.rightTanks = this.add.group();
        this.leftTanks = this.add.group();

        this.physics.add.overlap(this.bullets, zones, destroyBullets, null, this)

        this.cursors = this.input.keyboard.createCursorKeys();
        this.restartKey = this.input.keyboard.addKey("R");
                
        this.powerUps = this.physics.add.group();
        this.physics.add.collider(this.powerUps, zones)


        for(let i = 1; i < 5; i++) {
            const enemyTank = this.add.sprite(30, 35, "enemyBody");                  // Setting up enemy tanks
            const enemyGun = this.add.sprite(30, 22, "enemyGun").setOrigin(0.6, 0.5);
            const enemyCooldown = Math.floor(Math.random() * 4000 + 1000);

            enemyTank.setScale(0.45)
            enemyGun.setScale(0.75)
            enemyGun.flipX = true;

            this.enemyContainerRight = this.add.container(mapMiddleX + 200 * 5 + 100 * i ** 2, mapMiddleY - 100, [enemyTank, enemyGun]);

            this.enemyContainerRight.setData("Cooldown", enemyCooldown)
            this.enemyContainerRight.setData("NextShotAt", this.enemyNextShotAt)

            this.physics.world.enable(this.enemyContainerRight);
            this.enemyContainerRight.body.gravity.y = gameOptions.playerGravity;
            this.physics.add.collider(this.enemyContainerRight, zones)

            this.physics.add.overlap(this.bullets, this.enemyContainerRight, destroyTank, null, this)
            this.rightTanks.add(this.enemyContainerRight)
            // Later add overlap if playertank hits enemytank => damage? death?
        }

        for(let i = 1; i < 5; i++) {
            const enemyTank = this.add.sprite(30, 35, "enemyBody");                  // Setting up enemy tanks
            const enemyGun = this.add.sprite(60, 22, "enemyGun").setOrigin(0.6, 0.5);
            enemyTank.setScale(0.45)
            enemyGun.setScale(0.75)
            enemyTank.flipX = true;

            this.enemyContainerLeft = this.add.container(mapMiddleX - 200 * 5 - 100 * i ** 2, mapMiddleY - 100, [enemyTank, enemyGun]);
            this.physics.world.enable(this.enemyContainerLeft);
            this.enemyContainerLeft.body.gravity.y = gameOptions.playerGravity;
            this.physics.add.collider(this.enemyContainerLeft, zones)

            this.physics.add.overlap(this.bullets, this.enemyContainerLeft, destroyTank, null, this)
            this.physics.add.overlap(this.enemyBullets, zones, destroyBullets, null, this)
            this.leftTanks.add(this.enemyContainerLeft)
            // Later add overlap if playertank hits enemytank => damage? death?
        }

        function destroyBullets(bullet) {
            bullet.destroy()
        }

        function destroyTank(bullet, enemyContainer) {
            playerScore += 1;
            if(playerScore == 1) {
                let powerUp = this.add.circle(enemyContainer.body.x, 800, 25, 0x0b03fc).setData("Type", 1);
                this.powerUps.add(powerUp);

                this.physics.add.overlap(powerUp, this.playerTank, null, getPowerUp, this);
            }

            if(playerScore == 5) {
                let powerUp = this.add.circle(enemyContainer.body.x, 800, 25, 0xFF0000).setData("Type", 2);
                this.powerUps.add(powerUp);

                this.physics.add.overlap(powerUp, this.playerTank, null, getPowerUp, this);
            }
            enemyContainer.destroy();
            bullet.destroy();
            document.getElementById("score").innerHTML = "Score: " + playerScore
        }

        function getPowerUp(powerUp, playerTank) {
            if(powerUp.data.get("Type") == 1) {
                this.shotDelay = 200;
            }
            if(powerUp.data.get("Type") == 2) {
                this.multiShot = true;
            }
            this.powerUpEndTime = this.time.now + 5000;
            this.hasPowerUp = true;
            powerUp.destroy();
        }
    }



    update() {
        if(this.enemyContainerRight.body) {
            this.rightTanks.getChildren().forEach(enemy => {
                enemy.body.velocity.x = -gameOptions.enemySpeed;
            })
        }
        if(this.enemyContainerLeft.body) {
            this.leftTanks.getChildren().forEach(enemy => {
                enemy.body.velocity.x = gameOptions.enemySpeed;
            })
        }

        this.playerGun.body.x = this.playerTank.body.x - 21;
        this.playerGun.body.y = this.playerTank.body.y - 20;

        let mouseX = game.input.mousePointer.x;
        let mouseY = game.input.mousePointer.y;

        let angle = Phaser.Math.Angle.Between(this.playerGun.x, this.playerGun.y, mouseX, mouseY)
        this.playerGun.rotation = angle + Math.PI;

        let offset = new Phaser.Geom.Point(-50, -this.playerGun.height + 200);
        Phaser.Math.Rotate(offset, this.playerGun.rotation);


        if(this.nextShotAt > this.time.now) {                                   //Firing cooldown timer
            this.firingCooldown = true;
        } else {
            this.firingCooldown = false;
        }


        if(this.input.mousePointer.isDown && !this.firingCooldown) {            //Player firing
            this.bulletSpeed = 300;

            let firingVector = new Phaser.Math.Vector2(mouseX - this.playerGun.x, mouseY - this.playerGun.y)

            let bullet = this.add.circle(this.playerGun.x + offset.x, this.playerGun.y + offset.y, 5, 0xffff00);
            this.physics.add.existing(bullet);

            firingVector.setLength(this.bulletSpeed)
            bullet.body.setVelocity(firingVector.x, firingVector.y)
            console.log(firingVector)

            this.bullets.add(bullet)

            if(this.multiShot) {
                bullet = this.add.circle(this.playerGun.x + offset.x, this.playerGun.y + offset.y, 5, 0xffff00);
                this.physics.add.existing(bullet);
                firingVector.rotate(Math.PI / 8)
                bullet.body.setVelocity(firingVector.x, firingVector.y)

                this.bullets.add(bullet)

                bullet = this.add.circle(this.playerGun.x + offset.x, this.playerGun.y + offset.y, 5, 0xffff00);
                this.physics.add.existing(bullet);
                firingVector.rotate(14 * Math.PI / 8)
                bullet.body.setVelocity(firingVector.x, firingVector.y)

                this.bullets.add(bullet)
            }

            this.nextShotAt = this.time.now + this.shotDelay;
        }

        
        this.rightTanks.getChildren().forEach(tank =>{

            if(tank.data.get("NextShotAt") < this.time.now) {
                let enemyBullet = this.add.circle(tank.body.x - 15, tank.body.y + 23, 5, 0xFF9900)

                this.physics.add.existing(enemyBullet);
                enemyBullet.body.setVelocity(-200,0)
                //enemyBullet.body.gravity.y = gameOptions.playerGravity / 85;

                this.enemyBullets.add(enemyBullet)
                this.enemyNextShotAt = this.time.now + tank.data.get("Cooldown");
                tank.setData("NextShotAt", this.enemyNextShotAt)

            }
        })

        


        this.bullets.getChildren().forEach(bullet => {
            if(bullet.x > game.config.width){
              bullet.destroy();
            }
        })

        this.enemyBullets.getChildren().forEach(bullet => {
            if(bullet.x > game.config.width | bullet.x < 0){
              bullet.destroy();
            }
        })

        if(this.hasPowerUp && this.powerUpEndTime < this.time.now) {
            this.shotDelay = 1000;
            this.multiShot = false;
            this.hasPowerUp = false;
        }

        if(this.cursors.left.isDown) {
            this.playerTank.body.velocity.x = -gameOptions.playerSpeed;
            this.playerTank.flipX = false;
        }
        else if(this.cursors.right.isDown) {
            this.playerTank.body.velocity.x = gameOptions.playerSpeed;
            this.playerTank.flipX = true;
        }
        else {
            this.playerTank.body.velocity.x = 0;
        }

        if(this.cursors.up.isDown && this.playerTank.body.velocity.y == 0) {
            this.playerTank.body.velocity.y = -gameOptions.playerSpeed * 2.5;
        }

        if(this.restartKey.isDown) {
            this.scene.start("PlayGame");
        }
    }
}