
let terrain;
let tiles;
let w;
let h;
let nx;
let ny;

let zoom;
let maxAlt;

let camN;
let view;
let views;
let cameras;

let birdsEye;

let land;
let landPoint;

let weather;
let weatherPicker;
let weatherHover;

function setup() {
	textAlign(CENTER,CENTER);
	textFont('Futura');
  W = window.innerWidth;
  H = window.innerHeight;
  canvas = createCanvas(W, H);
  
  weatherPicker = true;
  weatherHover = false;
  
  w = 10;
  h = w*sqrt(3)/2;
  
  nx = ceil(W/w);
  ny = ceil(H/h);

  zoom = random(0.0030,0.0090);// 0.006;
  maxAlt = 300*0.0060/zoom;
  
  
  
  camN = 0;
  views = ['BirdsEye','Cameras'];
  view = 0;
  
  
  terrain = buildTerrain();
 
//   print(terrain);
  tiles = buildTiles();
  
  createGraphicBirdsEye();
	sceneToDraw();
	cursorTarget();
}

function magnitude(v){
	return sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
}

function unit(v){
	let m = magnitude(v);
	return {x:v.x/m, y:v.y/m, z: v.z/m};
}

function defineCameras(){
	
	// In my demo example, we never move to the right.
	// Therefore we can let right from cameras point of view (cameras[i].r) to remain {1,0,0}
	// So we can then simply cross product r and D to find up from cameras' POV. (see below)
	
	cameras = [
	  	{
		  P: {x:land.x,y:land.y-9*H/10,z:land.alt+600},
		  D: unit({x:0, y:1, z:-3}),
		  S: 800,
		  r: {x:1, y:0, z:0},
		  u: {x:0, y:0 , z:0},
		  imgPOV: createGraphics(W,H)
		},
		{
		  P: {x:land.x,y:land.y-5.5*H/10,z:land.alt+550},
		  D: unit({x:0, y:1, z:-7}),
		  S: 800,
		  r: {x:1, y:0, z:0},
		  u: {x:0, y:0 , z:0},
		  imgPOV: createGraphics(W,H)
		},
		{
		  P: {x:land.x,y:land.y-3.5*H/10,z:land.alt+420},
		  D: unit({x:0, y:1, z:-10}),
		  S: 800,
		  r: {x:1, y:0, z:0},
		  u: {x:0, y:0 , z:0},
		  imgPOV: createGraphics(W,H)
		},
		{
		  P: {x:land.x,y:land.y-2*H/10,z:land.alt+280},
		  D: unit({x:0, y:1, z:-23}),
		  S: 800,
		  r: {x:1, y:0, z:0},
		  u: {x:0, y:0 , z:0},
		  imgPOV: createGraphics(W,H)
		},
		{
		  P: {x:land.x,y:land.y-2.5*H/20,z:land.alt+190},
		  D: unit({x:0, y:1, z:-30}),
		  S: 800,
		  r: {x:1, y:0, z:0},
		  u: {x:0, y:0 , z:0},
		  imgPOV: createGraphics(W,H)
		},
		{
		  P: {x:W/2,y:0,z:maxAlt},
		  D: unit({x:0, y:1, z:-1}),
		  S: 800,
		  r: {x:1, y:0, z:0},
		  u: {x:0, y:0 , z:0},
		  imgPOV: createGraphics(W,H)
		}
	];
	for (var i=0; i<cameras.length; i+=1){
		cameras[i].u = crossProduct3(cameras[i].D,cameras[i].r);
	}
	
	calcTileColourGradient();//createGraphicsCamerasPOV
	buildTerrainCamerasView();
	for (var i=0; i<cameras.length; i+=1){
		createGraphicsCamerasPOV(i);
	}
	
	landPoint = [];
	for (var cn=0; cn<cameras.length; cn+=1){
		landPoint.push(map3To2(cameras[cn],{x:land.x,y:land.y,z:land.alt}));	
	}
}

function defineTileColours(A){
	let randomness = random(-4,4);
	if (A < 0.35*maxAlt){
		return [color(134+randomness, 201+randomness, 227+randomness),0.34*maxAlt]; // Water
	} else if (A < 0.37*maxAlt){
		return [color(237+randomness, 223+randomness, 133+randomness),0.36*maxAlt]; // Sand
	} else if (A < 0.40*maxAlt){
		return [color(123+randomness, 204+randomness, 120+randomness),false]; // Light Grass
	} else if (A < 0.50*maxAlt){
// 		if (random(0,1)>0.005){
			return [color(115+randomness, 194+randomness, 112+randomness),false]; // Grass
/*
		} else {
			return [color(150+randomness, 145+randomness, 137+randomness),false]; // Stone
		}
*/
	} else if (A < 0.56*maxAlt){
		return [color(115+randomness, 179+randomness, 112+randomness),false]; // Medium Grass
	} else if (A < 0.60*maxAlt){
		return [color(101+randomness, 150+randomness, 99+randomness),false]; // Dark Grass
	} else if (A < 0.63*maxAlt){
		return [color(128+randomness, 120+randomness, 91+randomness),false]; // Soil
	} else if (A < 0.68*maxAlt){
		return [color(94+randomness, 92+randomness, 82+randomness),false]; // Mud
	} else if (A < 0.70*maxAlt){
		return [color(88+randomness, 82+randomness, 94+randomness),false]; // Heather
	} else if (A < 0.72*maxAlt){
		return [color(74+randomness, 77+randomness, 74+randomness),false]; // Rock
	} else if (A < 0.75*maxAlt){
		return [color(168+randomness, 178+randomness, 181+randomness),false]; // Glacier
	} else {
		return [color(213+randomness, 226+randomness, 232+randomness),false]; // Snow
	}
}

function createGraphicBirdsEye(){
	birdsEye = createGraphics(W,H);
	for (var i=0; i<tiles.length; i+=1){
		tiles[i].drawBirdsEye();
	}
}

class Tile {
	constructor(P1,P2,P3,edge){
		this.ps = [P1,P2,P3];
		this.edge = edge;
		
		this.avgY = (P1.y + P2.y + P3.y)/3;
		this.avgAlt = (P1.alt + P2.alt + P3.alt)/3;
		let tileColOutput = defineTileColours(this.avgAlt);
		if (tileColOutput[1]){
			for (var count=0; count<3; count+=1){
				this.ps[count].alt = tileColOutput[1]+random(-0.01,0.01)*maxAlt;
				terrain[this.ps[count].id.y][this.ps[count].id.x].alt = this.ps[count].alt;
			}	
		}
		this.maxAltDiff = max([abs(this.ps[0].alt-this.ps[1].alt),abs(this.ps[0].alt-this.ps[2].alt),abs(this.ps[1].alt-this.ps[2].alt)]);
		if (this.avgAlt>0.60*maxAlt && this.maxAltDiff>0.05*maxAlt){
// 			this.col = lerpColor(tileColOutput[0],color(77, 75, 71),random(0.4,0.8));
			this.col = lerpColor(tileColOutput[0],color(105, 104, 100),random(0.4,0.8));
// 			this.col = lerpColor(tileColOutput[0],color(255, 170, 0),random(0.4,0.8));
		} else {
			this.col = tileColOutput[0];
		}
		this.colGradient = [];// lerpColor(this.col,color(199, 235, 237),0.3*this.ps[0].y/H);
	}
	
	drawBirdsEye(){
		birdsEye.fill(this.col);
		birdsEye.strokeWeight(1);
		birdsEye.stroke(this.col);
		birdsEye.triangle(this.ps[0].x,H-this.ps[0].y,this.ps[1].x,H-this.ps[1].y,this.ps[2].x,H-this.ps[2].y);
	}
	
	drawCameras(cn){
		cameras[cn].imgPOV.fill(this.colGradient[cn]);
		cameras[cn].imgPOV.strokeWeight(1);
// 		stroke(100,100,100,10);
		cameras[cn].imgPOV.stroke(this.colGradient[cn]);
		cameras[cn].imgPOV.triangle(this.ps[0].Cs[cn].x+W/2,this.ps[0].Cs[cn].y+H,this.ps[1].Cs[cn].x+W/2,this.ps[1].Cs[cn].y+H,this.ps[2].Cs[cn].x+W/2,this.ps[2].Cs[cn].y+H);
	}
	
	drawCamerasEdgeTiles(cn){
		if (this.edge.length){
			cameras[cn].imgPOV.line(this.ps[this.edge[0]].Cs[cn].x+W/2,this.ps[this.edge[0]].Cs[cn].y+H,this.ps[this.edge[1]].Cs[cn].x+W/2,this.ps[this.edge[1]].Cs[cn].y+H);
		}
	}
}

function buildTerrain(){
	let t = [];
	let X;
	let Y;
	let Alt;
	for (var i=0; i<ny; i+=1){
		t.push([]);
		for (var j=0; j<nx - i%2; j+=1){
			X = w*(j + (i%2)/2);
			Y = h*i;
			Alt = maxAlt*noise(X*zoom,Y*zoom);
			t[i].push({id:{y:i, x:j}, x:X, y:Y, alt:Alt, Cs:[]});
		}
	}
	return t;
}

function buildTerrainCamerasView(){
	for (var i=0; i<terrain.length; i+=1){
		for (var j=0; j<terrain[i].length; j+=1){
			terrain[i][j].Cs = [];
			for (var cn=0; cn<cameras.length; cn+=1){
// 				print({x:terrain[i][j].x,y:terrain[i][j].y,z:terrain[i][j].alt})
				terrain[i][j].Cs.push(map3To2(cameras[cn],{x:terrain[i][j].x,y:terrain[i][j].y,z:terrain[i][j].alt}));
			}
		}
	}
}

function buildTiles(){
	let t = [];
	let es;
	for (var i=0; i<ny-1; i+=1){
		for (var j=0; j<nx-1; j+=1){
			if (i==0 /* || (i==ny-2 && (ny-1)%2) */){
				es = [0,1];	
			}/*
			else if (i==ny-2 && (ny-2)%2) {
				es = [1,2];
			} 
			*/else {
				es = [];
			}
			if (!(i%2)){
				t.push(new Tile(terrain[i][j],terrain[i][j+1],terrain[i+1][j],es));
				if (terrain[i+1][j+1]){
					t.push(new Tile(terrain[i+1][j],terrain[i][j+1],terrain[i+1][j+1],[]));
				}
			} else {
				t.push(new Tile(terrain[i][j],terrain[i+1][j],terrain[i+1][j+1],es));
				if (terrain[i][j+1]){
					t.push(new Tile(terrain[i][j],terrain[i+1][j+1],terrain[i][j+1],[]));
				}
			}
		}
	}
	return t;
}

function drawTerrain(){
	strokeWeight(5);
	stroke(0);
	for (var i=0; i<terrain.length; i+=1){
		for (var j=0; j<terrain[i].length; j+=1){
			point(terrain[i][j].x,terrain[i][j].y);
		}
	}
}

function drawTilesBirdsEye(){
	image(birdsEye,0,0);
}
function drawCamerasPOV(){
	image(cameras[camN].imgPOV,-W/2,-H);
}

function createGraphicsCamerasPOV(cn){
	for (var i=tiles.length-1; i>0; i-=1){
		tiles[i].drawCameras(cn);
	}
	cameras[cn].imgPOV.stroke(91, 122, 81);
	cameras[cn].imgPOV.strokeWeight(2);
	for (var i=tiles.length-1; i>0; i-=1){
		tiles[i].drawCamerasEdgeTiles(cn);
	}
}

function calcTileColourGradient(){
	for (var i=tiles.length-1; i>0; i-=1){
		tiles[i].colGradient = [];
		for (var cn=0; cn<cameras.length; cn+=1){//101, 142, 148
			if (weather==='mist'){
				tiles[i].colGradient.push(lerpColor(tiles[i].col,color(199, 235, 237),1.3*atan((tiles[i].avgY-cameras[cn].P.y)/400)*2/PI));
			} else if (weather==='night'){
				tiles[i].colGradient.push(lerpColor(tiles[i].col,color(57, 67, 74),1.0*atan((tiles[i].avgY-cameras[cn].P.y)/400)*2/PI));
			} else if (weather==='fine'){
				tiles[i].colGradient.push(lerpColor(tiles[i].col,color(149, 204, 230),0.5*atan((tiles[i].avgY-cameras[cn].P.y)/2000)*2/PI));
			} else if (weather==='rain'){
				tiles[i].colGradient.push(lerpColor(tiles[i].col,color(101, 142, 148),1.5*atan((tiles[i].avgY-cameras[cn].P.y)/600)*2/PI));
			}
		}
	}
}

function drawBirdsEyeMap(){
	push();
	background(240);
	drawTilesBirdsEye();
	pop();
}

function drawCamerasMap(cn){
	if (weather==='mist'){
		background(199, 235, 237);
	} else if (weather==='night'){
		background(57, 67, 74);
		for (var i=0; i<600; i+=1){
			let D = random(0,1);
			strokeWeight(3*D*D+1);
			stroke(255-20*D, 255-20*D, 242-20*D,200-D*50);
			point(random(0,W),random(0,H));
		}
	} else if (weather==='fine'){
		background(149, 204, 230);
	} else if (weather==='rain'){
		background(101, 142, 148);
	}
	
	push();
	translate(W/2,H);
	drawCamerasPOV(cn);
	strokeWeight(3000/(land.y-cameras[cn].P.y));
	stroke(0,0,0,200);
	point(landPoint[cn].x,landPoint[cn].y);
// 	point(0,-H/2);
	if (weather==='rain'){
		print('yea')
		for (var i=0; i<600; i+=1){
			let D = random(0,1);
			let X = random(-W/2,W/2);
			let Y = random(-H,0);
			strokeWeight(3*D*D+1);
			stroke(88-20*D, 114-20*D, 117-20*D,200-D*150);
			line(X,Y,X+random(-2,7),Y+random(20,60));
		}
	}
	pop();
}

function cursorTarget(){
	noFill();
	strokeWeight(4);
	stroke(255);
	ellipse(mouseX,mouseY,40,40);
	line(mouseX-25,mouseY,mouseX-10,mouseY);
	line(mouseX+25,mouseY,mouseX+10,mouseY);
	line(mouseX,mouseY-25,mouseX,mouseY-10);
	line(mouseX,mouseY+25,mouseX,mouseY+10);
	strokeWeight(6);
	point(mouseX,mouseY);
	stroke(0);
	strokeWeight(2);
	ellipse(mouseX,mouseY,40,40);
	line(mouseX-25,mouseY,mouseX-10,mouseY);
	line(mouseX+25,mouseY,mouseX+10,mouseY);
	line(mouseX,mouseY-25,mouseX,mouseY-10);
	line(mouseX,mouseY+25,mouseX,mouseY+10);
	strokeWeight(4);
	point(mouseX,mouseY);
/*
	
	strokeWeight(8);
	stroke(0);
	point(mouseX,mouseY+2.5*H/10);
	point(mouseX,mouseY+2*H/10);
	point(mouseX,mouseY+3.5*H/10);
	point(mouseX,mouseY+5*H/10);
	point(mouseX,mouseY+7*H/10);
	
	strokeWeight(4);
	stroke(255);
	point(mouseX,mouseY+2.5*H/10);
	point(mouseX,mouseY+2*H/10);
	point(mouseX,mouseY+3.5*H/10);
	point(mouseX,mouseY+5*H/10);
	point(mouseX,mouseY+7*H/10);
*/
}

function draw(){
	if (weatherPicker){
		background(250);
		textSize(30);
		fill(30);
		noStroke();
		text('Choose Weather Mode:',W/2,2*H/7);
		fill(100);
		textSize(25);
		text('Fine',2*W/7,1*H/2);
		text('Mist',3*W/7,1*H/2);
		text('Rain',4*W/7,1*H/2);
		text('Night',5*W/7,1*H/2);
		stroke(23, 194, 194);
		strokeWeight(1);
		line(W/2-100,2*H/7+30,W/2+100,2*H/7+30);
		cursor('pointer');
		if (mouseX>2*W/7-30&&mouseX<2*W/7+30&&mouseY>H/2-20&&mouseY<H/2+20){
			weatherHover='fine';
			line(2*W/7-30,H/2+20,2*W/7+30,H/2+20);
		} else if (mouseX>3*W/7-30&&mouseX<3*W/7+30&&mouseY>H/2-20&&mouseY<H/2+20){
			weatherHover='mist';
			line(3*W/7-30,H/2+20,3*W/7+30,H/2+20);
		} else if (mouseX>4*W/7-30&&mouseX<4*W/7+30&&mouseY>H/2-20&&mouseY<H/2+20){
			weatherHover='rain';
			line(4*W/7-30,H/2+20,4*W/7+30,H/2+20);
		} else if (mouseX>5*W/7-30&&mouseX<5*W/7+30&&mouseY>H/2-20&&mouseY<H/2+20){
			weatherHover='night';
			line(5*W/7-30,H/2+20,5*W/7+30,H/2+20);
		} else {
			cursor('default');
			weatherHover = false;
		}
	} else {
		cursor('pointer');
		if (views[view]==='BirdsEye'){
			cursor('none');
			drawBirdsEyeMap();
			cursorTarget();
	  	}
	}
	if (mouseIsPressed&&!view&&!weatherPicker){
		background(30);
		textSize(25);
		fill(200);
		noStroke();
		text('Please Wait\n\nLoading...',W/2,H/2);
	}
}

function sceneToDraw(){
	if (views[view]==='BirdsEye'){
		drawBirdsEyeMap();
  	} else if (views[view]==='Cameras') {
  		drawCamerasMap(camN);
  	}
}

function mouseClicked(){
	if (weatherPicker){
		if (weatherHover){
			weatherPicker = false;
			weather = weatherHover;
		}
	} else {
// 		background(255);
		if (!view){
			
			land = {x:mouseX,y:H-mouseY,alt:terrain[floor((H-mouseY)/h)][floor(mouseX/w)].alt};
			defineCameras();
			view += 1;
			view = view%2;
			
		} else {
			camN += 1;
			if (camN == cameras.length){
				view = 0;
				camN = 0;
			}
		}
		sceneToDraw();
	}
}


window.onresize = function() {
  resizeCanvas(windowWidth, windowHeight);
  W = windowWidth;
  H = windowHeight
};

