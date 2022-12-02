const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const card = document.getElementById('card');
const cardScore = document.getElementById('card-score');

//used for 'setInterval'
let presetTime = 1000;
//enemy can speed up when player has scored points at interval of 10
let enemySpeed = 5;
let score = 0;
//used to see if user has scored another 10 points or not
let scoreIncrement = 0;
//so ball doesn't score more than one point at a time
let canScore = true;

function startGame(){
    player = new Player(150,350,50,'black');
    arrayBlocks = [];
    score = 0;
    scoreIncrement = 0;
    enemySpeed = 5;
    canScore = true;
    presetTime = 1000;
}

//restart game
function restartGame(button){
    card.style.display = 'none';
    button.blur();
    startGame();
    requestAnimationFrame(animate);
}

function drawBackgroundLine(){
    ctx.beginPath();
    ctx.moveTo(0,400);
    ctx.lineTo(600,400);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

function drawScore(){
    ctx.font = '80px Arial';
    ctx.fillStyle = 'black';
    let scoreString = score.toString();
    let xOffset = ((scoreString.length - 1) * 20);
    ctx.fillText (scoreString, 280 - xOffset, 100);
}

//both min and max are included in this random generation function
function getRandomNumber(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNumberInterval(timeInterval){
    let returnTime = timeInterval;
    if(Math.random() < 0.5){
        returnTime += getRandomNumber(presetTime / 3, presetTime * 1.5);
    }else{
        returnTime -= getRandomNumber(presetTime / 5, presetTime /2);
    }
    return returnTime;
}

class Player{
    constructor(x,y,size,color){
        this.x=x;
        this.y=y;
        this.size=size;
        this.color=color;
        this.jumpHeight = 12;
        //jump configuration
        this.shouldJump = false;
        this.jumpCounter = 0;
        //related to spin animation
        this.spin = 0;
        //get a 90 degree rotation
        this.spinIncrement = 90 / 32;
    }

    rotation(){
        let offsetXPosition = this.x + (this.size / 2);
        let offsetYPosition = this.y + (this.size / 2);
        ctx.translate(offsetXPosition,offsetYPosition);
        //division is there to convert degrees into radians
        ctx.rotate(this.spin * Math.PI / 180);
        ctx.rotate(this.spinIncrement * Math.PI / 180);
        ctx.translate(-offsetXPosition, -offsetYPosition);
        //4.5 because 90/20 (nu of iterations in jump) is 4.5
        this.spin += this.spinIncrement;
    }

    counterRotation(){
        //this rotates the cube back to its origin so it can move upwards properly
        let offsetXPosition = this.x + (this.size / 2);
        let offsetYPosition = this.y + (this.size / 2);
        ctx.translate(offsetXPosition, offsetYPosition);
        ctx.rotate(-this.spin * Math.PI / 180);
        ctx.translate(-offsetXPosition,-offsetYPosition);
    }

    jump() {
        if(this.shouldJump){
            this.jumpCounter++;
            if(this.jumpCounter < 15){
                //go up
                this.y -= this.jumpHeight;
            }else if(this.jumpCounter > 14 && this.jumpCounter  < 19) {
                this.y += 0;
            }else if(this.jumpCounter < 33){
                //go down
                this.y += this.jumpHeight;
            }
            this.rotation();
            //end cycle
            if(this.jumpCounter >= 32){
                this.counterRotation();
                this.spin = 0;
                this.shouldJump = false;
            }
        }
    }

    draw(){
        this.jump();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x,this.y,this.size,this.size)
        //reset the rotation so the rotation of other elements is unchanged
        if(this.shouldJump) this.counterRotation();
    }
}

let player = new Player(150,350,50,'black');

class AvoidBlock{
    constructor(size, speed){
        this.x = canvas.width + size;
        this.y = 400 - size;
        this.size = size;
        this.color = 'red';
        this.slideSpeed = speed;
    }
    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    slide(){
        this.draw();
        this.x -= this.slideSpeed;
    }
}

let arrayBlocks = [];

//auto generate blocks
function generateBlocks(){
    let timeDelay = randomNumberInterval(presetTime);
    arrayBlocks.push(new AvoidBlock(50, enemySpeed));

    setTimeout(generateBlocks, timeDelay);
}

//return true if colliding
function squaresColliding(player, block){
    let s1 = Object.assign(Object.create(Object.getPrototypeOf(player)), player);
    let s2 = Object.assign(Object.create(Object.getPrototypeOf(block)), block);
    //Don't need pixel perfect collision detenction
    s2.size = s2.size - 10;
    s2.x = s2.x + 10;
    s2.y = s2.y + 10;
    return !(
        s1.x>s2.x+s2.size || //R1 is to the right of R2
        s1.x+s1.size<s2.x || //R1 to the left of R2
        s1.y>s2.y+s2.size || //R1 is below R2
        s1.y+s1.size<s2.y //R1 is above R2
    )
}

//returns true if player is past the block
function isPastBlock(player, block){
    return(
        player.x + (player.size / 2) > block.x + (block.size / 4) &&
        player.x + (player.size / 2) < block.x + (block.size / 4) * 3
    )
}

function shouldincreaseSpeed(){
    //check to see if game speed should be increased
    if(scoreIncrement + 10 === score){
        scoreIncrement = score;
        enemySpeed++
        presetTime >=100 ? presetTime -= 100 : presetTime = presetTime / 2;
        
        //update speed of existing blocks
        arrayBlocks.forEach(block => {
            block.slideSpeed = enemySpeed;
        });
    }
}

let animationId = null;
function animate(){
    animationId = requestAnimationFrame(animate);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    //canvas logic
    drawBackgroundLine();
    drawScore();
    //foreground
    player.draw();

    //check to see if game speed should be increased
    shouldincreaseSpeed();

    arrayBlocks.forEach((arrayBlock, index) => {
        arrayBlock.slide();
        //end game if player and enemy have collided
        if(squaresColliding(player, arrayBlock)){
            //gameOverSFX.play();
            cardScore.textContent = score;
            card.style.display = 'block';

            cancelAnimationFrame(animationId);
        }

        //user should score a point if this is the case
        if(isPastBlock(player, arrayBlock) && canScore){
            canScore = false;
            // scoreSFX.currentTime = 0;
            // scoreSFX.play();
            score++
        }

        //delete block that has left the screen
        if((arrayBlock.x + arrayBlock.size) <= 0){
            setTimeout(() => {
                arrayBlocks.splice(index, 1);
            }, 0)
        }
    })
}

animate();
setTimeout(() => {
    generateBlocks();
}, randomNumberInterval(presetTime))

//event listener
addEventListener('keydown', e => {
    if(e.code === 'Space'){
        if(!player.shouldJump){
            player.jumpCounter = 0;
            player.shouldJump = true;
            canScore = true;
        }
    }
})