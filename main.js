// Tuning Parameters 
var WALL_STRENGTH = 50;
var RANDOMNESS = 0.2;
var MOUSE_STRENGTH = 300;
var SENSE_STRENGTH = 0.1;
var NUM_ANTS = 100;
var SPEED = 1;
var BG_IMAGE = new Image();
BG_IMAGE.src = "./RBY_tiles.png";

AntSimulator();

function AntSimulator() {
    // "Globals"
    let c = document.getElementById("antCanvas");
    let ctx = c.getContext("2d");
    let bgC = document.getElementById("bgCanvas");
    let bgCTX = bgC.getContext("2d");
    let ants = makeAnts();

    window.requestAnimationFrame(drawAnts);

    // Canvas resizing operations
    let w = c.width = bgC.width = window.innerWidth;
    let h = c.height = bgC.height = window.innerHeight;
    window.onresize = () => {
        c.width = bgC.width = w = window.innerWidth;;
        c.height = bgC.height = h = window.innerHeight;
    };

    //Paint Background and store the bitmap/imageData
    var tiledBG = bgCTX.createPattern(BG_IMAGE, "repeat");
    var bgTiles = bgCTX.getImageData(0, 0, w, h);
    bgCTX.fillStyle = tiledBG;
    bgCTX.fillRect(0, 0, w, h);

    // Mouse tracking
    let mousePos = new Vector;
    window.onmousemove = (mouseEvent) => {
        mousePos.x = mouseEvent.clientX;
        mousePos.y = mouseEvent.clientY;
    }
    // Play and pause
    let playState = true;
    let animationID = 0;
    window.onkeydown = (keyEvent) => {
        playState = !playState;
        if (playState) {
            animationID = window.requestAnimationFrame(drawAnts)
        } else {
            console.log("cancelling animation");
            window.cancelAnimationFrame(animationID);
        }
    }

    // Toggle repel or attract
    let repel = 1;
    window.onmousedown = (mouseEvent) => {
        repel = repel * -1;
    }
    // Generates and returns a list of random ants
    function makeAnts() {
        let ants = new Array();
        for (let i = 0; i < NUM_ANTS; i++) {
            let pos = new Vector(Math.random() * c.clientWidth, Math.random() * c.clientHeight);
            let vel = new Vector.randomDirection();
            let color = "green";//"#" + Math.floor(Math.random() * 16777215).toString(16);
            ants.push(new Ant(pos, vel, color, i));
        }
        console.log(ants)
        return ants;
    }

    // Renders a list of ants
    function drawAnts() {
        // paint over old frame
        tiledBG = bgCTX.createPattern(BG_IMAGE, "repeat");
        bgCTX.fillStyle = tiledBG;
        bgCTX.fillRect(0, 0, w, h);
        ctx.clearRect(0, 0, w, h);
        // Loop Through Ants
        for (var a of ants) {
            // Add scaled wall force
            a.velocity = a.velocity.add(a.wallForce().multiply(WALL_STRENGTH));
            // Add scaled random wandering force
            a.velocity = a.velocity.add(Vector.randomDirection().multiply(RANDOMNESS));
            // Add repulsion from mouse
            a.velocity = a.velocity.add(a.pointForce(mousePos, repel).multiply(MOUSE_STRENGTH));
            // Add attraction to color red in bgCTX
            a.velocity = a.velocity.add(a.senseForce(0,10,20)).multiply(SENSE_STRENGTH);
            // Normalize velocity
            a.velocity = a.velocity.unit();
            // Increment by velocity and draw
            a.position = a.position.add(a.velocity.multiply(SPEED));
            a.render(ctx);
        }
        ants[0].senseForce();
        if (playState) {
            window.requestAnimationFrame(drawAnts);
        }
        bgTiles = ctx.getImageData(0, 0, w, h);

    }

    // A single ant
    function Ant(pos, velocity, color, id) {
        this.position = pos;
        this.velocity = velocity;
        this.color = color;
        this.id = id;

        // Draws the ant onto the given context
        this.render = function (ctx) {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 6, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Draw an overlay of the ants "pheromone sensing"
        this.drawSensors = function (ctx) {
            ctx.save();

            ctx.translate(this.position.x, this.position.y);
            // Draw Left Sensory Cone
            ctx.rotate(-this.velocity.toAngle());
            let u = new Vector.fromAngles((Math.PI / 2 - Math.PI / 8)).multiply(30);
            let v = new Vector.fromAngles((Math.PI / 2 + Math.PI / 8)).multiply(30);
            drawCone("cyan", u, v, 30);
            ctx.restore();
        }

        // Calculate the repulsive force by walls
        this.wallForce = function () {
            let net = new Vector();

            net = net.add(this.pointForce(new Vector(0, this.position.y))); // left wall
            net = net.add(this.pointForce(new Vector(w, this.position.y))); // right wall
            net = net.add(this.pointForce(new Vector(this.position.x, 0))); // top wall
            net = net.add(this.pointForce(new Vector(this.position.x, h))); // top wall

            return net;
        }

        // Calculate an inverse square repulsive force from a point
        this.pointForce = function (b, repel = 1) {
            let a2b = this.position.subtract(b);
            let dist = a2b.length();
            return a2b.unit().divide(dist * dist).multiply(repel);
        }
        // Samples n times radially in front of the ant, and returns a unit vector that heads towards
        // the highest concentration of the desired color
        this.senseForce = function(colorChannel = 0, samples = 10, distance = 30){
            let incrAngle = (Math.PI / 2) / (samples - 1);

            let midAngle = - this.velocity.toAngle();
            let startAngle = midAngle + Math.PI / 4;
            let weightSum = 0;
            //ctx.strokeStyle = "grey";

            for (let i = 0; i < samples; i++) {
                //ctx.moveTo(this.position.x,this.position.y);
                let sensePoint = Vector.fromAngles(startAngle + incrAngle * i).multiply(distance);
                sensePoint = sensePoint.add(this.position);
                //ctx.lineTo(sensePoint.x, sensePoint.y);

                let weight = getColorRGB(sensePoint.x, sensePoint.y,bgCTX)[colorChannel] / 255;
                weightSum += weight * i;
                
            }
            //ctx.stroke();
            let result = startAngle + incrAngle * weightSum;
            return Vector.fromAngles(result);
        }

    }

    // Draws an upwards directed "sight cone" from the current origin (i.e do transforms before this)
    function drawCone(color, u, v, radius) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.closePath();
        ctx.stroke();
    }

    function getColorRGB(x, y, context) {
        // Pixels are stored in a 1D array as 4 byte wide integers
        let pixel = context.getImageData(x,y,1,1).data;
        return [pixel[0],pixel[1],pixel[2]];
    }

    function RGBToHex(r, g, b) {
        r = r.toString(16);
        g = g.toString(16);
        b = b.toString(16);

        if (r.length == 1)
            r = "0" + r;
        if (g.length == 1)
            g = "0" + g;
        if (b.length == 1)
            b = "0" + b;

        return "#" + r + g + b;
    }
}
