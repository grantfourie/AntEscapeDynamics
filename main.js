// Tuning Parameters 
var WALL_STRENGTH = 50;
var RANDOMNESS = 0.1;
var MOUSE_STRENGTH = 300;
var NUM_ANTS = 100;
var SPEED = 1;

AntSimulator();

function AntSimulator() {
    window.requestAnimationFrame(drawAnts);
    const c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");

    // Canvas resizing operations
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    window.onresize = () => {
        w = window.innerWidth;
        ctx.canvas.width = w;
        h = window.innerHeight;
        ctx.canvas.height = h;
    };

    // Mouse tracking
    var mousePos = new Vector;
    window.onmousemove = (mouseEvent) => {
        mousePos.x = mouseEvent.clientX;
        mousePos.y = mouseEvent.clientY;
    }

    // Fires up some ants
    let ants = makeAnts();

    // Play and pause
    var playState = true;
    var animationID = 0;
    window.onkeydown = (keyEvent) => {
        playState = !playState;
        if(playState){
            animationID = window.requestAnimationFrame(drawAnts)
        }else {
            console.log("cancelling animation");
            window.cancelAnimationFrame(animationID);
        }
    }

    // Toggle repel or attract
    var repel = 1;
    window.onmousedown = (mouseEvent) => {
        repel = repel * -1;
    }

    // A second off screen canvas to store and preprocess pheromone trail deposits
    var trailCanvas = document.createElement('canvas');
    trailCanvas.width = c.width;
    trailCanvas.height = c.height;

    // Generates and returns a list of random ants
    function makeAnts() {
        let ants = new Array();
        for (let i = 0; i < NUM_ANTS; i++) {
            let pos = new Vector(Math.random() * c.clientWidth, Math.random() * c.clientHeight);
            let vel = new Vector.randomDirection();
            let color = "#" + Math.floor(Math.random() * 16777215).toString(16);
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
            a.render(ctx)
            if(a.id % 23 == 0){
                a.drawSensors(ctx);
            }
            
        };
        if(playState){
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
            ctx.arc(Math.floor(this.position.x), Math.floor(this.position.y), 6, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Draw an overlay of the ants "pheromone sensing"
        this.drawSensors = function(ctx){
            ctx.save();

            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(-this.velocity.toAngle());

            ctx.strokeStyle = "red"
            ctx.beginPath();
            ctx.moveTo(0, 0);
            //ctx.lineTo(36,0);
            ctx.arc(0,0,36, Math.PI/4, Math.PI /2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = "blue"
            ctx.beginPath();
            ctx.moveTo(0,0);
            //ctx.lineTo(0,36);
            ctx.arc(0,0,36, Math.PI / 2, Math.PI * 0.75)
            ctx.lineTo(0,0);    
            ctx.closePath();
            ctx.stroke();

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
            return a2b.unit().divide(dist*dist).multiply(repel);
        }

    }
}