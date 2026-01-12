import GameObject from "./GameObject";
import Vector from "./dataType/Vector";
import CustomMath from "./CustomMath";
import CollisionType from "./dataType/CollisionType";
import Bounds from "./dataType/Bounds";

export default class MovingObject extends GameObject
{
    speed = 1;
    orientation = 45;
    velocity;
    isCircular = false

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

    getCollisionType(ForeignGameObject){
        const bounds = this.getBounds()
        const foreignBounds = ForeignGameObject.getBounds();
        const radius = this.isCircular ? this.size.width/2 : 0;
        const boundsBias = new Bounds(
            radius,
            -1*radius,
            -1*radius,
            radius
        )

        //collison horizontal
        if (
            (
                bounds.right >= foreignBounds.left
                && bounds.right <= foreignBounds.right
                ||
                bounds.left <= foreignBounds.right
                && bounds.left >= foreignBounds.left
            )
            && bounds.top + boundsBias.top >= foreignBounds.top
            && bounds.bottom + boundsBias.bottom <= foreignBounds.bottom
        ) {
            return CollisionType.HORIZONTAL
        }
        //collison Vertical (bord haut et bas)
        else if (
            (
                bounds.top <= foreignBounds.bottom
                && bounds.top >= foreignBounds.top
                ||
                bounds.bottom >= foreignBounds.top
                && bounds.bottom <= foreignBounds.bottom
            )
            && bounds.left >= foreignBounds.left
            && bounds.right <= foreignBounds.right
        ) {
            return CollisionType.VERTICAL
        }

        return CollisionType.NONE;
    }

    reverseVelocityX(alteration = 0) {
        this.orientation += alteration;
        this.orientation = 180 - this.orientation;
        this.orientation = CustomMath.normalizeAngle(this.orientation);

    }

    reverseVelocityY(alteration = 0) {
        this.orientation += alteration;
        this.orientation *= -1;
        this.orientation = CustomMath.normalizeAngle(this.orientation);
    }


}