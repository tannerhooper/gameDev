let inputBuffer = {};
let canvas = null;
let context = null;
const COORD_SIZE = 1024;
var MAZE_LENGTH = parseInt(localStorage.getItem('Size'),10);
let shouldGen = true;
let shouldRender = true;
let firstRender = true;
let shouldShowHint = false;
let shouldShowBreadCrumbs = false;
let shouldShowPath = false;
let bothRendered = false;
let atEnd = false;
let flagDrawn = false;
let firstYellow = true;
let firstBread = true;
let somethingToggled = false;
let previousTime = performance.now();
let firstEnd = true;
let score = 0;
let tmpTimer = 0;
let highScores = [];
let highScoreAchieved = false;
let possibleScores = ['five','ten','fifteen','twenty'];

let mazeScoreIndex;

let imgFloor = new Image();
imgFloor.isReady = false;
imgFloor.onload = function() {
    this.isReady = true;
};
imgFloor.src = '../Images/camo.jpg';

var maze = [];
var wallList = [];
var shortestPath = [];
var breadCrumb = [];
var hint = null;
var character = null;
var adj;
var adjC;
var adjR;

function computeMazeScoreIndex() {
    if (localStorage.getItem('scores') == null){
        for (let i = 0; i < 4; i++){
            highScores.push([]);
        }
    }
    else {
        let previousScores = localStorage.getItem('scores');
        if (previousScores !== null) {
            highScores = JSON.parse(previousScores);
        }
    }

    if (this.MAZE_LENGTH == 5) mazeScoreIndex=0;
    else if (this.MAZE_LENGTH == 10) mazeScoreIndex=1;
    else if (this.MAZE_LENGTH == 15) mazeScoreIndex=2;
    else if (this.MAZE_LENGTH == 20) mazeScoreIndex=3;
}

function computeAdj(){
    if (this.MAZE_LENGTH == 5) adj = 30;
    if (this.MAZE_LENGTH == 10) adj = 20;
    if (this.MAZE_LENGTH == 15) adj = 15;
    if (this.MAZE_LENGTH == 20) adj = 10;
}

function genMaze() {
    for (let row = 0; row < this.MAZE_LENGTH; row++){
        this.maze.push([]);
        for (let col = 0; col < this.MAZE_LENGTH; col++){
            let temp = new Cell(row, col);
            this.maze[row].push(temp);
        }
    }
    let startR = getRand(this.MAZE_LENGTH);
    let startC = getRand(this.MAZE_LENGTH);
    let tmpCell = this.maze[startR][startC];
    tmpCell.isMaze = true;
    wallPush(tmpCell);

    while (wallList.length){
        let tmpWallIndex = getRand(this.wallList.length);
        let tmpWall = this.wallList[tmpWallIndex];
        let cur = this.maze[tmpWall.r][tmpWall.c];
        let neighbor;
        
        if (tmpWall.edge == 'n'){
            let newRow = tmpWall.r-1;
            let newCol = tmpWall.c;
            if (newRow >= 0){
                neighbor = this.maze[newRow][newCol];
                if ((cur.isMaze && !neighbor.isMaze)){
                    cur.edges.n = 0;
                    neighbor.edges.s = 0;
                    neighbor.isMaze = true;
                    this.maze[tmpWall.r][tmpWall.c] = cur;
                    this.maze[newRow][newCol] = neighbor;
                    wallPush(neighbor);
                }
            }
        }
        else if (tmpWall.edge == 'e'){
            let newRow = tmpWall.r;
            let newCol = tmpWall.c+1;
            if (newCol < this.MAZE_LENGTH){
                neighbor = this.maze[newRow][newCol];
                if ((cur.isMaze && !neighbor.isMaze)){
                    cur.edges.e = 0;
                    neighbor.edges.w = 0;
                    neighbor.isMaze = true;
                    this.maze[tmpWall.r][tmpWall.c] = cur;
                    this.maze[newRow][newCol] = neighbor;
                    wallPush(neighbor);
                }
            }
        }
        else if (tmpWall.edge == 's'){
            let newRow = tmpWall.r+1;
            let newCol = tmpWall.c;
            if (newRow < this.MAZE_LENGTH){
                neighbor = this.maze[newRow][newCol];
                if ((cur.isMaze && !neighbor.isMaze)){
                    cur.edges.s = 0;
                    neighbor.edges.n = 0;
                    neighbor.isMaze = true;
                    this.maze[tmpWall.r][tmpWall.c] = cur;
                    this.maze[newRow][newCol] = neighbor;
                    wallPush(neighbor);
                }
            }
        }
        else if (tmpWall.edge == 'w'){
            let newRow = tmpWall.r;
            let newCol = tmpWall.c-1;
            if (newCol >= 0){
                neighbor = this.maze[newRow][newCol];
                if ((cur.isMaze && !neighbor.isMaze)){
                    cur.edges.w = 0;
                    neighbor.edges.e = 0;
                    neighbor.isMaze = true;
                    this.maze[tmpWall.r][tmpWall.c] = cur;
                    this.maze[newRow][newCol] = neighbor;
                    wallPush(neighbor);
                }
            }
        }
        this.wallList.splice(tmpWallIndex,1);
    }
}

function edgeCheck(edge, cur){
    let tmpCell;
    if (edge == 'n'){
        tmpCell = this.maze[cur.r-1][cur.c];
    }
    else if (edge == 'e'){
        tmpCell = this.maze[cur.r][cur.c+1];
    }
    else if (edge == 's'){
        tmpCell = this.maze[cur.r+1][cur.c];
    }
    else if (edge == 'w'){
        tmpCell = this.maze[cur.r][cur.c-1];
    }
    return tmpCell;
}

function genShortPath(){
    var parent = new WeakMap();
    var queue = [];
    var start = maze[0][0];
    var end = maze[this.MAZE_LENGTH-1][this.MAZE_LENGTH-1];
    queue.push(start);

    while(queue.length != 0){
        var curr = queue.shift();
        if (curr.r == end.r && curr.c == end.c){
            return this.traceBack(parent,start,end);
        }
        for (let edge in curr.edges){
            let tmpCell;
            if (curr.edges[edge] == 0){
                tmpCell = edgeCheck(edge,curr);
                if (!_.isEqual(tmpCell,parent.get(curr))){
                    queue.push(tmpCell);
                    parent.set(tmpCell,curr);
                }
            }
        }
    }
}

function traceBack(parent, start, end){
    let path = [end];
    while(!_.isEqual(path[0],start)){
        path.unshift(parent.get(path[0]));
    }
    path.shift();
    path.pop();
    return path;
}

function updateShortPath(character){
    if (!_.isEqual(character.location,this.maze[this.MAZE_LENGTH-1][this.MAZE_LENGTH-1]) && atEnd == false){
        if (this.shortestPath.length != 0){
            if (character.location.r == this.shortestPath[0].r && character.location.c == this.shortestPath[0].c){
                this.shortestPath.shift();
            }
            else {
                this.shortestPath.unshift(character.prevLoc);
            }
        }
        else {
            this.shortestPath.unshift(character.prevLoc);
        }
    }
    else if (atEnd){
        //nothing
    }
    else {
        atEnd = true;
    }
}

function computeHint(){
    if (this.shortestPath.length != 0){
        this.hint = this.shortestPath[0]
    }
    else {
        this.hint = this.maze[this.MAZE_LENGTH-1][this.MAZE_LENGTH-1];
    }
}

function displayHint(){
    context.globalAlpha = 0.4;
    context.drawImage(document.getElementById('yellowSquare'),
        this.hint.c*(COORD_SIZE / this.MAZE_LENGTH),this.hint.r*(COORD_SIZE / this.MAZE_LENGTH),
        COORD_SIZE / this.MAZE_LENGTH + 0.5, COORD_SIZE / this.MAZE_LENGTH + 0.5);
    context.globalAlpha = 1;
    context.stroke();
}

function displayShortest(){
    for (let i = 0; i < this.shortestPath.length; i++){
        let tmp = this.shortestPath[i];
        let yellow = document.getElementById('yellow');
        if (firstYellow){
            firstYellow = false;
            if (this.MAZE_LENGTH == 5){
                yellow.width = yellow.width/12;
                yellow.height = yellow.height/12;
            }
            if (this.MAZE_LENGTH == 10){
                yellow.width = yellow.width/24;
                yellow.height = yellow.height/24;
            }
            if (this.MAZE_LENGTH == 15){
                yellow.width = yellow.width/30;
                yellow.height = yellow.height/30;
            }
            if (this.MAZE_LENGTH == 20){
                yellow.width = yellow.width/46;
                yellow.height = yellow.height/46;
            }
        }
        context.drawImage(document.getElementById('yellow'), 
            tmp.c*(COORD_SIZE / this.MAZE_LENGTH)+adj,tmp.r*(COORD_SIZE / this.MAZE_LENGTH)+adj,
            yellow.width,yellow.height);
    }
    context.stroke();
}

function displayBreadCrumbs(){
    for (let i = 0; i < this.breadCrumb.length; i++){
        let tmp = this.breadCrumb[i];
        let bread = document.getElementById('bread');
        if (firstBread){
            firstBread = false;
            if (this.MAZE_LENGTH == 5){
                bread.width = bread.width/12;
                bread.height = bread.height/12;
            }
            if (this.MAZE_LENGTH == 10){
                bread.width = bread.width/24;
                bread.height = bread.height/24;
            }
            if (this.MAZE_LENGTH == 15){
                bread.width = bread.width/30;
                bread.height = bread.height/30;
            }
            if (this.MAZE_LENGTH == 20){
                bread.width = bread.width/46;
                bread.height = bread.height/46;
            }
        }
        context.drawImage(document.getElementById('bread'), 
            tmp.c*(COORD_SIZE / this.MAZE_LENGTH)+adj, tmp.r*(COORD_SIZE / this.MAZE_LENGTH)+adj,
            bread.width,bread.height);
    }
    context.stroke();
}

function drawCell(cell){
    if (imgFloor.isReady) {
        context.drawImage(imgFloor,
        cell.c * (COORD_SIZE / this.MAZE_LENGTH), cell.r * (COORD_SIZE / this.MAZE_LENGTH),
        COORD_SIZE / this.MAZE_LENGTH + 0.5, COORD_SIZE / this.MAZE_LENGTH + 0.5);
    }
    if (cell.edges.n) {
        context.moveTo(cell.c * (COORD_SIZE / this.MAZE_LENGTH), cell.r * (COORD_SIZE / this.MAZE_LENGTH));
        context.lineTo((cell.c + 1) * (COORD_SIZE / this.MAZE_LENGTH), cell.r * (COORD_SIZE / this.MAZE_LENGTH));
    }
    
    if (cell.edges.s) {
        context.moveTo(cell.c * (COORD_SIZE / this.MAZE_LENGTH), (cell.r + 1) * (COORD_SIZE / this.MAZE_LENGTH));
        context.lineTo((cell.c + 1) * (COORD_SIZE / this.MAZE_LENGTH), (cell.r + 1) * (COORD_SIZE / this.MAZE_LENGTH));
    }
    
    if (cell.edges.e) {
        context.moveTo((cell.c + 1) * (COORD_SIZE / this.MAZE_LENGTH), cell.r * (COORD_SIZE / this.MAZE_LENGTH));
        context.lineTo((cell.c + 1) * (COORD_SIZE / this.MAZE_LENGTH), (cell.r + 1) * (COORD_SIZE / this.MAZE_LENGTH));
    }

    if (cell.edges.w) {
        context.moveTo(cell.c * (COORD_SIZE / this.MAZE_LENGTH), cell.r * (COORD_SIZE / this.MAZE_LENGTH));
        context.lineTo(cell.c * (COORD_SIZE / this.MAZE_LENGTH), (cell.r + 1) * (COORD_SIZE / this.MAZE_LENGTH));
    }
}

function renderMaze() {
    context.strokeStyle = 'rgb(255, 255, 255)';
    context.lineWidth = 6;

    for (let m = 0; m < this.maze.length; m++){
        for (let n = 0; n < this.maze.length; n++){
            drawCell(this.maze[m][n]);
        }
    }
    context.stroke();

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(COORD_SIZE - 1, 0);
    context.lineTo(COORD_SIZE - 1, COORD_SIZE - 1);
    context.lineTo(0, COORD_SIZE - 1);
    context.closePath();
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.stroke();
}

function renderCharacter(character) {
    if (character.image.isReady) {
        
        if (firstRender){
            firstRender = false;
            if (this.MAZE_LENGTH == 5){
                character.image.width = character.image.width*2;
                character.image.height = character.image.width*2;
                adjC = 50;
                adjR = 5;
            }
            if (this.MAZE_LENGTH == 10){
                character.image.width = character.image.width*1.4;
                character.image.height = character.image.width*1.4;
                adjC = 20;
                adjR = 5;
            }
            if (this.MAZE_LENGTH == 15){
                adjC = 10;
                adjR = 0;
            }
            if (this.MAZE_LENGTH == 20){
                character.image.width = character.image.width/1.1;
                character.image.height = character.image.width/1.01;
                adjC = 2;
                adjR = 4;
            }
        }
        context.drawImage(document.getElementById('finish'),
            this.maze[this.MAZE_LENGTH-1][this.MAZE_LENGTH-1].c*(COORD_SIZE / this.MAZE_LENGTH)+adjC,
            this.maze[this.MAZE_LENGTH-1][this.MAZE_LENGTH-1].r*(COORD_SIZE / this.MAZE_LENGTH)+adjR,
            character.image.width,character.image.height);
        context.drawImage(character.image,
            character.location.c*(COORD_SIZE / this.MAZE_LENGTH)+adjC,
            character.location.r*(COORD_SIZE / this.MAZE_LENGTH)+adjR,
            character.image.width,character.image.height);
    }
    context.stroke();
}

function wallPush(tmpCell){
    for (let edge in tmpCell.edges){
        if (tmpCell.edges[edge]){
            this.wallList.push({
                r: tmpCell.r,
                c: tmpCell.c,
                edge: edge,
            });
        }
    }
}

function getRand(num){
    return Math.floor(Math.random() * num);
}

class Cell {
    constructor(r,c){
        this.r = r;
        this.c = c;
        this.isMaze = false;        //gen the maze
        this.isBreadCrumb = false;
        this.edges = {
            n: 1,
            s: 1,
            e: 1,
            w: 1
        }
    }
}

class myCharacter {
    constructor(imageSource,location){
        this.prevLoc = null;
        this.location = location;
        this.image = new Image();
        this.image.isReady = false;
        this.image.onload = function() {
            this.isReady = true;
            bothRendered = true;
        };
        this.image.src = imageSource;
    }
}

class Player {
    constructor(name,sc){
        this.name = name;
        this.sc = sc;
    }
}

function moveCharacter(key, character) {
    let tmp = character.location;
    if (key == 'ArrowUp' || key == 'w' || key == 'i') {
        if (!character.location.edges.n) {
            character.prevLoc = character.location;
            character.location = this.maze[tmp.r-1][tmp.c];
            updateShortPath(character);
            this.breadCrumb.push(character.prevLoc);
            computeHint();
            shouldRender = true;
        }
    }
    if (key == 'ArrowRight' || key == 'd' || key == 'l') {
        if (!character.location.edges.e) {
            character.prevLoc = character.location;
            character.location = this.maze[tmp.r][tmp.c+1];
            updateShortPath(character);
            this.breadCrumb.push(character.prevLoc);
            computeHint();
            shouldRender = true;
        }
    }
    if (key === 'ArrowDown' || key == 's' || key == 'k') {
        if (!character.location.edges.s) {
            character.prevLoc = character.location;
            character.location = this.maze[tmp.r+1][tmp.c];
            updateShortPath(character);
            this.breadCrumb.push(character.prevLoc);
            computeHint();
            shouldRender = true;
        }
    }
    if (key == 'ArrowLeft' || key == 'a' || key == 'j') {
        if (!character.location.edges.w) {
            character.prevLoc = character.location;
            character.location = this.maze[tmp.r][tmp.c-1];
            updateShortPath(character);
            this.breadCrumb.push(character.prevLoc);
            computeHint();
            shouldRender = true;
        }
    }
}

function toggleHint(){
    somethingToggled = true;
    if (shouldShowHint){
        shouldShowHint = false;
    }
    else {
        shouldShowHint = true;
    }
}

function toggleBreadCrumbs(){
    somethingToggled = true;
    if (shouldShowBreadCrumbs){
        shouldShowBreadCrumbs = false;
    }
    else {
        shouldShowBreadCrumbs = true;
    }
}

function togglePath(){
    somethingToggled = true;
    if (shouldShowPath){
        shouldShowPath = false;
    }
    else {
        shouldShowPath = true;
    }
}

function updateScore(){
    score++;
    document.getElementById('scoreValue').textContent = score;
}

function highScoreReport(){
    let previousScores = localStorage.getItem('scores');
    if (previousScores !== null) {
        highScores = JSON.parse(previousScores);
    }

    for (let i = 0; i < possibleScores.length; i++){
        let node = document.getElementById(possibleScores[i]);
        node.innerHTML = '';
        if (highScores[i]){
            for (let j = 0; j < highScores[i].length; j++){
                node.innerHTML += (' '+(j+1)+': Name: '+highScores[i][j].name+'<br/>'+
                    '    Score: '+highScores[i][j].sc+'<br/>');
            }
        }
    }
}

function processScore(person, sc){
    let tmpPlayer = new Player(person, sc);
    highScores[mazeScoreIndex].push(tmpPlayer);
    highScores[mazeScoreIndex].sort(function(obj1, obj2) {
        return obj1.sc - obj2.sc;
    });
    if (highScores[mazeScoreIndex].length > 5){
        let tmp = highScores[mazeScoreIndex].pop();
        if(!_.isEqual(tmpPlayer,tmp)){
            highScoreAchieved = true;
        }
    }
    localStorage['scores'] = JSON.stringify(highScores);
}

function gameOver(){
    var person;
    // while (person.length > 18){
        
    // }
    person = window.prompt('Please enter your name(less than 16 characters):', 'Anakin Skywalker');
    if (person == null || person == ''){
        person = 'Player ' + getRand(10000);
    }
    window.location.href = 'highScores.html';
    processScore(person, score);
}

function gameLoop(time){
    let elapsedTime = time - previousTime;
    previousTime = time;
    if (firstEnd && atEnd){
        firstEnd = false;
        gameOver();
    }

    processInput(elapsedTime);
    update(elapsedTime);
    render(elapsedTime);
    requestAnimationFrame(gameLoop);
}

function processInput(elapsedTime){
    for (input in inputBuffer) {
        if (inputBuffer[input] == 'ArrowUp' || inputBuffer[input] == 'ArrowRight' || inputBuffer[input] == 'ArrowDown' || inputBuffer[input] == 'ArrowLeft'
            || inputBuffer[input] == 'a' ||inputBuffer[input] == 'w' ||inputBuffer[input] == 's' ||inputBuffer[input] == 'd' ||
            inputBuffer[input] == 'j' ||inputBuffer[input] == 'i' ||inputBuffer[input] == 'l' ||inputBuffer[input] == 'k'){
            moveCharacter(inputBuffer[input], this.character);
        }
        else if (inputBuffer[input] == 'h'){
            toggleHint();
        }
        else if (inputBuffer[input] == 'p'){
            togglePath();
        }
        else if (inputBuffer[input] == 'b'){
            toggleBreadCrumbs();
        }
    }
    inputBuffer = {};
}

function update(elapsedTime){
    if (!atEnd){
        tmpTimer += elapsedTime;
        if (tmpTimer >= 1000){
            updateScore();
            tmpTimer -= 1000;
        }
    }
    if (shouldGen){
        shouldGen = false;
        genMaze();
        this.character = new myCharacter('../Images/minotaur.png',this.maze[0][0]);
        this.shortestPath = genShortPath();
        this.hint = shortestPath[0];
    }
}

function render(elapsedTime){
    if (somethingToggled || shouldShowBreadCrumbs || shouldShowPath || shouldShowHint || shouldRender){
        somethingToggled = false;
        shouldRender = true;
        context.clearRect(0,0,canvas.width,canvas.height);
    }
    if (shouldRender){
        if (bothRendered){
            shouldRender = false;
        }
        renderMaze();
        if (shouldShowBreadCrumbs){
            displayBreadCrumbs();
        }
        renderCharacter(this.character);
    }
    if (shouldShowPath){
        displayShortest();
    }
    if (shouldShowHint){
        displayHint();
    }
}

function setSize(size){
    localStorage.setItem('Size',size);
}

function initialize() {
    canvas = document.getElementById('canvas-main');
    context = canvas.getContext('2d');
    computeAdj();
    computeMazeScoreIndex();

    window.addEventListener('keydown', function(event) {
        inputBuffer[event.key] = event.key;
    });
    requestAnimationFrame(gameLoop);
}