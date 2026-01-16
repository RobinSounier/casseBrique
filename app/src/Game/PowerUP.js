import MovingObject from "./MovingObject";
import theGame from "./Game";

export default class PowerUp extends MovingObject {
    animationIndex = 0;
    previousKeyframeStamp;
    frameRate = 12; // Vitesse de l'animation
    powerTypeIndex

    constructor(image, width, height, speed, typeIndex) {
        super(image, width, height, -90, speed);
        this.powerTypeIndex = typeIndex;
    }


    draw() {
        const sourceX = this.powerTypeIndex * 32;
        const sourceY = this.animationIndex * this.size.height;
        // console.log(sourceX, sourceY);

        theGame.ctx.drawImage(
            this.image,
            sourceX,
            sourceY,
            32,
            this.size.height,   // hauteur de la frame source
            this.position.x,
            this.position.y,
            this.size.width,    // largeur affichée
            this.size.height    // hauteur affichée
        );
    }



    updateAnimation() {
        if (!this.previousKeyframeStamp) {
            this.previousKeyframeStamp = theGame.currentLoopStamp;
            return;
        }

        const delta = theGame.currentLoopStamp - this.previousKeyframeStamp;
        if (delta < 1000 / this.frameRate) return;

        this.animationIndex++;
        if (this.animationIndex > 3) this.animationIndex = 0;

        this.previousKeyframeStamp = theGame.currentLoopStamp;
    }
}