import MovingObject from "./MovingObject";
import theGame from "./Game";

export default class PowerUp extends MovingObject {
    animationIndex = 0;
    previousKeyframeStamp;
    frameRate = 12; // Vitesse de l'animation

    constructor(image, width, height, speed) {
        // 90 degrés pour tomber vers le bas dans ton système
        super(image, width, height, -90, speed);
    }

    draw() {
        // Calcul de la frame à dessiner
        const sourceY = this.animationIndex * this.size.height;

        theGame.ctx.drawImage(
            this.image,
            0, sourceY,
            this.size.width, this.size.height,
            this.position.x, this.position.y,
            this.size.width, this.size.height
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