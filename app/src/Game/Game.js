import '../assets/css/style.css'

class Game
{

    //Contexte de sessin du canvas
    ctx;

    start(){
        console.log("Game start");
        this.initHtmlUI()
    }

    // méthode privée
    initHtmlUI()
    {
        const elH1 = document.createElement('h1')
        elH1.textContent= 'Casse brique'

        const elCanvas = document.createElement('canvas')

        elCanvas.width = 800;
        elCanvas.height = 600;

        document.body.append( elH1, elCanvas );

        //Récuperation du contexte du canvas
        this.ctx = elCanvas.getContext('2d')
    }

    //fonction test inutile en jeux

    drawTest() {
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ffdd00';
        this.ctx.arc(400, 300, 100, Math.PI * 2 ,Math.PI * 2)
        this.ctx.fill()
        this.ctx.closePath()
    }
}

const theGame = new Game();

export default theGame;