export default class CustomMath{

    //methode pour convertir les dege en radianb
    static degToRad(deg){
        return deg * (Math.PI / 180);
    }

    static RadToDeg(rad){
        return rad * 180 / Math.PI;
    }

    //normalisation d'un angle

    static normalizeAngle(value, isRadiant = false) {
        const fullCircle = isRadiant ? 2*Math.PI : 360;
        value %= fullCircle

        if (value >= 0) return value;
        return value += 360;
    }
}