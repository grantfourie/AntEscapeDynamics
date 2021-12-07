// Tuning Parameters 
var WALL_STRENGTH = 50;
var RANDOMNESS = 0.15;
var MOUSE_STRENGTH = 300;
var NUM_ANTS = 100;
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
        c.height= bgC.height = h = window.innerHeight;
    };

    //Paint Background and store the bitmap/imageData
    let tiledBG = bgCTX.createPattern(BG_IMAGE, "repeat");
    bgCTX.fillStyle = tiledBG;
    bgCTX.fillRect(0, 0, w, h);
    bgTiles = bgCTX.getImageData(0, 0, w, h);

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
        ctx.clearRect(0, 0, w, h);
        // Loop Through Ants
        for (var a of ants) {
            // Add scaled wall force
            a.velocity = a.velocity.add(a.wallForce().multiply(WALL_STRENGTH));
            // Add scaled random wandering force
            a.velocity = a.velocity.add(Vector.randomDirection().multiply(RANDOMNESS));
            // Add repulsion from mouse
            a.velocity = a.velocity.add(a.pointForce(mousePos, repel).multiply(MOUSE_STRENGTH));
            // Normalize velocity
            a.velocity = a.velocity.unit();
            // Increment by velocity and draw
            a.position = a.position.add(a.velocity.multiply(SPEED));
            a.render(ctx);
        }
        ants[0].drawSensors(ctx);
        if (playState) {
            window.requestAnimationFrame(drawAnts);
        }

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
            let u = new Vector.fromAngles((Math.PI/2 - Math.PI/8)).multiply(30);
            let v = new Vector.fromAngles((Math.PI/2 + Math.PI/8)).multiply(30);
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

    }

    // Draws an upwards directed "sight cone" from the current origin (i.e do transforms before this)
    function drawCone(color, u, v, radius) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(u.x, u.y);
        ctx.lineTo(v.x,v.y);
        ctx.closePath();
        ctx.stroke();
    }

    // Finds the average color between two 
    // equal length vectors from the origin
    function sense(u, v) {
        ctx.save();
        // Big boy linear algebra time
        // 1. Transform the canvas by the basis vectors that define a sight cone
        // 2. The triangle that was between the basis vectors now lies between the unit triangle in the first quadrant
        ctx.transform(u.x, v.x, 0, u.y, v.y, 0);
        let coneSize = Math.floor(u.length());
        let rSum,gSum,bSum = 0;

        for (let x = 0; x < coneSize; x++) {
            for (let y = 0; y < coneSize; y++) {
                
                
                console.log(getColorRGBA(x,y));
                /* 
                rSum += r;
                gSum += g;
                bSum += b;
                */
            }
        }
        /*
        let NumPixels = (coneSize*coneSize);
        rSum = rSum/NumPixels;
        gSum = gSum/NumPixels;
        bSum = bSum/NumPixels;
        var hexColor = RGBToHex(rSum, gSum, bSum);
        */
       ctx.restore();
        return "magenta";
    }

    function getColorRGBA(x, y) {
        // Pixels are stored in a 1D array as 4 byte wide integers
        let index = y * w * 4 + x * 4;
        
        let red = bgTiles[index];
        return [red, red + 1, red + 2, red + 3];
    }

    function RGBToHex(r,g,b) {
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
