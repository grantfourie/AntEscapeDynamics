
c = document.getElementById("myCanvas");
ctx = c.getContext("2d");
ants = makeAnts();

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
})

function makeAnts() {
    let ants = new Array();
    for (let i = 0; i < 100; i++) {
        ants.push(new Ant(
            Math.random() * c.clientWidth,
            Math.random() * c.clientHeight,
            (Math.random()) * 2 * Math.PI,
            "#" + Math.floor(Math.random() * 16777215).toString(16),
            i
        )
        );
    }
    return ants;
}

// Renders a list of balls
function drawAnts() {
    // paint over old frame
    ctx.fillStyle = "rgba(0,0,0,0.025)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (var a of ants) {

        a.draw(ctx)
    };
    window.requestAnimationFrame(drawAnts);
}

// A ball object
function Ball(x, y, heading, color, id) {
    this.position = pos;
    this.velocity = velocity;
    this.color = color;
    this.id = id;
    this.draw = function (ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}


window.requestAnimationFrame(drawBalls);
