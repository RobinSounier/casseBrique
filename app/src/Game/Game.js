// Import de la feuille de style
import '../assets/css/style.css';
//import des assets de sprites
import ballImgSrc from '../assets/img/ball.png';
import paddleImgSrc from '../assets/img/paddle.png';
import brickImgSrc from '../assets/img/brick.png';

import CustomMath from "./CustomMath";
import Ball from "./Ball";

class Game
{
    // Contexte de dessin du canvas
    ctx;
    //Images
    ballImg = new Image();

    images = {
        ball: null,
        paddle: null,
        brick: null,
    }


    // State (un object qui decrit l'etat actuel du jeu, les balles, les brique encore presente etc ..)
    state = {
        // Balles (plusieurs car possible multiball)
        balls: [],
        paddles: null,

    };

    //temporaire: position de base de la balle
    ballX = 400;
    ballY= 300;
    ballAngle = 30;

    ballSpeed = 10;

    ballVelocity = {
        x: this.ballSpeed * Math.cos(CustomMath.degToRad(this.ballAngle)), // Trajectoire avec 30 degres dangle
        y: this.ballSpeed * -1 * Math.sin(CustomMath.degToRad(this.ballAngle)), //Trajectoire avec 30 degres d'angle
    };

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
        elH1.textContent = 'Arkanoïd';

        const elCanvas = document.createElement( 'canvas' );
        elCanvas.width = 800;
        elCanvas.height = 600;

        document.body.append( elH1, elCanvas );

        // Récupération du contexte de dessin
        this.ctx = elCanvas.getContext('2d');
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
    }

    // Mise en place des object du jeu sur la scene
    initGameObject(){
        // Balle
        const ball = new Ball(this.images.ball, 20, 20, 45, 4);
        ball.setPosition(400,300)
        this.state.balls.push(ball);
        // Dessin des balles
        this.state.balls.forEach(theBall => {
            theBall.draw()
        })

        ball.draw();

    }

    //boucle d'animation
    loop()
    {

        this.ctx.clearRect(0, 0, 800, 600);


        //cycle de la balle au milieu de l'ecran
        this.state.balls.forEach(theBall => {
            theBall.update();
            //TODO en mieux: detection des collisions
            //Collision avec le cote droit ou gauche de la scene | Invertion du x de la velocité

            const bounds = theBall.getBounds();

            //--collision avec le canvas
            const oriantationBas = theBall
            //bord de droite
            if (bounds.right >= 800 || bounds.left <= 0) {
               theBall.reverseVelocityX()

            }
            // bord gauche du canvas
            if (bounds.bottom >= 600 || bounds.top <= 0) {
                theBall.reverseVelocityY()
            }

            theBall.draw()
        })
        //appelle de la frame suivantes
        requestAnimationFrame(this.loop.bind(this));
    }

    // Fonction de test inutile dans le jeu
    drawTest() {
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ff007f';
        this.ctx.arc(400, 300, 100, 0, Math.PI * 2 - Math.PI / 3);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

const theGame = new Game();

export default theGame;