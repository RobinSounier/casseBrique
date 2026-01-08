import GameObject from "./GameObject";
import Vector from "./dataType/Vector";
import CustomMath from "./CustomMath";

export default class MovingObject extends GameObject
{
    speed = 1;
    orientation = 45;
    velocity;

    constructor(image, width, height, orientation, speed) {
        super(image, width, height);
        this.velocity = new Vector()
        this.orientation = orientation
        this.speed = speed
    }

    update() {
        let RadOrientation = CustomMath.degToRad((this.orientation))
        this.velocity.x = this.speed * Math.cos(RadOrientation)
        this.velocity.y = (this.speed * Math.sin(RadOrientation)) * -1
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y ;
    }

    reverseVelocityX() {
        this.orientation = 180 - this.orientation;
    }

    reverseVelocityY() {
        this.orientation = -this.orientation;
    }
}