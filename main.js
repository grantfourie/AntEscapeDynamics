// Tuning Parameters 
var WALL_STRENGTH = 50;
var RANDOMNESS = 0.3;
var MOUSE_STRENGTH = 200;
var SENSE_STRENGTH = 0.2;
var TRAIL_FADE_RATE = 0.9;
var NUM_ANTS = 500;
var SPEED = 0.5;
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
            let color = "cyan";//"#" + Math.floor(Math.random() * 16777215).toString(16);
            ants.push(new Ant(pos, vel, color, i));
        }
        console.log(ants)
        return ants;
    }

    // Renders a list of ants
    function drawAnts() {
        // paint over old frame
        ctx.clearRect(0, 0, w, h);
        bgCTX.fillStyle = `rgba(0,0,0,${ TRAIL_FADE_RATE * 0.01})`;
        bgCTX.fillRect(0,0,w,h);

        // Background options for testing \
        // 1. A tiled pattern of the given image 
        //tileBackground(BG_IMAGE);

        // 2. A gradient spot
        //drawGradientSpot(new Vector(w/2,h/2), 100, [255,0,0]);

        // Loop Through Ants, calculate the forces acting on each one.
        for (var a of ants) {
            // Add scaled wall force
            a.velocity = a.velocity.add(a.wallForce().multiply(WALL_STRENGTH));
            // Add scaled random wandering force
            a.velocity = a.velocity.add(Vector.randomDirection().multiply(RANDOMNESS));
            // Add repulsion from mouse
            a.velocity = a.velocity.add(a.pointForce(mousePos, repel).multiply(MOUSE_STRENGTH));
            // Add attraction/repulsion to color red in bgCTX
            a.velocity = a.velocity.add(a.senseForce(0,30, true).multiply(SENSE_STRENGTH));
            // Normalize velocity
            a.velocity = a.velocity.unit();
            // Increment by velocity and draw
            a.position = a.position.add(a.velocity.multiply(SPEED));
            drawSpot(a.position, 5, [255,0,0]);
            a.render(ctx);
        }
        if (playState) {
            window.requestAnimationFrame(drawAnts);
        }
        bgTiles = ctx.getImageData(0, 0, w, h);
    }

    // A single ant and all its associated intelligence
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
        this.senseForce = function(colorChannel = 0, distance = 30, attract=true){
            let numSamples = 4;
            let incrAngle = (Math.PI / 2) / numSamples;

            let midAngle = - this.velocity.toAngle();
            let startAngle = midAngle + Math.PI / 4;
            let result = new Vector();
            ctx.strokeStyle = "grey";

            for (let i = 0; i < numSamples; i++) {
                let senseVector = Vector.fromAngles(startAngle + incrAngle * i).multiply(distance);
                let senseCoords = senseVector.add(this.position);
                let weight = getColorRGB(senseCoords.x, senseCoords.y,bgCTX)[colorChannel] / 255;
                if (!attract){weight = 1/weight;}
                result = result.add(senseVector.multiply(weight));
            }
            return result.unit();
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
    // Gets the color from the given drawing context at coordinates (x,y)
    function getColorRGB(x, y, context) {
        // Pixels are stored in a 1D array as 4 byte wide integers
        let pixel = context.getImageData(x,y,1,1).data;
        return [pixel[0],pixel[1],pixel[2]];
    }
    // Converts 255 based rgb color to a hexcode string
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
    // Paints a tiled version of the given image onto the bgCTX
    function tileBackground(imgSrc){
        let tiledBG = bgCTX.createPattern(imgSrc, "repeat");
        bgCTX.fillStyle = tiledBG;
        bgCTX.fillRect(0,0,w,h);
    }
    // Draws a radial gradient at (center) with radius = size, in the given [r,g,b] color
    function drawGradientSpot(center, size, color){
        let gradientFill = bgCTX.createRadialGradient(center.x,center.y,1, center.x,center.y,size);
        gradientFill.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},255)`);
        gradientFill.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
        bgCTX.fillStyle = gradientFill;
        bgCTX.fillRect(0,0,w,h);
    }
    // Draws a colored spot onto the bgCTX
    function drawSpot(center, size, color){
        bgCTX.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},128)`;
        bgCTX.beginPath();
        bgCTX.arc(center.x, center.y, size, 0, Math.PI * 2);
        bgCTX.fill();
    }
}
