// Import de la feuille de style
import '../assets/css/style.css';
import levelsConfig from '../levels.json'
//import des donné de configuration
import customConfig from '../config.json';
//import des assets de sprites
import ballImgSrc from '../assets/img/ball.png';
import paddleImgSrc from '../assets/img/paddle.png';
import brickImgSrc from '../assets/img/brick.png';
import edgeImgSrc from '../assets/img/edge.webp';
import powerImgSrc from '../assets/img/power.png';
import laserImgSrc from '../assets/img/laser.png';

import Ball from "./Ball";
import GameObject from "./GameObject";
import CollisionType from "./dataType/CollisionType";
import Paddle from "./Paddle";
import Brick from "./Brick";
import PowerUp from "./PowerUP";
import {Laser} from "./laser";

class Game {
    // Contexte de dessin du canvas
    ctx;
    //DONNÉE DES NIVEAUX
    levels;

    images = {
        ball: null,
        paddle: null,
        brick: null,
        edge: null,
        power: null,
        powerPaddle: null,
        laser: null,
    };
    // State (un object qui decrit l'etat actuel du jeu, les balles, les brique encore presente etc ..)
    state = {
        mode: null, // 'single' ou 'multi'
        difficulty: 'normal', // NOUVEAU: niveau de difficulté
        currentPlayer: 1,
        levels: 0,
        score: 0,
        gameStarted: false,
        players: {
            1: { score: 0, life: 3, bricks: [], level: 0 },
            2: { score: 0, life: 3, bricks: [], level: 0 }
        },
        // État actif de la partie en cours
        balls: [],
        bricks: [],
        powers: [],
        laser: [],
        deathEdge: [],
        bouncingEdge: [],
        paddle: null,
        userInput: { paddleLeft: false, paddleRight: false, space: false },
        piercingBall: false,
        stickyBall: false,
        laserCharges: 0
    };

    config = {
        canvasSize: {
            width: 800,
            height: 600
        },
        ball: {
            radius: 10,
            orientation: Math.floor(Math.random() * (120 - 50 + 1)) + 50,
            speed: 3,
            position: {
                x: 400,
                y: 300
            },
            angleAlteration: 35,
            maxSpeed: 12,
            minSpeed: 3,
            speedIncrement: 0.5
        },
        paddleSize: {
            width: 200,
            height: 20
        },
        paddle: {
            speed: 7,
            bigPaddleWidth: 200,
            smallPaddleWidth: 60,
            bigPaddleDuration: 10000,
            color: "#ff007f"
        },
        powerUps: {
            dropChance: 0.3,
            fallSpeed: 2,
            piercingDuration: 10000,
            laserChargesPerPickup: 3
        },
        laser: {
            speed: 7,
            width: 10,
            height: 30,
            count: 3,
            spreadDistance: 25
        },
        bricks: {
            width: 50,
            height: 25,
            startX: 20,
            startY: 20,
            columns: 16
        },
        edges: {
            thickness: 20
        },
        lives: {
            default: 3,
            max: 5
        },
        scoring: {
            brickDestroyed: 1,
            levelBonus: 100,
            lifeBonus: 500
        },
        difficulty: {
            easy: {
                ballSpeed: 4,
                lives: 5,
                powerUpChance: 0.4
            },
            normal: {
                ballSpeed: 6,
                lives: 3,
                powerUpChance: 0.3
            },
            hard: {
                ballSpeed: 8,
                lives: 2,
                powerUpChance: 0.2
            }
        },
        colors: {
            player1: "#ff007f",
            player2: "#00ffff",
            warning: "#ffcc00",
            success: "#00ffcc",
            danger: "#ff0044"
        },
        audio: {
            enabled: true,
            volume: 0.7
        }
    }

    // Timestamp haute résolution de la boucle d'animation
    currentLoopStamp;
    lastSpacePress = false;

    constructor(customConfig = {}, levelsConfig = []) {
        // Fusion profonde des configurations
        this.deepMerge(this.config, customConfig);
        this.levels = levelsConfig;
    }

    // NOUVEAU: Méthode pour fusion profonde des objets
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    // NOUVEAU: Appliquer la difficulté sélectionnée
    applyDifficulty() {
        const diff = this.config.difficulty[this.state.difficulty];
        if (diff) {
            this.config.ball.speed = diff.ballSpeed;
            this.config.powerUps.dropChance = diff.powerUpChance;
            this.state.players[1].life = diff.lives;
            this.state.players[2].life = diff.lives;
        }
    }

    start() {
        this.initHtmlUI();
        this.initImages();
        this.showMenu();
    }

    showMenu() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(13, 2, 17, 0.95)', display: 'flex',
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: '20000'
        });

        overlay.innerHTML = `
        <h1 style="color: #fff; text-shadow: 0 0 20px ${this.config.colors.player1}; margin-bottom: 30px;">GAME.IO</h1>
        
        <div style="margin-bottom: 30px;">
            <h3 style="color: #fff; margin-bottom: 15px;">DIFFICULTÉ</h3>
            <select id="difficultySelect" style="padding: 10px 20px; font-family: 'Syncopate'; font-size: 14px; cursor: pointer; background: #222; color: white; border: 2px solid ${this.config.colors.warning}; border-radius: 5px;">
                <option value="easy">FACILE</option>
                <option value="normal" selected>NORMAL</option>
                <option value="hard">DIFFICILE</option>
            </select>
        </div>
        
        <h3 style="color: #fff; margin-bottom: 15px;">MODE DE JEU</h3>
        <button id="btnSingle" style="padding: 20px 40px; margin: 10px; font-family: 'Syncopate'; cursor: pointer; background: ${this.config.colors.player1}; color: white; border: none; border-radius: 5px; transition: transform 0.2s;">1 JOUEUR</button>
        <button id="btnMulti" style="padding: 20px 40px; margin: 10px; font-family: 'Syncopate'; cursor: pointer; background: ${this.config.colors.player2}; color: #0d0211; border: none; border-radius: 5px; transition: transform 0.2s;">2 JOUEURS (VERSUS)</button>
    `;

        document.body.appendChild(overlay);

        // Effets hover sur les boutons
        const buttons = overlay.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
        });

        overlay.querySelector('#btnSingle').onclick = () => {
            this.state.mode = 'single';
            this.state.difficulty = overlay.querySelector('#difficultySelect').value;
            this.applyDifficulty();
            document.body.removeChild(overlay);
            this.initGameObject(true);
            requestAnimationFrame(this.loop.bind(this));
        };

        overlay.querySelector('#btnMulti').onclick = () => {
            this.state.mode = 'multi';
            this.state.difficulty = overlay.querySelector('#difficultySelect').value;
            this.applyDifficulty();
            document.body.removeChild(overlay);
            this.initGameObject(true);
            requestAnimationFrame(this.loop.bind(this));
        };
    }

    // Méthodes "privées"
    initHtmlUI() {
        const elH1 = document.createElement('h1');
        elH1.textContent = 'GAME.IO';

        const elCanvas = document.createElement('canvas');
        elCanvas.width = this.config.canvasSize.width;
        elCanvas.height = this.config.canvasSize.height;

        document.body.append(elH1, elCanvas);

        // Récupération du contexte de dessin
        this.ctx = elCanvas.getContext('2d');

        // Ecouteur d'èvénement du clavier
        document.addEventListener('keydown', this.handlerKeyboard.bind(this, true));
        document.addEventListener('keyup', this.handlerKeyboard.bind(this, false));

        this.elScore = document.createElement("div");
        this.elScore.style.color = "white";
        this.elScore.style.marginTop = "20px";
        this.elScore.style.fontSize = "20px";
        document.body.append(this.elScore);

        this.updateUI();
    }

    //création des images
    initImages() {
        //ball
        const imgBall = new Image();
        imgBall.src = ballImgSrc;
        this.images.ball = imgBall

        //paddle
        const imgPaddle = new Image();
        imgPaddle.src = paddleImgSrc;
        this.images.paddle = imgPaddle

        //brick
        const imgBrick = new Image();
        imgBrick.src = brickImgSrc;
        this.images.brick = imgBrick

        const imgEdge = new Image();
        imgEdge.src = edgeImgSrc;
        this.images.edge = imgEdge

        const imgPower = new Image();
        imgPower.src = powerImgSrc;
        this.images.power = imgPower;

        const imgLaser = new Image();
        imgLaser.src = laserImgSrc;
        this.images.laser = imgLaser
    }

    updateUI() {
        if (this.state.mode === 'multi') {
            const p1 = this.state.players[1];
            const p2 = this.state.players[2];
            this.elScore.innerHTML = `
            <span style="color: ${this.state.currentPlayer === 1 ? this.config.colors.player1 : '#fff'}">P1: ${p1.score} (${p1.life}♥)</span> | 
            <span style="color: ${this.state.currentPlayer === 2 ? this.config.colors.player2 : '#fff'}">P2: ${p2.score} (${p2.life}♥)</span>
            | <span style="color: ${this.config.colors.warning}">Difficulté: ${this.state.difficulty.toUpperCase()}</span>
        `;
        } else {
            const p = this.state.players[1];
            this.elScore.textContent = `Score : ${this.state.score} | Vies : ${p.life} | Lasers : ${this.state.laserCharges} | Difficulté : ${this.state.difficulty.toUpperCase()}`;
        }
    }

    // Mise en place des object du jeu sur la scene
    initGameObject(newLevel = false) {
        // 1. Réinitialisation des éléments mobiles et effets pour le début du tour
        this.state.balls = [];
        this.state.powers = [];
        this.state.laser = [];
        this.state.piercingBall = false;
        this.state.stickyBall = false;
        this.state.gameStarted = false;
        this.state.laserCharges = 0;

        const p = this.state.players[this.state.currentPlayer];

        this.state.score = p.score;
        this.state.life = p.life;

        if (newLevel) {
            this.state.bricks = [];
            this.loadBricks(this.levels.data[this.state.levels]);

            if (this.state.mode === 'multi') {
                this.state.players[1].bricks = [];
                this.state.players[2].bricks = [];
            }
        }
        else if (this.state.mode === 'multi' && p.bricks && p.bricks.length > 0) {
            this.state.bricks = p.bricks;
        }

        // 4. Initialisation des bords
        this.state.bouncingEdge = [];
        const edgeThickness = this.config.edges.thickness;

        const EdgeTop = new GameObject(this.images.edge, this.config.canvasSize.width, edgeThickness);
        EdgeTop.setPosition(0, 0);

        const EdgeRight = new GameObject(this.images.edge, edgeThickness, this.config.canvasSize.height + 10);
        EdgeRight.setPosition(this.config.canvasSize.width - edgeThickness, edgeThickness);
        EdgeRight.tag = "RightEdge";

        const EdgeLeft = new GameObject(this.images.edge, edgeThickness, this.config.canvasSize.height + 10);
        EdgeLeft.setPosition(0, edgeThickness);
        EdgeLeft.tag = "LeftEdge";

        this.state.bouncingEdge.push(EdgeLeft, EdgeRight, EdgeTop);

        const deathEdge = new GameObject(this.images.edge, this.config.canvasSize.width, edgeThickness);
        deathEdge.setPosition(0, this.config.canvasSize.height + 30);
        this.state.deathEdge = deathEdge;

        // 5. Initialisation du paddle
        this.state.paddle = new Paddle(
            this.images.paddle,
            this.config.paddleSize.width,
            this.config.paddleSize.height,
            0,
            0
        );
        this.state.paddle.setPosition(
            (this.config.canvasSize.width - this.config.paddleSize.width) / 2,
            this.config.canvasSize.height - 60
        );

        const ballDiameter = this.config.ball.radius * 2;
        const ball = new Ball(
            this.images.ball,
            ballDiameter,
            ballDiameter,
            this.config.ball.orientation,
            0 // Vitesse à 0 au départ
        );
        ball.setPosition(this.config.ball.position.x, this.config.ball.position.y);
        ball.isCircular = true;
        this.state.balls.push(ball);

        this.updateUI();
    }

    loadBricks(levelArray) {
        const brickConfig = this.config.bricks;

        for(let line = 0; line < levelArray.length; line++){
            for (let col = 0; col < brickConfig.columns; col++) {
                let brickType = levelArray[line][col]
                if (brickType === 0) continue;

                const brick = new Brick(this.images.brick, brickConfig.width, brickConfig.height, brickType)
                brick.setPosition(
                    brickConfig.startX + (brickConfig.width * col),
                    brickConfig.startY + (brickConfig.height * line)
                );
                this.state.bricks.push(brick)
            }
        }
    }

    checkUserInput() {
        // Détection du tir laser
        if (this.state.userInput.space && !this.lastSpacePress && this.state.laserCharges > 0) {
            const paddleCenter = this.state.paddle.position.x + (this.state.paddle.size.width / 2);
            const laserConfig = this.config.laser;

            // Créer les lasers selon la config
            for (let i = 0; i < laserConfig.count; i++) {
                const offset = (i - (laserConfig.count - 1) / 2) * laserConfig.spreadDistance;
                const laser = new Laser(
                    this.images.laser,
                    laserConfig.width,
                    laserConfig.height,
                    90,
                    laserConfig.speed
                );
                laser.setPosition(
                    paddleCenter + offset - (laserConfig.width / 2),
                    this.state.paddle.position.y - laserConfig.height - 1
                );
                this.state.laser.push(laser);
            }

            this.state.laserCharges--;
            this.updateUI();
        }

        // Mise à jour de l'état précédent de la touche espace
        this.lastSpacePress = this.state.userInput.space;

        // Vérifier si on doit lancer la partie
        if (!this.state.gameStarted && this.state.userInput.space) {
            this.state.gameStarted = true;
            // Lancer toutes les balles
            this.state.balls.forEach(ball => {
                if (ball.speed === 0) {
                    ball.speed = this.config.ball.speed;
                }
            });
        }

        const paddleSpeed = this.config.paddle.speed;

        // Droite
        if(this.state.userInput.paddleRight) {
            this.state.paddle.orientation = 0;
            this.state.paddle.speed = paddleSpeed;
        }
        // Gauche
        if(this.state.userInput.paddleLeft) {
            this.state.paddle.orientation = 180;
            this.state.paddle.speed = paddleSpeed;
        }
        // Ni Droite Ni Gauche
        if(!this.state.userInput.paddleRight && !this.state.userInput.paddleLeft) {
            this.state.paddle.speed = 0;
        }

        this.state.paddle.update();
    }

    // Cycle de vie: 2- Collisions et calculs qui en découlent
    checkCollisions() {
        // Collisions du paddle avec les bords
        this.state.bouncingEdge.forEach(theEdge => {
            const collisionType = this.state.paddle.getCollisionType(theEdge);

            if(collisionType !== CollisionType.HORIZONTAL) return;

            this.state.paddle.speed = 0;

            const edgeBounds = theEdge.getBounds();

            if(theEdge.tag === "RightEdge") {
                this.state.paddle.position.x = edgeBounds.left - 1 - this.state.paddle.size.width;
            }
            else if(theEdge.tag === "LeftEdge") {
                this.state.paddle.position.x = edgeBounds.right + 1;
            }

            this.state.paddle.update();
        });

        this.state.powers = this.state.powers.filter((thePowers) => {
            const collisionType = thePowers.getCollisionType(this.state.paddle);

            if (collisionType === CollisionType.NONE) {
                return true;
            }

            // bonus de la multiball
            if (thePowers.tag === "multiball") {
                const ballDiameter = this.config.ball.radius * 2;
                const ballPower = new Ball(
                    this.images.ball,
                    ballDiameter,
                    ballDiameter,
                    Math.floor(Math.random() * 360),
                    this.config.ball.speed
                );

                ballPower.setPosition(
                    this.state.paddle.position.x + (this.state.paddle.size.width / 2),
                    this.state.paddle.position.y - 40
                );
                ballPower.isCircular = true;
                this.state.balls.push(ballPower);

                return false;
            }

            //bonus du paddle
            if (thePowers.tag === "bigPaddle") {
                this.state.paddle.size.width = this.config.paddle.bigPaddleWidth;

                if (this.paddleTimeout) clearTimeout(this.paddleTimeout);
                this.paddleTimeout = setTimeout(() => {
                    this.state.paddle.size.width = this.config.paddleSize.width;
                }, this.config.paddle.bigPaddleDuration);

                return false;
            }

            // Bonus de la balle perçante
            if (thePowers.tag === "piercingBall") {
                this.state.piercingBall = true;

                if (this.piercingTimeout) clearTimeout(this.piercingTimeout);

                this.piercingTimeout = setTimeout(() => {
                    this.state.piercingBall = false;
                }, this.config.powerUps.piercingDuration);

                return false;
            }

            if (thePowers.tag === "stickyBall") {
                this.state.stickyBall = true;
                return false;
            }

            // Le bonus laser ajoute des charges selon la config
            if (thePowers.tag === "laser") {
                this.state.laserCharges += this.config.powerUps.laserChargesPerPickup;
                this.updateUI();
                return false;
            }

            return false;
        });

        // Collisions des balles avec tous les objets
        const savedBalls = [];

        this.state.balls.forEach(theBall => {
            // Collision de la balle avec le bord de la mort
            if(theBall.getCollisionType(this.state.deathEdge) !== CollisionType.NONE) {
                return;
            }

            savedBalls.push(theBall);

            // Collisions de la balle avec les bords rebondissants
            this.state.bouncingEdge.forEach(theEdge => {
                const collisionType = theBall.getCollisionType(theEdge);

                switch(collisionType) {
                    case CollisionType.NONE:
                        return;

                    case CollisionType.HORIZONTAL:
                        theBall.reverseVelocityX();
                        break;

                    case CollisionType.VERTICAL:
                        theBall.reverseVelocityY();
                        break;

                    default:
                        break;
                }
            });

            // collision de la balle avec les briques
            this.state.bricks.forEach(theBrick => {
                const collisionType = theBall.getCollisionType(theBrick);

                switch(collisionType) {
                    case CollisionType.NONE:
                        return;

                    case CollisionType.HORIZONTAL:
                        if (!this.state.piercingBall || theBrick.type === -1 || theBrick.type === -2) {
                            theBall.reverseVelocityX();
                        }
                        break;

                    case CollisionType.VERTICAL:
                        if (!this.state.piercingBall || theBrick.type === -1 || theBrick.type === -2) {
                            theBall.reverseVelocityY();
                        }
                        break;

                    default:
                        break;
                }

                // Disparition de la brique avec la résistance
                if (theBrick.type !== -1) {
                    theBrick.strength--;

                    if (theBrick.strength === 0) {
                        this.state.score += this.config.scoring.brickDestroyed;
                        this.updateUI();
                    }

                    // Chance d'avoir un bonus selon la config
                    if (Math.random() < this.config.powerUps.dropChance) {
                        this.spawnPowerUp(theBrick.position.x + 10, theBrick.position.y);
                    }
                }
            })

            // Collision avec le paddle
            const paddleCollisionType = theBall.getCollisionType(this.state.paddle);
            switch(paddleCollisionType) {
                case CollisionType.HORIZONTAL:
                    theBall.reverseVelocityX();
                    if (this.state.stickyBall) {
                        theBall.speed = 0;
                        theBall.position.x = this.state.paddle.position.x + 50
                    }
                    break;

                case CollisionType.VERTICAL:
                    if (this.state.stickyBall) {
                        theBall.speed = 0;
                        theBall.position.x = this.state.paddle.position.x + 40

                        if (this.state.userInput.space) {
                            theBall.speed = this.config.ball.speed
                            this.state.stickyBall = false
                        }
                    }
                    // Altération de l'angle en fonction du movement du paddle
                    let alteration = 0;
                    if(this.state.userInput.paddleRight)
                        alteration = -1 * this.config.ball.angleAlteration;
                    else if(this.state.userInput.paddleLeft)
                        alteration = this.config.ball.angleAlteration;

                    theBall.reverseVelocityY(alteration);

                    // Correction pour un résultat de 0 et 180
                    if(theBall.orientation === 0)
                        theBall.orientation = 10;
                    else if(theBall.orientation === 180)
                        theBall.orientation = 170;


                    break;

                default:
                    break;
            }
        });

        this.state.laser = this.state.laser.filter((laser) => {
            let hasHit = false;

            // Vérifier si le laser sort de l'écran
            if (laser.position.y < 0) {
                return false;
            }

            for (let i = 0; i < this.state.bricks.length; i++) {
                const theBrick = this.state.bricks[i];
                const collisionType = laser.getCollisionType(theBrick);

                if (collisionType !== CollisionType.NONE) {
                    // Le laser a touché une brique
                    hasHit = true;

                    // Logique de dégâts sur la brique
                    if (theBrick.type !== -1) {
                        theBrick.strength--;

                        if (theBrick.strength === 0) {
                            this.state.score += this.config.scoring.brickDestroyed;
                            this.updateUI();
                        }

                        // Chance d'avoir un bonus selon la config
                        if (Math.random() < this.config.powerUps.dropChance) {
                            this.spawnPowerUp(theBrick.position.x + 10, theBrick.position.y);
                        }
                    }

                    break;
                }
            }

            return !hasHit;
        });

        this.state.balls = savedBalls;
    }

    // NOUVEAU: Méthode centralisée pour spawn les power-ups
    spawnPowerUp(x, y) {
        const bonusTypes = ['multiball', 'bigPaddle', 'piercingBall', 'stickyBall', 'laser'];
        const bonusType = Math.floor(Math.random() * bonusTypes.length);

        const power = new PowerUp(
            this.images.power,
            32,
            32,
            this.config.powerUps.fallSpeed,
            bonusType
        );
        power.tag = bonusTypes[bonusType];
        power.setPosition(x, y);
        this.state.powers.push(power);
    }

    // Cycle de vie: 3- Mise à jours des données des GameObjects
    updateObjects() {
        // Balles
        this.state.balls.forEach(theBall => {
            theBall.update();
        });

        this.state.powers.forEach((p) => {
            p.update();
            p.updateAnimation();
        });

        this.state.laser.forEach(laser => {
            laser.update();
        })

        //brick
        this.state.bricks = this.state.bricks.filter(theBrick => theBrick.strength !== 0)

        this.state.paddle.updateKeyframe();
    }

    // Cycle de vie: 4- Rendu graphique des GameObjects
    renderObjects() {
        // On efface tous le canvas
        this.ctx.clearRect(
            0,
            0,
            this.config.canvasSize.width,
            this.config.canvasSize.height
        );

        // Dessin des bordures à rebond
        this.state.bouncingEdge.forEach(theEdge => {
            theEdge.draw();
        });

        // Dessin des briques
        this.state.bricks.forEach(theBrick => {
            theBrick.draw();
        });

        // Dessin du paddle
        this.state.paddle.draw();

        // Dessin des balles
        this.state.balls.forEach(theBall => {
            theBall.draw();
        });

        this.state.powers.forEach(p => p.draw());

        this.state.laser.forEach(laser => {
            laser.draw();
        })

        // Afficher un message si la partie n'a pas commencé
        if (!this.state.gameStarted) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            this.ctx.font = "bold 24px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("APPUIE SUR ESPACE POUR COMMENCER", this.config.canvasSize.width / 2, this.config.canvasSize.height / 2);
        }

        // Afficher indicateur de bonus actifs
        this.renderActiveEffects();
    }

    // NOUVEAU: Afficher les effets actifs
    renderActiveEffects() {
        let yOffset = 50;
        this.ctx.font = "14px Arial";
        this.ctx.textAlign = "left";

        if (this.state.piercingBall) {
            this.ctx.fillStyle = this.config.colors.warning;
            this.ctx.fillText("🔥 BALLE PERÇANTE", 30, yOffset);
            yOffset += 20;
        }

        if (this.state.stickyBall) {
            this.ctx.fillStyle = this.config.colors.player2;
            this.ctx.fillText("🧲 BALLE COLLANTE", 30, yOffset);
            yOffset += 20;
        }

        if (this.state.paddle.size.width > this.config.paddleSize.width) {
            this.ctx.fillStyle = this.config.colors.success;
            this.ctx.fillText("📏 GRAND PADDLE", 30, yOffset);
        }
    }

    // Boucle d'animation
    loop(stamp) {
        // Enregistrement du stamp actuel
        this.currentLoopStamp = stamp;

        // Cycle 1
        this.checkUserInput();

        // Cycle 2
        this.checkCollisions();

        // Cycle 3
        this.updateObjects();

        // Cycle 4
        this.renderObjects();

        // Vérification de victoire (toutes les briques détruites)
        const destructibleBricks = this.state.bricks.filter(b => b.type !== -1);
        if (destructibleBricks.length === 0) {
            // Bonus de niveau
            this.state.score += this.config.scoring.levelBonus;
            this.showWinModal();
            return;
        }

        // S'il n'y a aucune balle restante, on a perdu
        if (this.state.balls.length <= 0) {
            const p = this.state.players[this.state.currentPlayer];
            p.life--;

            if (this.state.mode === 'multi') {
                p.bricks = [...this.state.bricks];
                p.score = this.state.score;

                const nextPlayer = this.state.currentPlayer === 1 ? 2 : 1;

                if (this.state.players[nextPlayer].life > 0) {
                    this.state.currentPlayer = nextPlayer;
                }

                if (this.state.players[1].life <= 0 && this.state.players[2].life <= 0) {
                    this.showResultModal();
                    return;
                }
            } else {
                if (p.life <= 0) {
                    this.showDeathModal();
                    return;
                }
            }

            this.updateUI();
            this.initGameObject(false);
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        // Continuer la boucle
        requestAnimationFrame(this.loop.bind(this));
    }

    showWinModal() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: '10000'
        });

        const content = document.createElement('div');
        Object.assign(content.style, {
            textAlign: 'center', padding: '40px', border: `3px solid ${this.config.colors.success}`,
            borderRadius: '15px', backgroundColor: '#111', color: 'white'
        });

        const isLastLevel = this.state.levels >= this.levels.data.length - 1;

        if (isLastLevel) {
            // Bonus de fin de jeu
            const finalScore = this.state.score + (this.state.players[this.state.currentPlayer].life * this.config.scoring.lifeBonus);

            content.innerHTML = `
            <h1 style="color: ${this.config.colors.warning}; margin: 0; font-size: 40px;">FÉLICITATIONS !</h1>
            <p style="margin: 20px 0;">Tu as terminé tous les niveaux du jeu !</p>
            <p style="margin: 20px 0; font-size: 24px;">Score final : ${finalScore}</p>
            <p style="margin: 10px 0; font-size: 14px; color: #888;">
                (Bonus vies restantes : ${this.state.players[this.state.currentPlayer].life} x ${this.config.scoring.lifeBonus} = ${this.state.players[this.state.currentPlayer].life * this.config.scoring.lifeBonus})
            </p>
        `;

            const btnRestart = document.createElement('button');
            btnRestart.innerText = "RECOMMENCER AU DÉBUT";
            Object.assign(btnRestart.style, {
                padding: '15px 30px', fontSize: '16px', cursor: 'pointer',
                backgroundColor: this.config.colors.warning, color: '#111', border: 'none', borderRadius: '5px',
                transition: 'transform 0.2s'
            });
            btnRestart.onmouseover = () => btnRestart.style.transform = 'scale(1.1)';
            btnRestart.onmouseout = () => btnRestart.style.transform = 'scale(1)';
            btnRestart.onclick = () => location.reload();
            content.appendChild(btnRestart);
        } else {
            content.innerHTML = `
            <h1 style="color: ${this.config.colors.success}; margin: 0; font-size: 40px;">NIVEAU COMPLÉTÉ !</h1>
            <p style="margin: 20px 0;">Score actuel : ${this.state.score}</p>
            <p style="margin: 10px 0;">Bonus niveau : +${this.config.scoring.levelBonus}</p>
            <p style="margin: 20px 0;">Prêt pour la suite ?</p>
        `;

            const btnNext = document.createElement('button');
            btnNext.innerText = "NIVEAU SUIVANT";
            Object.assign(btnNext.style, {
                padding: '15px 30px', fontSize: '16px', cursor: 'pointer',
                backgroundColor: this.config.colors.success, color: '#111', border: 'none', borderRadius: '5px',
                transition: 'transform 0.2s'
            });
            btnNext.onmouseover = () => btnNext.style.transform = 'scale(1.1)';
            btnNext.onmouseout = () => btnNext.style.transform = 'scale(1)';
            btnNext.onclick = () => {
                document.body.removeChild(overlay);
                this.state.levels++;
                this.state.players[this.state.currentPlayer].score = this.state.score;
                this.initGameObject(true);
                requestAnimationFrame(this.loop.bind(this));
            };
            content.appendChild(btnNext);
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    showDeathModal() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000',
            fontFamily: 'Arial, sans-serif',
            backdropFilter: 'blur(10px)'
        });

        const content = document.createElement('div');
        Object.assign(content.style, {
            textAlign: 'center',
            padding: '50px',
            border: `3px solid ${this.config.colors.danger}`,
            borderRadius: '20px',
            backgroundColor: '#111',
            boxShadow: `0 0 30px ${this.config.colors.danger}`
        });

        content.innerHTML = `
            <h1 style="color: ${this.config.colors.danger}; font-size: 50px; margin: 0 0 10px 0; text-transform: uppercase;">
                Kabooooooom !!!
            </h1>
            <p style="color: white; font-size: 18px; margin-bottom: 10px;">
                Toutes les balles ont été pulvérisées.
            </p>
            <p style="color: ${this.config.colors.warning}; font-size: 24px; margin-bottom: 30px;">
                Score final : ${this.state.score}
            </p>
        `;

        const btn = document.createElement('button');
        btn.innerText = "TENTER MA CHANCE À NOUVEAU";
        Object.assign(btn.style, {
            padding: '15px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: this.config.colors.danger,
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            transition: '0.3s'
        });

        btn.onmouseover = () => btn.style.transform = "scale(1.1)";
        btn.onmouseout = () => btn.style.transform = "scale(1)";
        btn.onclick = () => location.reload();

        content.appendChild(btn);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        document.body.style.animation = "shake 0.5s";

        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            @keyframes shake {
                0% { transform: translate(1px, 1px) rotate(0deg); }
                10% { transform: translate(-1px, -2px) rotate(-1deg); }
                30% { transform: translate(3px, 2px) rotate(0deg); }
                50% { transform: translate(-1px, 2px) rotate(1deg); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    showResultModal() {
        const p1 = this.state.players[1];
        const p2 = this.state.players[2];
        let winnerText = "";
        let winnerColor = "";

        if (p1.score > p2.score) {
            winnerText = "JOUEUR 1 GAGNE !";
            winnerColor = this.config.colors.player1;
        } else if (p2.score > p1.score) {
            winnerText = "JOUEUR 2 GAGNE !";
            winnerColor = this.config.colors.player2;
        } else {
            winnerText = "ÉGALITÉ !";
            winnerColor = this.config.colors.warning;
        }

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000',
            backdropFilter: 'blur(10px)'
        });

        const content = document.createElement('div');
        Object.assign(content.style, {
            textAlign: 'center',
            padding: '50px',
            border: `3px solid ${winnerColor}`,
            borderRadius: '20px',
            backgroundColor: '#111',
            boxShadow: `0 0 30px ${winnerColor}`
        });

        content.innerHTML = `
            <h1 style="color: ${winnerColor}; font-size: 50px; margin: 0 0 30px 0; text-transform: uppercase; text-shadow: 0 0 20px ${winnerColor};">
                ${winnerText}
            </h1>
            <div style="margin-bottom: 30px;">
                <p style="color: ${this.config.colors.player1}; font-size: 24px; margin: 10px 0;">
                    JOUEUR 1 : ${p1.score} points
                </p>
                <p style="color: ${this.config.colors.player2}; font-size: 24px; margin: 10px 0;">
                    JOUEUR 2 : ${p2.score} points
                </p>
            </div>
        `;

        const btn = document.createElement('button');
        btn.innerText = "REJOUER";
        Object.assign(btn.style, {
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: winnerColor,
            color: winnerColor === this.config.colors.player2 ? '#0d0211' : 'white',
            border: 'none',
            borderRadius: '5px',
            transition: '0.3s',
            textTransform: 'uppercase'
        });

        btn.onmouseover = () => btn.style.transform = "scale(1.1)";
        btn.onmouseout = () => btn.style.transform = "scale(1)";
        btn.onclick = () => location.reload();

        content.appendChild(btn);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    // Gestionnaire d'évenement
    handlerKeyboard(isActive, evt) {
        //fleche droite
        if (evt.key === 'Right' || evt.key === 'ArrowRight') {
            if (isActive && this.state.userInput.paddleLeft) {
                this.state.userInput.paddleLeft = false;
            }
            this.state.userInput.paddleRight = isActive;
        }

        if (evt.key === 'ArrowLeft' || evt.key === 'Left') {
            if (isActive && this.state.userInput.paddleRight) {
                this.state.userInput.paddleRight = false;
            }
            this.state.userInput.paddleLeft = isActive;
        }

        if (evt.key === ' ' || evt.key === 'Spacebar') {
            evt.preventDefault();
            this.state.userInput.space = isActive;
        }
    }
}

const theGame = new Game(customConfig, levelsConfig);

export default theGame;