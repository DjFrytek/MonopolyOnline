var express = require('express');

var app = express();
var server = app.listen(3000);

app.use(express.static('public'));

var socket = require('socket.io');

var io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let width = 1200;
let height = 800;

let users = [];

let things = [];
let thingsRenderOrder = [];

let dice1; //Obiekt kosci
let dice2; //Obiekt kosci
let places = [];

let cardDrawn = 1;

let password = "aot";

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let colors = [
	[163, 21, 21],
	[21, 163, 21],
	[20, 32, 166],
	[219, 216, 24],
	[112, 15, 148],
	[88, 209, 161],
	[212, 110, 28],
	[144, 209, 31],
	[209, 31, 194]
];
let colorIndex = 0;

let playerEqPosition = [{x: 600, y: 40},
						{x: 900, y: 40},
						{x: 600, y: 440},
						{x: 900, y: 440}];


io.sockets.on('connection', newConnection);

function newConnection(socket) {
	console.log("New connection: " + socket.id);
	users.push(new User(socket.id, -10, -10, colors[colorIndex]));
	if(colorIndex < 8) colorIndex++;
	socket.on('disconnect', function () {
		console.log("disconnected " + socket.id);
		deleteUser(socket.id);
		io.emit('pointers', usersPointers());
	});
	socket.emit('yourID', socket.id);
	socket.emit('syncThings', thingsData());
	socket.emit('syncNames', playerNames);
	io.emit('pointers', usersPointers());
	
	socket.on('mouseMoved', mouseMoved);
	socket.on('pointerPressed', pointerPressed);
	socket.on('pointerReleased', pointerReleased);
	socket.on('rollDice', rollDice);
	socket.on('password', checkPassword);
	socket.on('enableAll', enableAll);
	socket.on('disableAll', disableAll);
	socket.on('startingMoney', startingMoney);
	socket.on('changeNameRequest', changeName);
	socket.on('changeColorRequest', changeColor);
	
	
	function mouseMoved(data) {
		if(findUserByID(data.id) != undefined) {
			users[findUserByID(data.id)].move(data.x, data.y);
			io.emit('userMoved', data);
		}
	}

}

function findUserByID(id) {
	for (let i = 0; i < users.length; i++) {
		if(users[i].id == id) {
			return i;
		}
	}
}

function rollDice(id) {
	if(!users[findUserByID(id)].enable) return;
	io.emit('diceResults', {dice1: Math.floor(Math.random() * 6 + 1), dice2: Math.floor(Math.random() * 6 + 1)});
}

function changeName(data) {
	if(!users[findUserByID(data.id)].enable) return;
	playerNames[data.playerIndex - 1] = data.name;
	io.emit('syncNames', playerNames);
}

function changeColor(data) {
	if(!users[findUserByID(data.id)].enable) return;
	users[data.pointerIndex].color = data.color;
	io.emit('pointers', usersPointers());
}

function startingMoney(player) {
	let index = player-1;
	let x = playerEqPosition[index].x;
	let y = playerEqPosition[index].y;
	
	x += 65;
	y += 10;
	things[10 + index].move(x, y, 10+index);
	x += 30;
	
	things[20 + index*2].move(x, y, 20+index*2);
	things[21 + index*2].move(x, y+5, 21+index*2);
	x+=30;
	
	things[50 + index*6].move(x, y, 50+index*6);
	things[51 + index*6].move(x, y+4, 51+index*6);
	things[52 + index*6].move(x, y+8, 52+index*6);
	things[53 + index*6].move(x, y+12, 53+index*6);
	things[54 + index*6].move(x, y+16, 54+index*6);
	things[55 + index*6].move(x, y+20, 55+index*6);
	x+=30;
	
	things[90 + index*4].move(x, y, 90+index*4);
	things[91 + index*4].move(x, y+5, 91+index*4);
	things[92 + index*4].move(x, y+10, 92+index*4);
	things[93 + index*4].move(x, y+15, 93+index*4);
	x+=30;
	
	things[120 + index*5].move(x, y+0, 120+index*5);
	things[121 + index*5].move(x, y+4, 121+index*5);
	things[122 + index*5].move(x, y+8, 122+index*5);
	things[123 + index*5].move(x, y+12, 123+index*5);
	things[124 + index*5].move(x, y+16, 124+index*5);
	x+=30;
	
	things[160 + index*8].move(x, y, 160+index*8);
	things[161 + index*8].move(x, y+3, 161+index*8);
	things[162 + index*8].move(x, y+6, 162+index*8);
	things[163 + index*8].move(x, y+9, 163+index*8);
	things[164 + index*8].move(x, y+12, 164+index*8);
	things[165 + index*8].move(x, y+15, 165+index*8);
	things[166 + index*8].move(x, y+18, 166+index*8);
	things[167 + index*8].move(x, y+21, 167+index*8);
	x+=30;
	
	things[210 + index*4].move(x, y, 210+index*4);
	things[211 + index*4].move(x, y+5, 211+index*4);
	things[212 + index*4].move(x, y+10, 212+index*4);
	things[213 + index*4].move(x, y+15, 213+index*4);
}

function checkPassword(data) {
	if(data.password == password) {
		users[findUserByID(data.id)].enable = true;
	}
}

function enableAll(pass) {
	if(pass == password) {
		for(let i = 0; i < users.length; i++) {
			users[i].enable = true;
		}
	}
}

function disableAll(pass) {
	if(pass == password) {
		for(let i = 0; i < users.length; i++) {
			users[i].enable = false;
		}
	}
}

function thingsData() {
	let data = [];
	for(let i = 0; i < things.length; i++) {
		data.push({
			x: things[i].x,
			y: things[i].y,
			order: thingsRenderOrder[i]
		})
	}
	return data;
}

function usersPointers() {
	console.log("Send to users update all pointers");
	let pointers = [];
	for(let i = 0; i < users.length; i++) {
		pointers.push({
			id: users[i].id,
			x: users[i].x,
			y: users[i].y,
			color: users[i].color
		});
	}
	console.log(pointers);
	return pointers;
}

class User {
	constructor(id, x, y, color) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.holding = undefined;
		this.holdingId;
		this.offsetX = 0;
		this.offsetY = 0;
		this.enable = false;
		this.color = color;
	}
	
	move(x, y) {
		this.x = x;
		this.y = y;
		
		if(this.holding != undefined) {
			this.holding.move(this.x + this.offsetX, this.y + this.offsetY, this.holdingId);
		}
	}
	
	pressed(zPressed) {
		if(!this.enable) return;
		for(let i = thingsRenderOrder.length-1; i >= 0; i--) {
			let t = things[thingsRenderOrder[i]];
			if(this.x > t.x && this.x < t.x + t.w && this.y > t.y && this.y < t.y + t.h && t.held == false) {
				if(!zPressed) {
					this.offsetX = t.x - this.x;
					this.offsetY = t.y - this.y;
					this.holding = t;
					this.holding.held = true;
					this.holdingId = thingsRenderOrder[i];
				} else {
					t.moveToSpawn(thingsRenderOrder[i]);
				}
				io.to(this.id).emit('setZoom', this.holdingId);
				moveToTop(i);
				return;
			}
		}
		
		for(let i = places.length - 1; i >= 0; i--) { //Sprawdzenie na ktory obiekt kliknieto
			if(this.x > places[i].x && this.x < places[i].x + places[i].w && this.y > places[i].y && this.y < places[i].y + places[i].h) {
				drawCard(i);
			}
		}
	}
	
	released() {
		if(this.holding != undefined) {
			this.holding.held = false;
			this.holding = undefined;
		}
	}
}

function drawCard(i) {
	cardDrawn = Math.floor(Math.random() * 16 + 1);
	console.log("drawn " + cardDrawn + " : " + i);
	io.emit('cardDrawn', {index: cardDrawn, color: i});
}

function pointerPressed(data) {
	let x = findUserByID(data.id);
	let y = users[findUserByID(data.id)];
	if(y == undefined) return;
	y.pressed(data.zPressed);
}

function pointerReleased(id) {
	let x = findUserByID(id);
	if(x == undefined) return;
	users[x].held = false;
	users[x].released();
}

function deleteUser(id) {
	users.splice(findUserByID(id), 1);
}

function moveToTop(i) {
	let x = thingsRenderOrder[i];
	thingsRenderOrder.splice(i, 1);
	thingsRenderOrder.push(x);
	io.emit('moveToTop', i);
}



class Thing {
  constructor(x, y, h, w, texture, name) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
	this.name = name;
	this.held = false;
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
  
  move(xx, yy, ii) {
	this.x = xx;
	this.y = yy;
	this.resetPosition();
	let data = {
		x: this.x,
		y: this.y,
		i: ii
		}
		io.emit('thingMoved', data);
	}
	
	moveToSpawn(index) {
		let spawn = mySpawn(this.name);
		if(spawn != false) {
			io.emit('playAnimation', {x: this.x, y: this.y, h: this.h, w: this.w});
			this.move(spawn.x, spawn.y, index);
		}
	}
}

function mySpawn(name) {
	if(name == "d1000") return {x: 399, y:708};
	if(name == "d500") return {x: 339, y:708};
	if(name == "d100") return {x: 279, y:708};
	if(name == "d50") return {x: 219, y:708};
	if(name == "d20") return {x: 159, y:708};
	if(name == "d10") return {x: 99, y:708};
	if(name == "d5") return {x: 39, y:708};
	return false;
}

class Dice {
  constructor(x, y, h, w, zoom = "textures/diceRule.png") {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
    this.zoom = zoom; //Grafika powiekszenia tego obiektu
	this.held = false;
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
  
  move(xx, yy, ii) {
	this.x = xx;
	this.y = yy;
	this.resetPosition();
	let data = {
		x: this.x,
		y: this.y,
		i: ii
		}
		io.emit('thingMoved', data);
	}
}

class Place {
  constructor(x, y, h, w) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
  }
}

pushThings();
for(let i = 0; i < things.length; i++) {
	thingsRenderOrder[i] = i;
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
    things.push(new Thing(399, 708, 60, 30, "dollar1000.png", "d1000")); 
  }
  
  for(let i = 0; i < 30; i++) {
    things.push(new Thing(339, 708, 60, 30, "dollar500.png", "d500")); 
  }
  
  for(let i = 0; i < 40; i++) {
    things.push(new Thing(279, 708, 60, 30, "dollar100.png", "d100")); 
  }
  
  for(let i = 0; i < 30; i++) {
    things.push(new Thing(219, 708, 60, 30, "dollar50.png", "d50")); 
  }
  
  for(let i = 0; i < 40; i++) {
    things.push(new Thing(159, 708, 60, 30, "dollar20.png", "d20")); 
  }
  
  for(let i = 0; i < 50; i++) {
    things.push(new Thing(99, 708, 60, 30, "dollar10.png", "d10")); 
  }
  
  for(let i = 0; i < 30; i++) {
    things.push(new Thing(39, 708, 60, 30, "dollar5.png", "d5")); 
  }
  
  
  for(let i = 22; i >0; i--) {
    things.push(new Thing(474, 708, 60, 40, "card" + [i] + ".png", "textures/card" + [i] + ".png", 1, "card" + i)); 
  }
  for(let i = 28; i > 22; i--) {
    things.push(new Thing(534, 708, 60, 40, "card" + [i] + ".png", "textures/card" + [i] + ".png", 1, "card" + i)); 
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
  
  places.push(new Place(150, 150, 100, 100));
  places.push(new Place(350, 350, 100, 100));
}

/*
0-3 oop
4-5 dice
6-9 pawns
10-19 1000s
20-49 500s
50-89 100s
90-119 50s
120-159 20s
160-209 10s
210-239 5s



*/