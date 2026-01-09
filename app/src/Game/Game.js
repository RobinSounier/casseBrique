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

        const imgEdge = new Image();
        imgEdge.src = edgeImgSrc;
        this.images.edge = imgEdge


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

        // Bordure de la loose
        const deathEdge = new GameObject(this.images.edge, 800, 20)
        deathEdge.setPosition(0,630)
        this.state.deathEdge.push(deathEdge);
        //on le dessine ou pas ??

        //bordure a rebond
        const EdgeTop = new GameObject(this.images.edge, 800,20)
        EdgeTop.setPosition(0,0)


        const EdgeRight = new GameObject(this.images.edge,20, 610)
        EdgeRight.setPosition(780,20)


        const EdgeLeft = new GameObject(this.images.edge, 20,610)
        EdgeLeft.setPosition(0,20)
        this.state.bouncingEdge.push(EdgeLeft, EdgeRight, EdgeTop);

        this.state.bouncingEdge.forEach(TheEdge => {
            TheEdge.draw()
        })
    }

    //boucle d'animation
    loop()
    {

        this.ctx.clearRect(0, 0, 800, 600);

        this.state.bouncingEdge.forEach(TheEdge => {
            TheEdge.draw()
        })

        //cycle de la balle au milieu de l'ecran
        this.state.balls.forEach(theBall => {
            theBall.update();
            // todo faire le bord de la mort
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



            theBall.draw()

        })
        //appelle de la frame suivantes
        requestAnimationFrame(this.loop.bind(this));
    }

}

const theGame = new Game();

export default theGame;