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

import Ball from "./Ball";
import GameObject from "./GameObject";
import CollisionType from "./dataType/CollisionType";
import Paddle from "./Paddle";
import Brick from "./Brick";
import PowerUp from "./PowerUP";

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
    };
    // State (un object qui decrit l'etat actuel du jeu, les balles, les brique encore presente etc ..)
    state = {
        mode: null, // 'single' ou 'multi'
        currentPlayer: 1,
        levels: 0, // AJOUT: niveau actuel
        score: 0, // AJOUT: score global
        gameStarted: false, // AJOUT: indique si la partie a commencé
        // On crée un objet par joueur pour stocker leur progression propre
        players: {
            1: { score: 0, life: 3, bricks: [], level: 0 },
            2: { score: 0, life: 3, bricks: [], level: 0 }
        },
        // État actif de la partie en cours
        balls: [],
        bricks: [],
        powers: [],
        deathEdge: [],
        bouncingEdge: [],
        paddle: null,
        userInput: { paddleLeft: false, paddleRight: false, space: false },
        piercingBall: false,
        stickyBall: false
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
            angleAlteration: 35
        },
        paddleSize: {
            width: 200,
            height: 20
        }
    }

    // Timestamp haute résolution de la boucle d'animation
    currentLoopStamp;

    constructor(customConfig = {}, levelsConfig = []) {
        Object.assign(this.config, customConfig);
        this.levels = levelsConfig
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
        <h1 style="color: #fff; text-shadow: 0 0 20px #ff007f; margin-bottom: 50px;">CHOISIR MODE</h1>
        <button id="btnSingle" style="padding: 20px 40px; margin: 10px; font-family: 'Syncopate'; cursor: pointer; background: #ff007f; color: white; border: none; border-radius: 5px;">1 JOUEUR</button>
        <button id="btnMulti" style="padding: 20px 40px; margin: 10px; font-family: 'Syncopate'; cursor: pointer; background: #00ffff; color: #0d0211; border: none; border-radius: 5px;">2 JOUEURS (VERSUS)</button>
    `;

        document.body.appendChild(overlay);

        overlay.querySelector('#btnSingle').onclick = () => {
            this.state.mode = 'single';
            document.body.removeChild(overlay);
            this.initGameObject(true);
            requestAnimationFrame(this.loop.bind(this));
        };

        overlay.querySelector('#btnMulti').onclick = () => {
            this.state.mode = 'multi';
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
    }

    updateUI() {
        if (this.state.mode === 'multi') {
            const p1 = this.state.players[1];
            const p2 = this.state.players[2];
            this.elScore.innerHTML = `
            <span style="color: ${this.state.currentPlayer === 1 ? '#ff007f' : '#fff'}">P1: ${p1.score} (${p1.life}♥)</span> | 
            <span style="color: ${this.state.currentPlayer === 2 ? '#00ffff' : '#fff'}">P2: ${p2.score} (${p2.life}♥)</span>
        `;
        } else {
            const p = this.state.players[1];
            this.elScore.textContent = `Score : ${this.state.score} | Vies : ${p.life}`;
        }
    }

    // Mise en place des object du jeu sur la scene
    initGameObject(newLevel = false) {
        // 1. Réinitialisation des éléments mobiles et effets pour le début du tour
        this.state.balls = [];
        this.state.powers = [];
        this.state.piercingBall = false;
        this.state.stickyBall = false;
        this.state.gameStarted = false; // AJOUT: On attend que le joueur appuie sur espace

        // Récupération des données du joueur actuel
        const p = this.state.players[this.state.currentPlayer];

        // 2. SYNCHRONISATION : On met à jour le score et les vies globales avec ceux du joueur actif
        this.state.score = p.score;
        this.state.life = p.life;

        // 3. GESTION DES BRIQUES (Persistance par joueur)
        if (newLevel) {
            // Cas : Nouveau niveau ou début de partie
            this.state.bricks = [];
            this.loadBricks(this.levels.data[this.state.levels]);

            // Si on est en mode multi, on s'assure que le joueur 2 commencera avec le même état
            if (this.state.mode === 'multi') {
                this.state.players[1].bricks = [];
                this.state.players[2].bricks = [];
            }
        }
        else if (this.state.mode === 'multi' && p.bricks && p.bricks.length > 0) {
            // Cas : Changement de tour en multi.
            this.state.bricks = p.bricks;
        }

        // 4. Initialisation des bords
        this.state.bouncingEdge = [];
        const EdgeTop = new GameObject(this.images.edge, this.config.canvasSize.width, 20);
        EdgeTop.setPosition(0, 0);

        const EdgeRight = new GameObject(this.images.edge, 20, this.config.canvasSize.height + 10);
        EdgeRight.setPosition(this.config.canvasSize.width - 20, 20);
        EdgeRight.tag = "RightEdge";

        const EdgeLeft = new GameObject(this.images.edge, 20, this.config.canvasSize.height + 10);
        EdgeLeft.setPosition(0, 20);
        EdgeLeft.tag = "LeftEdge";

        this.state.bouncingEdge.push(EdgeLeft, EdgeRight, EdgeTop);

        const deathEdge = new GameObject(this.images.edge, this.config.canvasSize.width, 20);
        deathEdge.setPosition(0, this.config.canvasSize.height + 30);
        this.state.deathEdge = deathEdge;

        // 5. Initialisation du paddle
        this.state.paddle = new Paddle(this.images.paddle, this.config.paddleSize.width, this.config.paddleSize.height, 0, 0);
        this.state.paddle.setPosition(350, 560);

        // 6. Initialisation de la balle (elle reste immobile jusqu'à l'appui sur espace)
        const ballDiameter = this.config.ball.radius * 2;
        const ball = new Ball(
            this.images.ball,
            ballDiameter,
            ballDiameter,
            this.config.ball.orientation,
            0 // MODIFICATION: vitesse à 0 au départ
        );
        ball.setPosition(this.config.ball.position.x, this.config.ball.position.y);
        ball.isCircular = true;
        this.state.balls.push(ball);

        this.updateUI();
    }

    //création des brick
    loadBricks(levelArray) {
        for(let line = 0; line < levelArray.length; line++){
            for (let col = 0; col < 16; col++) {
                let brickType = levelArray[line][col]
                if (brickType === 0) continue;

                const brick = new Brick(this.images.brick, 50, 25, brickType)
                brick.setPosition(
                    20 + (50 * col),
                    20 + (25 * line)
                );
                this.state.bricks.push(brick)
            }
        }
    }

    checkUserInput() {
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

        // Droite
        if(this.state.userInput.paddleRight) {
            this.state.paddle.orientation = 0;
            this.state.paddle.speed = 7;
        }
        // Gauche
        if(this.state.userInput.paddleLeft) {
            this.state.paddle.orientation = 180;
            this.state.paddle.speed = 7;
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
                this.state.paddle.size.width = 200;

                if (this.paddleTimeout) clearTimeout(this.paddleTimeout);
                this.paddleTimeout = setTimeout(() => {
                    this.state.paddle.size.width = 100;
                }, 10000);

                return false;
            }

            // Bonus de la balle perçante
            if (thePowers.tag === "piercingBall") {
                this.state.piercingBall = true;

                if (this.piercingTimeout) clearTimeout(this.piercingTimeout);

                this.piercingTimeout = setTimeout(() => {
                    this.state.piercingBall = false;
                }, 10000);

                return false;
            }

            if (thePowers.tag === "stickyBall") {
                this.state.stickyBall = true;
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

                // Disparition de la brique avec la récistance
                if (theBrick.type !== -1) {
                    theBrick.strength--;

                    if (theBrick.strength === 0) {
                        this.state.score++;
                        this.elScore.textContent = `Score : ${this.state.score}`;
                        this.elScore.style.fontSize = "20px";
                        this.elScore.style.marginTop = "20px";
                    }

                    const rand = Math.random();

                    if (rand < 0.075) {
                        const power = new PowerUp(this.images.power, 32, 32, 2, 0);
                        power.setPosition(theBrick.position.x + 10, theBrick.position.y);
                        power.tag = "multiball";
                        this.state.powers.push(power);
                    } else if (rand < 0.15) {
                        const power1 = new PowerUp(this.images.power, 32, 32, 2, 1);
                        power1.setPosition(theBrick.position.x + 10, theBrick.position.y);
                        power1.tag = "bigPaddle";
                        this.state.powers.push(power1);
                    } else if (rand < 0.225) {
                        const power2 = new PowerUp(this.images.power, 32, 32, 2, 2);
                        power2.setPosition(theBrick.position.x + 10, theBrick.position.y);
                        power2.tag = "piercingBall";
                        this.state.powers.push(power2);
                    } else if (rand < 0.3) {
                        const power3 = new PowerUp(this.images.power, 32, 32, 2, 3);
                        power3.setPosition(theBrick.position.x + 10, theBrick.position.y);
                        power3.tag = "stickyBall";
                        this.state.powers.push(power3);
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

        this.state.balls = savedBalls;
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

        // AJOUT: Afficher un message si la partie n'a pas commencé
        if (!this.state.gameStarted) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            this.ctx.font = "bold 24px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("APPUIE SUR ESPACE POUR COMMENCER", this.config.canvasSize.width / 2, this.config.canvasSize.height / 2);
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
        if (this.state.bricks.length === 0) {
            this.showWinModal();
            return;
        }

        // S'il n'y a aucune balle restante, on a perdu
        if (this.state.balls.length <= 0) {
            const p = this.state.players[this.state.currentPlayer];
            p.life--;

            if (this.state.mode === 'multi') {
                // Sauvegarder la progression du joueur actuel
                p.bricks = [...this.state.bricks];
                p.score = this.state.score;

                // Tenter de passer à l'autre joueur
                const nextPlayer = this.state.currentPlayer === 1 ? 2 : 1;

                if (this.state.players[nextPlayer].life > 0) {
                    this.state.currentPlayer = nextPlayer;
                }

                // Si les deux n'ont plus de vies, Game Over
                if (this.state.players[1].life <= 0 && this.state.players[2].life <= 0) {
                    this.showResultModal();
                    return;
                }
            } else {
                // Mode solo
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
            textAlign: 'center', padding: '40px', border: '3px solid #00ffcc',
            borderRadius: '15px', backgroundColor: '#111', color: 'white'
        });

        const isLastLevel = this.state.levels >= this.levels.data.length - 1;

        if (isLastLevel) {
            content.innerHTML = `
            <h1 style="color: #ffcc00; margin: 0; font-size: 40px;">FÉLICITATIONS !</h1>
            <p style="margin: 20px 0;">Tu as terminé tous les niveaux du jeu !</p>
        `;

            const btnRestart = document.createElement('button');
            btnRestart.innerText = "RECOMMENCER AU DÉBUT";
            Object.assign(btnRestart.style, {
                padding: '15px 30px', fontSize: '16px', cursor: 'pointer',
                backgroundColor: '#ffcc00', color: '#111', border: 'none', borderRadius: '5px'
            });
            btnRestart.onclick = () => location.reload();
            content.appendChild(btnRestart);
        } else {
            content.innerHTML = `
            <h1 style="color: #00ffcc; margin: 0; font-size: 40px;">NIVEAU COMPLÉTÉ !</h1>
            <p style="margin: 20px 0;">Prêt pour la suite ?</p>
        `;

            const btnNext = document.createElement('button');
            btnNext.innerText = "NIVEAU SUIVANT";
            Object.assign(btnNext.style, {
                padding: '15px 30px', fontSize: '16px', cursor: 'pointer',
                backgroundColor: '#00ffcc', color: '#111', border: 'none', borderRadius: '5px'
            });
            btnNext.onclick = () => {
                document.body.removeChild(overlay);
                this.state.levels++;
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
            border: '3px solid #ff0044',
            borderRadius: '20px',
            backgroundColor: '#111',
            boxShadow: '0 0 30px #ff0044'
        });

        content.innerHTML = `
            <h1 style="color: #ff0044; font-size: 50px; margin: 0 0 10px 0; text-transform: uppercase;">
                Kabooooooom !!!
            </h1>
            <p style="color: white; font-size: 18px; margin-bottom: 30px;">
                Toutes les balles ont été pulvérisées.
            </p>
        `;

        const btn = document.createElement('button');
        btn.innerText = "TENTER MA CHANCE À NOUVEAU";
        Object.assign(btn.style, {
            padding: '15px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: '#ff0044',
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
            winnerColor = "#ff007f";
        } else if (p2.score > p1.score) {
            winnerText = "JOUEUR 2 GAGNE !";
            winnerColor = "#00ffff";
        } else {
            winnerText = "ÉGALITÉ !";
            winnerColor = "#ffcc00";
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
                <p style="color: #ff007f; font-size: 24px; margin: 10px 0;">
                    JOUEUR 1 : ${p1.score} points
                </p>
                <p style="color: #00ffff; font-size: 24px; margin: 10px 0;">
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
            color: winnerColor === '#00ffff' ? '#0d0211' : 'white',
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