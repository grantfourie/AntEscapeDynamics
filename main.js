AntSimulator();

function AntSimulator() {
    const c = document.getElementById("myCanvas");
    const shadowCanvas = document.createElement("canvas");
    var ctx = c.getContext("2d");
    var sCTX = shadowCanvas.getContext("2d");
    var WALL_STRENGTH = 2;
    var RANDOMNESS = 0.1;
    var REPEL_STRENGTH = 3;
    var NUM_ANTS = 1000;
    var SPEED = 0.5;

    // Canvas resizing operations
    ctx.canvas.width  = window.innerWidth;
    sCTX.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    sCTX.canvas.height = window.innerHeight;
    window.onresize = () => {
        ctx.canvas.width = window.innerWidth;
        sCTX.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        sCTX.canvas.height = window.innerHeight;
    };

    // Mouse tracking
    var mousePos = new Vector;
    window.onmousemove = (mouseEvent) => {
        mousePos.x = mouseEvent.clientX;
        mousePos.y = mouseEvent.clientY;
    }

    // A second off screen canvas to store and preprocess pheromone trail deposits
    var trailCanvas = document.createElement('canvas');
    trailCanvas.width = c.width;
    trailCanvas.height = c.height;

    // Fires up some ants and enters the simulation loop
    let ants = makeAnts();
    window.requestAnimationFrame(drawAnts);

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
        ctx.clearRect(0,0,sCTX.canvas.width, sCTX.canvas.height);
        // Loop Through Ants
        for (var a of ants) {
            // Add scaled wall force
            a.velocity = a.velocity.add(a.wallForce().multiply(WALL_STRENGTH));
            // Add scaled random wandering force
            a.velocity = a.velocity.add(Vector.randomDirection().multiply(RANDOMNESS));
            // Add repulsion from mouse
            a.velocity = a.velocity.add(a.repulsiveForce(mousePos).multiply(REPEL_STRENGTH));
            // Normalize
            a.velocity = a.velocity.unit();
            // Increment by velocity
            a.position = a.position.add(a.velocity.multiply(SPEED));
            // Draw!
            a.render(ctx)
        };
        window.requestAnimationFrame(drawAnts);
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
            ctx.arc(Math.floor(this.position.x), Math.floor(this.position.y), 5, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Calculate the repulsive force by walls
        this.wallForce = function(){
            let net = new Vector();
            if(this.position.x < 100){
                net = net.add(Vector.right.divide(Math.abs(this.position.x)));
            }if(this.position.x > ctx.canvas.width - 100){
                net = net.add(Vector.left.divide(Math.abs(ctx.canvas.width - this.position.x)));
            }if(this.position.y < 100){
                net = net.add(Vector.down.divide(Math.abs(this.position.y)));
            }if(this.position.y > ctx.canvas.height - 100){
                net = net.add(Vector.up.divide(Math.abs(ctx.canvas.height - this.position.y)));
            }
            return net;
        }

        // Calculate a repulsive force from a point
        this.repulsiveForce = function(b){
            let a2b = this.position.subtract(b); 
            return a2b.unit().divide(a2b.length());
        }
    }
}