// Import de la feuille de style
import '../assets/css/style.css';
//import des assets de sprites
import ballImgSrc from '../assets/img/ball.png';
import CustomMath from "./CustomMath";

class Game
{
    // Contexte de dessin du canvas
    ctx;
    //Images
    ballImg = new Image();

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

    // Mise en place des object du jeu sur la scene
    initGameObject(){
        // 1- on crée une balise HTML <img> qui ne sera jamais ajoutée au DOM
         this.ballImg = new Image();


        // 2- On récupére le nom de l'image généré par webpack en tant que src de cette image
        this.ballImg.src = ballImgSrc;


        // 3- On demande au contexte de dessin de dessiner cette image dans le canvas
        this.ctx.drawImage( this.ballImg, this.ballX, this.ballY );

    }

    //boucle d'animation
    loop()
    {

        this.ctx.reset()

        // Mise a jour de la position de la balle
        this.ballX += this.ballVelocity.x;
        this.ballY += this.ballVelocity.y;


        //TODO en mieux: detection des collisions
        //Collision avec le cote droit ou gauche de la scene | Invertion du x de la velocité

        if(this.ballX + 20 >= 800 || this.ballX <= 0) {
            this.ballVelocity.x = this.ballVelocity.x * -1;
        }

        //collition avec le cote haut ou bas d ela scene | invertion du y de la velocité
        if(this.ballY >= 580 || this.ballY <= 0) {
            this.ballVelocity.y = this.ballVelocity.y * -1;
        }


        this.ctx.drawImage( this.ballImg, this.ballX, this.ballY );
        //appelle de la frame suivantes
        requestAnimationFrame(this.loop.bind(this));
    }

    // Fonction de test inutile dans le jeu
    drawTest() {
        this.ctx.beginPath();
        this.ctx.fillStyle = '#fc0';
        this.ctx.arc(400, 300, 100, 0, Math.PI * 2 - Math.PI / 3);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

const theGame = new Game();

export default theGame;