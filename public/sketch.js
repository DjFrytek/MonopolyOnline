var socket;
let pointer;
let myID;

let mapTemplate;
let bankTemplate;

let pointers = [];

let things = [];
let thingsRenderOrder = [];

let consolelog = "";



let diceButton; //Przycisk rzutu koscia
let diceImage = []; //Tabela z grafikami kosci
let dice1; //Obiekt kosci
let dice2; //Obiekt kosci
let blueCards = [];
let redCards = [];
let rPressed = false;
let dPressed = false;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"]
let playerEqs = [];

let calculateEqsMoneyFlag = false;

let dollars1000 = [];
let dollars500 = [];
let dollars100 = [];
let dollars50 = [];
let dollars20 = [];
let dollars10 = [];
let dollars5 = [];

let animationSquares = [];

function setup() {
	playerEqs = [new playerEq(600, 0, 300, 400), new playerEq(900, 0, 300, 400), new playerEq(600, 400, 300, 400), new playerEq(900, 400, 300, 400)];
	let canvas = createCanvas(1200, 800);
	textAlign(CENTER);
	textSize(32);
	textStyle(BOLD);
	noStroke();
	canvas.position(0, 0);
	bankTemplate = loadImage("textures/bank.png");
	mapTemplate = loadImage("textures/board.png");
  
	socket = io();
	socket.on('yourID', registerMyID);
	socket.on('pointers', updateUsersPointers);
	socket.on('userMoved', userMoved);
	socket.on('syncThings', syncThings);
	socket.on('thingMoved', moveThing);
	socket.on('moveToTop', moveToTop);
	socket.on('diceResults', diceResults);
	socket.on('cardDrawn', swapCard);
	socket.on('setZoom', setZoom);
	socket.on('syncNames', syncNames);
	socket.on('playAnimation', playAnimationSquare);
	
	pointer = new Pointer(mouseX, mouseY);
	
	pushThings();
	
	diceButton = createButton("Roll dice");
	diceButton.mousePressed(rollDice);

	for(let i = 1; i < 7; i++) { //Zaladowanie grafik kostki
		diceImage[i] = loadImage("dice/Alea_" + i + ".png"); 
	}
	
	
}

function draw() {
	background(0);
	if(calculateEqsMoneyFlag) calculateEqsMoney();
	drawTemplate();
	
	
	pointer.move();
	
	
	for(let i = 0; i < thingsRenderOrder.length; i++) {
		things[thingsRenderOrder[i]].show();
	}
	
	dice1.playAnimation();
	dice2.playAnimation();
	
	for(let i = animationSquares.length - 1; i >= 0; i--) {
		if(animationSquares[i].life < 0) {
			animationSquares.splice(i, 1);
		} else {
			animationSquares[i].playAnimation();
		}
	}
	
	for(let i = 0; i < pointers.length; i++) {
		if(pointers[i].isMe == false) {
			pointers[i].show();
		}
	}
	
	push();
	fill(0);
	stroke(255);
	text(consolelog, 100, 40);
	textSize(18);
	text(floor(frameRate()), 20, 785);
	pop();
}

class Pointer {
	constructor(x, y) {
		this.pos = createVector(x, y);
		this.pressed = false;
		this.held = false;
	}
	
	move() {
		if(this.pos.x == mouseX && this.pos.y == mouseY) {
			return;
		} else {
			this.pos.x = mouseX;
			this.pos.y = mouseY;
			
			let data = {
				x: mouseX,
				y: mouseY,
				id: myID
			}
			socket.emit('mouseMoved', data);
		}
	}
}

class AnimationSquare {
	constructor(x, y, w, h, frames) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.frames = frames;
		this.life = frames;
	}
	
	playAnimation() {
		this.life--;
		push();
			fill(255, 255, 255, map(this.life, this.frames, 0, 150, 0));
			noStroke();
			rect(this.x, this.y, this.w, this.h);
		pop();
	}
}

function keyPressed() {
	if(keyCode == 82) {
		if(!rPressed) {
			rollDice();
		}
		rPressed = true;
	} else if(keyCode == 68) {
		if(!dPressed) {
			calculateEqsMoneyFlag = !calculateEqsMoneyFlag;
		}
		dPressed = true;
	}
	
}
function keyReleased() {
	if(keyCode == 82) {
		rPressed = false;
	} else if(keyCode == 68) {
		dPressed = false;
	}
}

function registerMyID(id) {
	myID = id;
}

function enableAll(pass) {
	socket.emit('enableAll', pass);
}

function disableAll(pass) {
	socket.emit('disableAll', pass);
}

function updateUsersPointers(data) {
	pointers = [];
	for(let i = 0; i < data.length; i++) {
		pointers.push(new OtherPointer(data[i].id, data[i].x, data[i].y, data[i].color));
	}
}

function changeName(playerIn, n, id) {
	socket.emit('changeNameRequest', {playerIndex: playerIn, name: n, id: myID});
}

function syncNames(names) {
	playerNames = names;
}

function changePointerColor(pI, c) {
	socket.emit('changeColorRequest', {pointerIndex: pI, color: c, id: myID});
}

function syncThings(data) {
	thingsRenderOrder = [];
	for(let i = 0; i < data.length; i++) {
		things[i].x = data[i].x;
		things[i].y = data[i].y;
		thingsRenderOrder.push(data[i].order);
	}
}

function playAnimationSquare(data) {
	animationSquares.push(new AnimationSquare(data.x, data.y, data.w, data.h, 25));
}

function moveThing(data) {
	things[data.i].x = data.x;
	things[data.i].y = data.y;
}

function userMoved(data) {
	pointers[findPointerByID(data.id)].move(data.x, data.y);
}

function diceResults(data) {
	let d1 = data.dice1;
	let d2 = data.dice2;
	dice1.state = d1;
	dice1.animation = 0;
	dice2.state = d2;
	dice2.animation = 0;
}
function rollDice() {
	socket.emit('rollDice', myID);
}

function setZoom(index) {
	document.getElementById("powiekszenie").src = things[index].zoom; //Ustawienie grafiki przyblizenia na ostatni wybrany obiekt
}

function swapCard(card) {
	if(card.color == 0) {
		document.getElementById("niebieska").src = "textures/blue" + card.index + ".png";
	}
	if(card.color == 1) {
		document.getElementById("niebieska").src = "textures/red" + card.index + ".png";
    }
}

function startingMoney(player) {
	socket.emit('startingMoney', player);
}

class OtherPointer {
	constructor(id, x ,y, color) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.isMe = id == myID;
		this.color = color;
	}
	
	move(x, y) {
		this.x = x;
		this.y = y;
	}
	
	show() {
		push();
		fill(this.color[0], this.color[1], this.color[2], 200);
		stroke(0)
		strokeWeight(1);
		ellipse(this.x, this.y, 10, 10);
		pop();
	}
}

function findPointerByID(id) {
	for(let i = 0; i < pointers.length; i++) {
		if(pointers[i].id == id) return i;
	}
}

function enterPassword(pass) {
	socket.emit('password', {password: pass, id: myID});
}

function mousePressed() {
	if(pointer.pressed == false) {
		pointer.pressed = true;
		pointerPressed();
	}
	pointer.held = true;
}

function mouseReleased() {
	pointer.pressed = false;
	pointer.held = false;
	pointerReleased();
}

function pointerPressed() {
	socket.emit('pointerPressed', {id: myID, zPressed: keyIsDown(90)});
}

function pointerReleased() {
	socket.emit('pointerReleased', myID);
}

function moveToTop(i) {
	let x = thingsRenderOrder[i];
	thingsRenderOrder.splice(i, 1);
	thingsRenderOrder.push(x);
}



class Thing {
  constructor(x, y, h, w, texture, name, zoom = "textures/diceRule.png", outline = 0) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
	this.name = name;
    this.zoom = zoom; //Grafika powiekszenia tego obiektu
    this.texture = loadImage("textures/" + texture);
    this.outline = outline;
  }
  
  show() {
    stroke(0);
    noFill();
	push();
    strokeWeight(this.outline);
    rect(this.x, this.y, this.w, this.h);
    image(this.texture, this.x, this.y, this.w, this.h);
	pop();
  }
  
  resetPosition() { //Uniemozliwienie przesuniecia obiektu poza ekran
    if(this.x + this.w > width) {
      this.x = width - this.w; 
    }
    if(this.x < 0) {
      this.x = 0; 
    }
    if(this.y + this.h > height) {
      this.y = height - this.h; 
    }
    if(this.y < 0) {
      this.y = 0; 
    }
  }
}

class Dice {
  constructor(x, y, h, w, name, zoom = "textures/diceRule.png") {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
    this.zoom = zoom; //Grafika powiekszenia tego obiektu
    this.animation = 15; //Poczatkowa klatka animacji
    this.state = 5;
  }
  
  show() {
    image(diceImage[this.state], this.x, this.y, 50, 50);
  }
  
  playAnimation() { //Animacja wyswietlana przy rzucie kostka
    noStroke();
    if(this.animation < 15) {
      fill(255, 255, 255, map(this.animation, 0, 15, 255, 0));
      rect(this.x, this.y, this.w, this.h, 10);
      this.animation++;
    }
    stroke(0);
  }
  
}

class playerEq {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.x2 = x + w;
		this.y2 = y + h;
		this.money = 0;
	}
}

function calculateEqsMoney() {
	for(let i = 0; i < playerEq.length; i++) {
		playerEqs[i].money = 0;
	}
	
	for(let i = 0; i < dollars1000.length; i++) {
		let d = dollars1000[i];
		for(let j = 0; j < playerEqs.length; j++) {
			if(d.x > playerEqs[j].x && d.x < playerEqs[j].x2 && d.y > playerEqs[j].y && d.y < playerEqs[j].y2) {
				playerEqs[j].money += 1000;
			}
		}
	}
	
	for(let i = 0; i < dollars500.length; i++) {
		let d = dollars500[i];
		for(let j = 0; j < playerEqs.length; j++) {
			if(d.x > playerEqs[j].x && d.x < playerEqs[j].x2 && d.y > playerEqs[j].y && d.y < playerEqs[j].y2) {
				playerEqs[j].money += 500;
			}
		}
	}
	
	for(let i = 0; i < dollars100.length; i++) {
		let d = dollars100[i];
		for(let j = 0; j < playerEqs.length; j++) {
			if(d.x > playerEqs[j].x && d.x < playerEqs[j].x2 && d.y > playerEqs[j].y && d.y < playerEqs[j].y2) {
				playerEqs[j].money += 100;
			}
		}
	}
	
	for(let i = 0; i < dollars50.length; i++) {
		let d = dollars50[i];
		for(let j = 0; j < playerEqs.length; j++) {
			if(d.x > playerEqs[j].x && d.x < playerEqs[j].x2 && d.y > playerEqs[j].y && d.y < playerEqs[j].y2) {
				playerEqs[j].money += 50;
			}
		}
	}
	
	for(let i = 0; i < dollars20.length; i++) {
		let d = dollars20[i];
		for(let j = 0; j < playerEqs.length; j++) {
			if(d.x > playerEqs[j].x && d.x < playerEqs[j].x2 && d.y > playerEqs[j].y && d.y < playerEqs[j].y2) {
				playerEqs[j].money += 20;
			}
		}
	}
	
	for(let i = 0; i < dollars10.length; i++) {
		let d = dollars10[i];
		for(let j = 0; j < playerEqs.length; j++) {
			if(d.x > playerEqs[j].x && d.x < playerEqs[j].x2 && d.y > playerEqs[j].y && d.y < playerEqs[j].y2) {
				playerEqs[j].money += 10;
			}
		}
	}
	
	for(let i = 0; i < dollars5.length; i++) {
		let d = dollars5[i];
		for(let j = 0; j < playerEqs.length; j++) {
			if(d.x > playerEqs[j].x && d.x < playerEqs[j].x2 && d.y > playerEqs[j].y && d.y < playerEqs[j].y2) {
				playerEqs[j].money += 5;
			}
		}
	}
}


function drawTemplate() {
  image(mapTemplate, 0, 0, 600, 600);
  image(bankTemplate, 0, 600, 600, 200);

  fill(120, 0, 0);
  rect(600, 0, 300, 400);
  fill(220, 0, 0);
  rect(605, 5, 290, 390);
	fill(120, 0, 0);
	rect(600, 0, 60, 80);
	fill(170, 0, 0);
	rect(605, 5, 50, 70);
  fill(120, 0, 0);
  text(playerNames[0], 750, 40);  
  push();
  textSize(48);
  if(calculateEqsMoneyFlag) text(playerEqs[0].money + "$", 750, 360);  
  pop();
	push();
	fill(0, 0, 0, 130);
	textSize(18);
	angleMode(DEGREES);
	push();
		translate(635, 40);
		rotate(-60);
		text("Zastaw", 0, 0);  
	pop();	
	
	pop();
  
  fill(0, 120, 0);
  rect(600, 400, 300, 400);
  fill(0, 220, 0);
  rect(605, 405, 290, 390);
	fill(0, 120, 0);
	rect(600, 400, 60, 80);
	fill(0, 170, 0);
	rect(605, 405, 50, 70);
  fill(0, 120, 0);
  text(playerNames[2], 750, 440);  
  push();
  textSize(48);
  if(calculateEqsMoneyFlag) text(playerEqs[2].money + "$", 750, 780);  
  pop();
 	push();
	fill(0, 0, 0, 130);
	textSize(18);
	angleMode(DEGREES);
	push();
		translate(635, 440);
		rotate(-60);
		text("Zastaw", 0, 0);  
	pop();	
	
	pop();
  
  fill(120, 120, 0);
  rect(900, 0, 300, 400);
  fill(220, 220, 0);
  rect(905, 5, 290, 390);
	fill(120, 120, 0);
	rect(900, 0, 60, 80);
	fill(170, 170, 0);
	rect(905, 5, 50, 70);
  fill(120, 120, 0);
  text(playerNames[1], 1050, 40);  
  push();
  textSize(48);
  if(calculateEqsMoneyFlag) text(playerEqs[1].money + "$", 1050, 360);  
  pop();
 	push();
	fill(0, 0, 0, 130);
	textSize(18);
	angleMode(DEGREES);
	push();
		translate(935, 40);
		rotate(-60);
		text("Zastaw", 0, 0);  
	pop();	
	
	pop();
  
  fill(0, 0, 120);
  rect(900, 400, 300, 400);
  fill(0, 50, 240);
  rect(905, 405, 290, 390);
	fill(0, 0, 120);
	rect(900, 400, 60, 80);
	fill(0, 30, 160);
	rect(905, 405, 50, 70);
  fill(0, 0, 120);
  text(playerNames[3], 1050, 440);
  push();
  textSize(48);
  if(calculateEqsMoneyFlag) text(playerEqs[3].money + "$", 1050, 780);  
  pop();
	push();
	fill(0, 0, 0, 130);
	textSize(18);
	angleMode(DEGREES);
	push();
		translate(935, 440);
		rotate(-60);
		text("Zastaw", 0, 0);  
	pop();	
	
	pop();  
  
  fill(255, 255, 255, 60);
  rect(600, 0, 600, 800);
}



function pushThings() {
  things.push(new Thing(450, 620, 30, 30, "outOfPrison.png", "oop")); 
  things.push(new Thing(450, 640, 30, 30, "outOfPrison.png", "oop")); 
  things.push(new Thing(430, 620, 30, 30, "outOfPrison.png", "oop")); 
  things.push(new Thing(430, 640, 30, 30, "outOfPrison.png", "oop")); 

  things.push(dice1 = new Dice(495, 620, 50, 50, "dice")); 
  things.push(dice2 = new Dice(515, 620, 50, 50, "dice")); 
  things.push(new Thing(420, 620, 48, 48, "bluePawn.png", "bp")); 
  things.push(new Thing(430, 620, 48, 48, "greenPawn.png", "gp")); 
  things.push(new Thing(440, 620, 48, 48, "redPawn.png", "rp")); 
  things.push(new Thing(450, 620, 48, 48, "yellowPawn.png", "yp")); 
  
  
  for(let i = 0; i < 10; i++) {
    things.push(new Thing(399, 708, 60, 30, "dollar1000m.png", "d1000")); 
	dollars1000.push(things[things.length-1]);
  }
  
  for(let i = 0; i < 30; i++) {
    things.push(new Thing(339, 708, 60, 30, "dollar500m.png", "d500")); 
	dollars500.push(things[things.length-1]);
  }
  
  for(let i = 0; i < 40; i++) {
    things.push(new Thing(279, 708, 60, 30, "dollar100m.png", "d100")); 
	dollars100.push(things[things.length-1]);
  }
  
  for(let i = 0; i < 30; i++) {
    things.push(new Thing(219, 708, 60, 30, "dollar50m.png", "d50")); 
	dollars50.push(things[things.length-1]);
  }
  
  for(let i = 0; i < 40; i++) {
    things.push(new Thing(159, 708, 60, 30, "dollar20m.png", "d20")); 
	dollars20.push(things[things.length-1]);
  }
  
  for(let i = 0; i < 50; i++) {
    things.push(new Thing(99, 708, 60, 30, "dollar10m.png", "d10")); 
	dollars10.push(things[things.length-1]);
  }
  
  for(let i = 0; i < 30; i++) {
    things.push(new Thing(39, 708, 60, 30, "dollar5m.png", "d5")); 
	dollars5.push(things[things.length-1]);
  }
  
  
  for(let i = 22; i >0; i--) {
    things.push(new Thing(474, 708, 60, 40, "card" + [i] + "m.png", "card" + i, "textures/card" + [i] + ".png", 2)); 
  }
  for(let i = 28; i > 22; i--) {
    things.push(new Thing(534, 708, 60, 40, "card" + [i] + "m.png", "card" + i, "textures/card" + [i] + ".png", 2)); 
  }
  
  for(let i = 0; i < 10; i++) {
    things.push(new Thing(39 + i * 12, 615, 30, 30, "house.png", "house")); 
  }
  
  for(let i = 0; i < 10; i++) {
    things.push(new Thing(39 + i * 12, 625, 30, 30, "house.png", "house")); 
  }
  
  for(let i = 0; i < 10; i++) {
    things.push(new Thing(39 + i * 12, 635, 30, 30, "house.png", "house")); 
  }
  for(let i = 0; i < 12; i++) {
    things.push(new Thing(39 + i * 10, 645, 30, 30, "hotel.png", "hotel")); 
  }
  
  //places.push(new Place(150, 150, 100, 100));
  //places.push(new Place(350, 350, 100, 100));
}


// let mapTemplate;
// let things = []; //Tablica z wszystkimi ruchomymi obiektami
// let holdingMouse = false; //Sprawdza, czy przycisk myszy jest wcisniety
// let pointerOffset; //Przesuniecie kursora wzgledem trzymanego obiektu
// let holdingNothing = true; //Czy nic nie jest trzymane
// let diceButton; //Przycisk rzutu koscia
// let diceImage = []; //Tabela z grafikami kosci
// let dice1; //Obiekt kosci
// let dice2; //Obiekt kosci
// let places = [];
// let blueCards = [];
// let redCards = [];


// function setup() {
	
  // let canvas = createCanvas(1200, 800);
  // textAlign(CENTER);
  // textSize(32);
  // textStyle(BOLD);
  // noStroke();
  // canvas.position(0, 0);
  // bankTemplate = loadImage("textures/bank.png");
  // mapTemplate = loadImage("textures/board.png");
  // pointerOffset = createVector(0, 0);
  
  // pushThings();
  
  // diceButton = createButton("Roll dice");
  // diceButton.mousePressed(rollDice);
  // for(let i = 1; i < 7; i++) { //Zaladowanie grafik kostki
    // diceImage[i] = loadImage("dice/Alea_" + i + ".png"); 
  // }
// }

// function draw() {
  // background(0);

  
  // drawTemplate();
  
    // for(let i = 0; i < things.length; i++) { //Pokazanie wszystkich obiektow
    // things[i].show(); 
    // things[i].resetPosition(); 
  // }
  // dice1.playAnimation(); //Uruchomienie animacji kostki
  // dice2.playAnimation(); //Uruchomienie animacji kostki
  
  
    
  // if(holdingMouse && !holdingNothing) { //Przesuwanie trzymanego obiektu z myszka
    // things[things.length - 1].x = mouseX + pointerOffset.x; 
    // things[things.length - 1].y = mouseY + pointerOffset.y; 
  // }
  // // text(mouseX, 20, 30);
  // // text(mouseY, 20, 60);
// }



// //Obiekt przedmiotu
// class Thing {
  // constructor(x, y, h, w, texture, zoom = "textures/diceRule.png", outline = 0) {
    // this.x = x;
    // this.y = y;
    // this.h = h;
    // this.w = w;
    // this.zoom = zoom; //Grafika powiekszenia tego obiektu
    // this.texture = loadImage("textures/" + texture);
    // this.outline = outline;
  // }
  
  // show() {
    // stroke(0);
    // strokeWeight(this.outline);
    // noFill();
    // rect(this.x, this.y, this.w, this.h);
    // image(this.texture, this.x, this.y, this.w, this.h);
  // }
  
  // resetPosition() { //Uniemozliwienie przesuniecia obiektu poza ekran
    // if(this.x + this.w > width) {
      // this.x = width - this.w; 
    // }
    // if(this.x < 0) {
      // this.x = 0; 
    // }
    // if(this.y + this.h > height) {
      // this.y = height - this.h; 
    // }
    // if(this.y < 0) {
      // this.y = 0; 
    // }
  // }
// }

// //Obiekt miejsca nieruchomego klikalnego
// class Place {
  // constructor(x, y, h, w) {
    // this.x = x;
    // this.y = y;
    // this.h = h;
    // this.w = w;
  // }
// }


// //Obiekt Kosci
// class Dice {
  // constructor(x, y, h, w, zoom = "textures/diceRule.png") {
    // this.x = x;
    // this.y = y;
    // this.h = h;
    // this.w = w;
    // this.zoom = zoom; //Grafika powiekszenia tego obiektu
    // this.animation = 15; //Poczatkowa klatka animacji
    // this.state = 5;
  // }
  
  // resetPosition() { //Uniemozliwienie przesuniecia obiektu poza ekran
    // if(this.x + this.w > width) {
      // this.x = width - this.w; 
    // }
    // if(this.x < 0) {
      // this.x = 0; 
    // }
    // if(this.y + this.h > height) {
      // this.y = height - this.h; 
    // }
    // if(this.y < 0) {
      // this.y = 0; 
    // }
  // }
  
  // show() {
    // image(diceImage[this.state], this.x, this.y, this.w, this.h);
  // }
  
  // playAnimation() { //Animacja wyswietlana przy rzucie kostka
    // noStroke();
    // if(this.animation < 15) {
      // fill(255, 255, 255, map(this.animation, 0, 15, 255, 0));
      // rect(this.x, this.y, this.w, this.h, 10);
      // this.animation++;
    // }
    // stroke(0);
  // }
  
// }




// function rollDice() { //Wylosowanie wyniku kostki po wcisnieciu przycisku
  // dice1.state = int(random(1, 7));
  // dice1.animation = 0;
  // dice2.state = int(random(1, 7));
  // dice2.animation = 0;
// }



// function mousePressed() {
  // holdingMouse = true;
  // for(let i = things.length - 1; i >= 0; i--) { //Sprawdzenie na ktory obiekt kliknieto
    // if(mouseX > things[i].x && mouseX < things[i].x + things[i].w && mouseY > things[i].y && mouseY < things[i].y + things[i].h) {
      // things.push(things[i]); //Dodanie kopii obiektu na koniec tablicy
      // things.splice(i, 1); //Usuniecie orginalnego obiektu
      // holdingNothing = false;
      // setZoomToThing();
      // break;
    // }
  // }
// // Ustawienie przesuniecia myszy wzgledem obiektu
    // pointerOffset.x = things[things.length - 1].x - mouseX; 
    // pointerOffset.y = things[things.length - 1].y - mouseY; 
  
  // if(holdingNothing) {
    // for(let i = places.length - 1; i >= 0; i--) { //Sprawdzenie na ktory obiekt kliknieto
      // if(mouseX > places[i].x && mouseX < places[i].x + places[i].w && mouseY > places[i].y && mouseY < places[i].y + places[i].h) {
        // drawCard(i);
      // }
    // }
  // }
// }

// function mouseReleased() {
  // holdingMouse = false;
  // holdingNothing = true;
// }

// function setZoomToThing() {
  // document.getElementById("powiekszenie").src = things[things.length - 1].zoom; //Ustawienie grafiki przyblizenia na ostatni wybrany obiekt
// }

// function drawCard(i) {
  // if(i == 0) {
    // //Wylosuj z blueCards karte i przypisz ja do getelementbyid niebieska
    // document.getElementById("niebieska").src = "textures/blue" + int(random(1, 17)) + ".png";
  // }
  // if(i == 1) {
    // document.getElementById("niebieska").src = "textures/red" + int(random(1, 17)) + ".png";
    // //Wylosuj z redCards karte i przypisz ja do getelementbyid niebieska
  // }
// }

// function drawTemplate() {
  // image(mapTemplate, 0, 0, 600, 600);
  // image(bankTemplate, 0, 600, 600, 200);

  // fill(120, 0, 0);
  // rect(600, 0, 300, 400);
  // fill(220, 0, 0);
  // rect(605, 5, 290, 390);
  // fill(120, 0, 0);
  // text("Player 1", 750, 40);  
  
  // fill(0, 120, 0);
  // rect(600, 400, 300, 400);
  // fill(0, 220, 0);
  // rect(605, 405, 290, 390);
  // fill(0, 120, 0);
  // text("Player 3", 750, 440);  
  
  // fill(120, 120, 0);
  // rect(900, 0, 300, 400);
  // fill(220, 220, 0);
  // rect(905, 5, 290, 390);
  // fill(120, 120, 0);
  // text("Player 2", 1050, 40);  
  
  // fill(0, 0, 120);
  // rect(900, 400, 300, 400);
  // fill(0, 50, 240);
  // rect(905, 405, 290, 390);
  // fill(0, 0, 120);
  // text("Player 4", 1050, 440);  
  
  // fill(255, 255, 255, 60);
  // rect(600, 0, 600, 800);
// }