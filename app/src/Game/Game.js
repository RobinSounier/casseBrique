// Import de la feuille de style
import '../assets/css/style.css';
//import des assets de sprites
import ballImgSrc from '../assets/img/ball.png';

class Game
{
    // Contexte de dessin du canvas
    ctx;

    //temporaire: position de base de la balle
    ballX = 400;
    ballY= 300;

    start() {
        console.log('Jeu démarré ...');
        this.initHtmlUI();
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

    //boucle d'animation
    loop()
    {

        // 1- on crée une balise HTML <img> qui ne sera jamais ajoutée au DOM
        const ballImg = new Image();


        // 2- On récupére le nom de l'image généré par webpack en tant que src de cette image
        ballImg.src = ballImgSrc;


        // 3- On demande au contexte de dessin de dessiner cette image dans le canvas
        ballImg.addEventListener( 'load', () => {
            this.ctx.drawImage( ballImg, this.ballX, this.ballY );
        });


        // Mise a jour de la position de la balle
        this.ballX ++
        this.ballY --

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