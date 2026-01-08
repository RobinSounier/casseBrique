import MovingObject from "./MovingObject";

export default class Paddle extends MovingObject
{
    equipment = null;
    xRange;

    update() {
        super.update();

        //on recupere les limites du paddle
        let bounds = this.getBounds();
        //si la position dépasse le range du paddle, on la limite
        if (bounds.left < this.xRange.min) {

            this.position.x = this.xRange.min;

        } else if (bounds.right > this.xRange.max) {

            this.position.y = this.xRange.max;

        }


    }
}