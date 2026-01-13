// Import de la feuille de style
import '../assets/css/style.css';
//import des assets de sprites
import ballImgSrc from '../assets/img/ball.png';
import paddleImgSrc from '../assets/img/paddle.png';
import brickImgSrc from '../assets/img/brick.png';
import edgeImgSrc from '../assets/img/edge.webp';
import Ball from "./Ball";
import GameObject from "./GameObject";
import CollisionType from "./dataType/CollisionType";
import Paddle from "./Paddle";


class Game
{
    // Contexte de dessin du canvas
    ctx;
    images = {
        ball: null,
        paddle: null,
        brick: null,
        edge: null
    }
    // State (un object qui decrit l'etat actuel du jeu, les balles, les brique encore presente etc ..)
    state = {
        // Balles (plusieurs car possible multiball)
        balls: [],
        //bordure de la loose
        deathEdge : [],
        bouncingEdge : [],
        paddle: null,
        // entrée utilisateur
        userInput:{
            paddleLeft: false,
            paddleRight: false
        }
    };

    config={
        canvasSize : {
            width: 800,
            height: 600
        },
        ball: {
            radius : 10,
            orientation : Math.floor(Math.random() * (120 - 50 + 1)) + 50,
            speed: 3,
            position : {
                x: 400,
                y: 300
            },
            angleAlteration: 35

        },
        paddleSize: {
            width : 100,
            height : 20
        }

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
    initHtmlUI(){
        const elH1 = document.createElement('h1');
        elH1.textContent = 'GAME.IO';

        const elCanvas = document.createElement( 'canvas' );
        elCanvas.width = this.config.canvasSize.width;
        elCanvas.height = this.config.canvasSize.height;

        document.body.append( elH1, elCanvas );

        // Récupération du contexte de dessin
        this.ctx = elCanvas.getContext('2d');

        // Ecouteur d'èvénement du clavier
        document.addEventListener('keydown', this.handlerKeyboard.bind(this, true));
        document.addEventListener('keyup', this.handlerKeyboard.bind(this, false));
    }

    //création des images
    initImages(){
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
    initGameObject(){
        // Balle
        const ballDiameter = this.config.ball.radius * 2;
        const ball = new Ball(this.images.ball, ballDiameter, ballDiameter, this.config.ball.orientation, this.config.ball.speed);
        ball.setPosition(this.config.ball.position.x,this.config.ball.position.y);
        ball.isCircular = true;
        this.state.balls.push(ball);
        // Dessin des balles


        // Bordure de la loose
        const deathEdge = new GameObject(this.images.edge, this.config.canvasSize.width, 20)
        deathEdge.setPosition(0,this.config.canvasSize.height + 30);
        this.state.deathEdge = (deathEdge);
        //on le dessine pas

        //bordure a rebond
        //haut
        const EdgeTop = new GameObject(this.images.edge, this.config.canvasSize.width,20)
        EdgeTop.setPosition(0,0)

        //Droite
        const EdgeRight = new GameObject(this.images.edge,20, this.config.canvasSize.height + 10)
        EdgeRight.setPosition(this.config.canvasSize.width - 20,20)
        EdgeRight.tag = "RightEdge"

        //Gauche
        const EdgeLeft = new GameObject(this.images.edge, 20,this.config.canvasSize.height + 10)
        EdgeLeft.setPosition(0,20)
        EdgeLeft.tag = "LeftEdge"
        this.state.bouncingEdge.push(EdgeLeft, EdgeRight, EdgeTop);


        //paddle
        const paddle1 = new Paddle(this.images.paddle,this.config.paddleSize.width, this.config.paddleSize.height, 0, 0);
        paddle1.setPosition(350, 560)
        this.state.paddle = paddle1

    }

    //boucle d'animation
    loop()
    {
        //suprime les element a chaque frame
        this.ctx.clearRect(0, 0, this.config.canvasSize.width, this.config.canvasSize.height);

        //on les redessine
        this.state.bouncingEdge.forEach(TheEdge => {
            TheEdge.draw()
        })

        this.state.paddle.update();
        //cycle du paddle
        //on analyse quelle comlmande de mouvement est demander pour la paddle
        if (this.state.userInput.paddleRight) {
            this.state.paddle.orientation = 0;
            this.state.paddle.speed = 7;
        }
        if (this.state.userInput.paddleLeft) {
            this.state.paddle.orientation = 180;
            this.state.paddle.speed = 7;
        }

        if (!this.state.userInput.paddleRight && !this.state.userInput.paddleLeft) {
            this.state.paddle.orientation = 180;
            this.state.paddle.speed = 0;
        }

        //Collision du paddle
        //avec le lift quand on bouge le paddle
        this.state.bouncingEdge.forEach(theEdge => {
            const collisionType = this.state.paddle.getCollisionType(theEdge);

            //si aucune collision ou autre que horizontal, on passe au edge suivant
            if (collisionType !== CollisionType.HORIZONTAL) return;

            //si la collision est horizontale, on arrete la vitesse du paddle
            this.state.paddle.speed = 0;


            //on recupere les limites de the edge
            const edgeBounds = theEdge.getBounds();

            // si on a toucher la bordure de droite
            if (theEdge.tag === "RightEdge") {
                this.state.paddle.position.x = edgeBounds.left - 1 - this.state.paddle.size.width;

            } else if (theEdge.tag === "LeftEdge") {
                this.state.paddle.position.x = edgeBounds.right + 1;
            }

            // si on a toucher la bordure de gauche


            this.state.paddle.update();

        })

        //dessin du paddle
        this.state.paddle.draw();

        const savedBalls = [];

        //cycle de la balle au milieu de l'ecran
        this.state.balls.forEach(theBall => {

            theBall.update();

            if( theBall.getCollisionType( this.state.deathEdge ) !== CollisionType.NONE ) {
                return;
            }
            //on sauvgarde la balle en cours
            savedBalls.push( theBall );
            //collisions de la balle avec les bords
            this.state.bouncingEdge.forEach(TheEdge => {
                const collisionType = theBall.getCollisionType(TheEdge);

                switch(collisionType)
                {
                    case CollisionType.NONE:
                        return;

                    case CollisionType.HORIZONTAL:
                        theBall.reverseVelocityX();
                        break;

                    case CollisionType.VERTICAL:
                        theBall.reverseVelocityY()
                        break;

                    default:
                        break;
                }
            })

            const paddleCollision = theBall.getCollisionType( this.state.paddle );

            switch(paddleCollision)
            {
                case CollisionType.HORIZONTAL:


                    theBall.reverseVelocityX();

                    break;

                case CollisionType.VERTICAL:
                    let alteration = 0
                    if (this.state.userInput.paddleRight) {
                        alteration = -1 * this.config.ball.angleAlteration;
                    } else if (this.state.userInput.paddleLeft) {
                        alteration = this.config.ball.angleAlteration;
                    }
                    theBall.reverseVelocityY(alteration);
                    //correction pour un résultat de 0 ou de 180 pour éviter une traj horizontal
                    if (theBall.orientation === 0) {
                        theBall.orientation = 10;
                    } else if (theBall.orientation === 180) {
                        theBall.orientation = -10;
                    }
                    break;

                default:
                    break;
            }



            theBall.draw()

        })

        this.state.balls = savedBalls;

        // S'il n'y a aucune balle restante, on a perdu
        if( this.state.balls.length <= 0 ) {
            console.log( "T'es mort");
            // On sort de loop()
            return;
        }
        //appelle de la frame suivantes
        requestAnimationFrame(this.loop.bind(this));
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

const theGame = new Game();

export default theGame;