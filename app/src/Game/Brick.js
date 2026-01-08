import GameObject from "./GameObject";

export default class Brick extends GameObject
{
    strength;


    constructor(image,width,height, strength = 1) {
        super(image,width,height);
        this.strength = strength;
    }
}