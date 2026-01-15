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
import Ball from "./Ball";
import GameObject from "./GameObject";
import CollisionType from "./dataType/CollisionType";
import Paddle from "./Paddle";
import Brick from "./Brick";



class Game {
    // Contexte de dessin du canvas
    ctx;
    //DONNÉE DES NIVEAUX
    levels;

    images = {
        ball: null,
        paddle: null,
        brick: null,
        edge: null
    };
    // State (un object qui decrit l'etat actuel du jeu, les balles, les brique encore presente etc ..)
    state = {
        // Balles (plusieurs car possible multiball)
        balls: [],
        //bordure de la loose
        deathEdge: [],
        bouncingEdge: [],
        paddle: null,
        // entrée utilisateur
        userInput: {
            paddleLeft: false,
            paddleRight: false
        },
        bricks: [],
        levels: 0,
        score: 0
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
            width: 100,
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
        console.log('Jeu démarré ...');
        //initialisation de l'interface html
        this.initHtmlUI();
        //Initilisation des images
        this.initImages()
        //initialisation des objet du jeu
        this.initGameObject()
        //lancement de la boucle
        requestAnimationFrame(this.loop.bind(this));
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

        this.elScore = document.createElement("span");
        this.elScore.style.color = "white"; // Optionnel : pour bien le voir sur le fond noir
        this.elScore.textContent = `Score : ${this.state.score}`;
        document.body.append(this.elScore);

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


    }

    // Mise en place des object du jeu sur la scene
    initGameObject() {
        //on renitialise le state
        this.state.balls = [];
        this.state.bouncingEdge = [];
        this.state.bricks = [];
        // Balle
        const ballDiameter = this.config.ball.radius * 2;
        const ball = new Ball(this.images.ball, ballDiameter, ballDiameter, this.config.ball.orientation, this.config.ball.speed);
        ball.setPosition(this.config.ball.position.x, this.config.ball.position.y);
        ball.isCircular = true;
        this.state.balls.push(ball);
        // Dessin des balles


        // Bordure de la loose
        const deathEdge = new GameObject(this.images.edge, this.config.canvasSize.width, 20)
        deathEdge.setPosition(0, this.config.canvasSize.height + 30);
        this.state.deathEdge = (deathEdge);
        //on le dessine pas

        //bordure a rebond
        //haut
        const EdgeTop = new GameObject(this.images.edge, this.config.canvasSize.width, 20)
        EdgeTop.setPosition(0, 0)

        //Droite
        const EdgeRight = new GameObject(this.images.edge, 20, this.config.canvasSize.height + 10)
        EdgeRight.setPosition(this.config.canvasSize.width - 20, 20)
        EdgeRight.tag = "RightEdge"

        //Gauche
        const EdgeLeft = new GameObject(this.images.edge, 20, this.config.canvasSize.height + 10)
        EdgeLeft.setPosition(0, 20)
        EdgeLeft.tag = "LeftEdge"
        this.state.bouncingEdge.push(EdgeLeft, EdgeRight, EdgeTop);


        //paddle
        const paddle1 = new Paddle(this.images.paddle, this.config.paddleSize.width, this.config.paddleSize.height, 0, 0);
        paddle1.setPosition(350, 560)
        this.state.paddle = paddle1

        //brick
        this.loadBricks(this.levels.data[this.state.levels])



    }

    //création des brick
    loadBricks(levelArray) {
        // lignes
        for(let line = 0; line < levelArray.length; line ++){
            //colonnes
            for (let col = 0; col <16; col++) {
                //si la valeur trouver est 0, c'est un espace vide, donc on passe a la column suivante
                let brickType = levelArray[line][col]
                if (brickType === 0) continue;

                //si on a bien une brique on la crée et on la met dans le state
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
        // -- Paddle
        // On analyse quel commande de mouvement est demandée pour le paddle
        // Droite
        if( this.state.userInput.paddleRight ) {
            this.state.paddle.orientation = 0;
            this.state.paddle.speed = 7;
        }
        // Gauche
        if( this.state.userInput.paddleLeft ) {
            this.state.paddle.orientation = 180;
            this.state.paddle.speed = 7;
        }
        // Ni Droite Ni Gauche
        if( ! this.state.userInput.paddleRight && ! this.state.userInput.paddleLeft ) {
            this.state.paddle.speed = 0;
        }

        // Mise à jour de la position
        this.state.paddle.update();
    }

    // Cycle de vie: 2- Collisions et calculs qui en découlent
    checkCollisions() {

        // Collisions du paddle avec les bords
        this.state.bouncingEdge.forEach( theEdge => {
            const collisionType = this.state.paddle.getCollisionType( theEdge );

            // Si aucune collision ou autre que horizontal, on passe au edge suivant
            if( collisionType !== CollisionType.HORIZONTAL ) return;

            // Si la collision est horizontale, on arrête la vitesse du paddle
            this.state.paddle.speed = 0;

            // On récupère les limites de theEdge
            const edgeBounds = theEdge.getBounds();

            // Si on a touché la bordure de droite
            if( theEdge.tag === "RightEdge" ) {
                this.state.paddle.position.x = edgeBounds.left - 1 - this.state.paddle.size.width;
            }
            // Si on a touché la bordure de gauche
            else if( theEdge.tag === "LeftEdge" ) {
                this.state.paddle.position.x = edgeBounds.right + 1;
            }

            // Mise à jour de la position
            this.state.paddle.update();
        });

        // Collisions des balles avec tous les objets
        // On crée un tableau pour stocker les balles non-perdues
        const savedBalls = [];

        this.state.balls.forEach( theBall => {

            // Collision de la balle avec le bord de la mort
            if( theBall.getCollisionType( this.state.deathEdge ) !== CollisionType.NONE ) {
                return;
            }

            // On sauvegarde la balle en cours (car si on est là, c'est qu'on a pas tapé le bord de la mort)
            savedBalls.push( theBall );

            // Collisions de la balle avec les bords rebondissants
            this.state.bouncingEdge.forEach( theEdge => {
                const collisionType = theBall.getCollisionType( theEdge );

                switch( collisionType ) {
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
            this.state.bricks.forEach( theBrick => {
                const collisionType = theBall.getCollisionType( theBrick );

                switch( collisionType ) {
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

                //ici on a forcément une collision (car la premiere clause du switch fait un return)
                //Disparition de la brique avec la récistance
                if (theBrick.type !== -1) {
                    theBrick.strength--;

                    //incrémentation du score
                    if (theBrick.strength === 0) {
                        this.state.score++;
                        this.elScore.textContent = `Score : ${this.state.score}`;
                    }
                }
            })


            // Collision avec le paddle
            const paddleCollisionType = theBall.getCollisionType( this.state.paddle );
            switch( paddleCollisionType ) {
                case CollisionType.HORIZONTAL:
                    theBall.reverseVelocityX();
                    break;

                case CollisionType.VERTICAL:
                    // Altération de l'angle en fonction du movement du paddle
                    let alteration = 0;
                    if( this.state.userInput.paddleRight )
                        alteration = -1 * this.config.ball.angleAlteration;
                    else if( this.state.userInput.paddleLeft )
                        alteration = this.config.ball.angleAlteration;

                    theBall.reverseVelocityY(alteration);

                    // Correction pour un résultat de 0 et 180 pour éviter une trajectoire horizontale
                    if( theBall.orientation === 0 )
                        theBall.orientation = 10;
                    else if( theBall.orientation === 180 )
                        theBall.orientation = 170;

                    break;

                default:
                    break;
            }
        });

        // Mise à jour du state.balls avec savedBalls
        this.state.balls = savedBalls;
    }

    // Cycle de vie: 3- Mise à jours des données des GameObjects
    updateObjects() {
        // Balles
        this.state.balls.forEach( theBall => {
            theBall.update();
        });

        //brick
        // on ne conserve dans le state que les brique dont le strength ets différent de 0
        this.state.bricks = this.state.bricks.filter(theBrick => theBrick.strength !== 0 )

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
        this.state.bouncingEdge.forEach( theEdge => {
            theEdge.draw();
        });

        // Dessin des briques
        this.state.bricks.forEach( theBrick => {
            theBrick.draw();
        });

        // Dessin du paddle
        this.state.paddle.draw();

        // Dessin des balles
        this.state.balls.forEach( theBall => {
            theBall.draw();
        });


    }

    // Boucle d'animation
    loop(stamp, levels) {
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

        console.log(this.state.score)

        // S'il n'y a aucune balle restante, on a perdu
        // S'il n'y a aucune balle restante, on a perdu
        if (this.state.balls.length <= 0) {
            this.showDeathModal();
            return; // Stop la boucle loop()
        }
        const bricksWin = this.state.bricks.filter(theBrick => theBrick.strength > 0 );

        if (bricksWin <= 0) {
            // On nettoie le canvas avant d'afficher la modale
            this.ctx.clearRect(0, 0, this.config.canvasSize.width, this.config.canvasSize.height);

            // On affiche la modale de victoire
            this.showWinModal();

            // TRÈS IMPORTANT : On stoppe la boucle actuelle ici.
            // La boucle ne redémarrera que quand l'utilisateur cliquera sur le bouton.
            return;
        }

        // Appel de la frame suivante
        requestAnimationFrame( this.loop.bind(this) );
    }


// Dans src/Game/Game.js

    showWinModal() {
        const overlay = document.createElement('div');
        // ... (garder le même style d'overlay que précédemment) ...
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: '10000'
        });

        const content = document.createElement('div');
        // ... (garder le même style de contenu) ...
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
            // ... style du bouton ...
            btnRestart.onclick = () => location.reload();
            content.appendChild(btnRestart);
        } else {
            content.innerHTML = `
            <h1 style="color: #00ffcc; margin: 0; font-size: 40px;">NIVEAU COMPLÉTÉ !</h1>
            <p style="margin: 20px 0;">Prêt pour la suite ?</p>
        `;

            const btnNext = document.createElement('button');
            btnNext.innerText = "NIVEAU SUIVANT";
            // ... style du bouton ...
            btnNext.onclick = () => {
                document.body.removeChild(overlay);
                this.state.levels++;
                this.initGameObject();
                requestAnimationFrame(this.loop.bind(this));
            };
            content.appendChild(btnNext);
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }
// --- Ajoute cette méthode dans ton objet ou ta classe ---
showDeathModal() {
    // 1. Création du conteneur (Overlay)
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

    // 2. Création de la boîte de contenu
    const content = document.createElement('div');
    Object.assign(content.style, {
        textAlign: 'center',
        padding: '50px',
        border: '3px solid #ff0044',
        borderRadius: '20px',
        backgroundColor: '#111',
        boxShadow: '0 0 30px #ff0044'
    });

    // 3. Titre et texte
    content.innerHTML = `
        <h1 style="color: #ff0044; font-size: 50px; margin: 0 0 10px 0; text-transform: uppercase;">
            Kabooooooom !!!
        </h1>
        <p style="color: white; font-size: 18px; margin-bottom: 30px;">
            Toutes les balles ont été pulvérisées.
        </p>
    `;

    // 4. Bouton Rejouer
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

    // Effet de survol (hover)
    btn.onmouseover = () => btn.style.transform = "scale(1.1)";
    btn.onmouseout = () => btn.style.transform = "scale(1)";

    // Action du bouton
    btn.onclick = () => location.reload();

    // Montage de la modale
    content.appendChild(btn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Petit effet de tremblement d'écran à l'apparition
    document.body.style.animation = "shake 0.5s";

    // Ajout d'une animation CSS rapide pour le tremblement
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
    }

}

const theGame = new Game(customConfig, levelsConfig);

export default theGame;