import GameObject from "./GameObject";
import theGame from "./Game";

export default class Brick extends GameObject
{
    strength;
    type;


    constructor(image,width,height, strength = 1) {
        super(image,width,height);
        this.strength = strength;
        this.type = strength
    }

    // Dans src/Game/Brick.js

    draw() {
        let sourceX, sourceY;

        if (this.type === -1) {
            sourceX = 0;
            sourceY = 0;
        } else {
            sourceX = (this.size.width * this.type) - this.size.width + 50;
            sourceY = (this.size.height * this.strength) - this.size.height;
        }

        theGame.ctx.drawImage(
            this.image,
            sourceX, sourceY,
            this.size.width, this.size.height,
            this.position.x, this.position.y,
            this.size.width, this.size.height
        );
    }
}