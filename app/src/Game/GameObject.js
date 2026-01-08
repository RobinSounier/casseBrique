import Bounds from "./dataType/Bounds";
import theGame from "./Game";
import Vector from "./dataType/Vector";
import Size from "./dataType/Size";


export default class GameObject
{
    image;
    position;
    size;


    constructor(image, width, height) {
        this.image = image;
        this.size = new Size(width, height);
    }

    getBounds() {
        return new Bounds(
            this.position.y,
            this.position.x + this.size.width,
            this.position.y + this.size.height,
            this.position.x,
        );
    }

    draw() {
        theGame.ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
        );
    }

    setPosition(x, y) {
        this.position = new Vector(x,y);

    }

}