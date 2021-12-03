// https://evanw.github.io/lightgl.js/docs/vector.html

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}
Vector.prototype = {
    add: function (v) {
        if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y);
        else return new Vector(this.x + v, this.y + v);
    },
    subtract: function (v) {
        if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y);
        else return new Vector(this.x - v, this.y - v);
    },
    multiply: function (v) {
        if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y);
        else return new Vector(this.x * v, this.y * v);
    },
    divide: function (v) {
        if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y);
        else return new Vector(this.x / v, this.y / v);
    },
    dot: function (v) {
        return this.x * v.x + this.y * v.y;
    },
    length: function () {
        return Math.sqrt(this.dot(this));
    },
    unit: function () {
        return this.divide(this.length());
    },
    toAngle: function () {
        return Math.atan2(this.x, this.y);
    }
}
Vector.fromAngles = function (theta) {
    return new Vector(Math.cos(theta), Math.sin(theta));
};
Vector.randomDirection = function () {
    return Vector.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
};
Vector.lerp = function (a, b, fraction) {
    return b.subtract(a).multiply(fraction).add(a);
};
Vector.up = new Vector(0, -1);
Vector.down = new Vector(0, 1);
Vector.left = new Vector(-1, 0);
Vector.right = new Vector(1, 0);
