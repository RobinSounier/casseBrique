import MovingObject from "./MovingObject";
import CollisionType from "./dataType/CollisionType";

export default class Ball extends MovingObject
{
    getCollisionType(ForeignGameObject){
        const bounds = this.getBounds()
        const foreignBounds = ForeignGameObject.getBounds();

        //collison horizontal
        if (
            (
                bounds.right >= foreignBounds.left
                && bounds.right <= foreignBounds.right
                ||
                bounds.left <= foreignBounds.right
                && bounds.left >= foreignBounds.left
            )
            && bounds.top >= foreignBounds.top
            && bounds.bottom <= foreignBounds.bottom
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
}