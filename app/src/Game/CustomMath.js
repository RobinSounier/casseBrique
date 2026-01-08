export default class CustomMath{

    //methode pour convertir les dege en radianb
    static degToRad(deg){
        return deg * (Math.PI / 180);
    }

    static RadToDeg(rad){
        return rad * 180 / Math.PI;
    }
}