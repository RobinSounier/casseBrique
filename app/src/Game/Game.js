// Import de la feuille de style
import '../assets/css/style.css';
//import des assets de sprites
import ballIMGSRC from '../assets/img/ball.png';

class Game
{
    // Contexte de dessin du canvas
    ctx;

    start() {
        console.log('Jeu démarré ...');
        this.initHtmlUI();

        //1- on crée une balise html img qui ne sera jamais ajouter au dom
        const ballImg = new Image();

        // 2- on récupère le nom de l'imlage généré par webpack en tant que src de cette image
        ballImg.src = ballIMGSRC;

        // "- On demande au contexte de dessin de dessiner cette image dans le canvas
        ballImg.addEventListener('load', () => {
            this.ctx.drawImage(ballImg, 400, 300);
        })


    }

    // Méthodes "privées"
    initHtmlUI() {
        const elH1 = document.createElement('h1');
        elH1.textContent = 'Arkanoïd';

        const elCanvas = document.createElement( 'canvas' );
        elCanvas.width = 800;
        elCanvas.height = 600;

        document.body.append( elH1, elCanvas );

        // Récupération du contexte de dessin
        this.ctx = elCanvas.getContext('2d');
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