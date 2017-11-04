var outputParagraph = document.getElementById("output");

var playButton = document.getElementById("playButton");

var stage = 0;
var bossNum = 0;

var gearArray = [];

var bossesArray = [
	{
		name: "Orcish Warlord",
		HP: 78,
		mAttacks: 3,
		mDamage: 15,
		rAttacks: 2,
		rDamage: 8,
		resist: {all: 0},
		defence: {castle: 0.6, flat: 0.4}
	}
	/**
	,
	{
		name: "Saurian Flanker",
		HP: 47,
		mAttacks: 4,
		mDamage: 8,
		rAttacks: 2,
		rDamage: 7,
		resist: {all: -0.1},
		defence: {castle: 0.6, flat: 0.4}		
	}
	*/
	,
	{
		name: "Dread Bat",
		HP: 33,
		mAttacks: 4,
		mDamage: 6,
		rAttacks: 0,
		rDamage: 0,
		resist: {all: 0.05},
		defence: {castle: 0.6, flat: 0.6}
	}
	,	
	{
		name: "Dwarf Fighter",
		HP: 38,
		mAttacks: 3,
		mDamage: 7,
		rAttacks: 0,
		rDamage: 0,
		resist: {all: 0.15},
		defence: {castle: 0.6, flat: 0.3}
	}
];			

playButton.addEventListener("click", main); // 

/** Main entry point **/
function main() {

	console.info("Main()...");

	var outputParagraph = document.getElementById("output"); // Identify output
	
	// Try to get location and handle "cannot", "cannot right now" or success.
	if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(runGame, errorGame);
	} else { 
		   outputParagraph.innerHTML = "Geolocation is not supported by this browser.";
	}
}

function errorGame(error) {
	console.warn(`ERROR(${error.code}): ${error.message}`);
	
	document.getElementById("output").innerHTML += "Sorry, I tried to get your location but couldn't. (see JavaScript console for details)";
	
	runGame(null);
}

function confirm(location) {
	document.getElementById("output").innerHTML += "Yes";
}

/**
	Game logic... check status then decide output then display it
**/
function runGame(position) {

	console.info("runGame()...");

	var outputBuffer; // for buffering output
	
	outputBuffer = p("Stage " + stage);
	
	// outputBuffer += p("Random: " + Math.random());
	
	// PICK BOSS
	
	if (stage == 0) {
	
		// console.info("bossesArray.length = " + bossesArray.length);
	
		bossNum = Math.floor(Math.random() * bossesArray.length);
	
	}
		
	outputBuffer += p("Today's boss is: " + bossesArray[bossNum].name);
	
	var targetLat = 51.487115;
	var targetLon = -0.206021;
	
	var userLat = targetLat + 0.002000; // Default/debugging values
	var userLon = targetLon + 0.002000; 
	
	// Only try to get user details if we know them
	if (position != null) {
			console.info("Position known...");
		userLat = position.coords.latitude;
		userLon = position.coords.longitude;
	}
	else
	{
			console.warn("Position is null!");
	}
	
	// Star Road
	// 51.4871159, 
	// -0.20602109999999998
	
	var distance = -1; // -1 for "null"
	
	// Calculate distance from user to target
	distance = geolib.getDistance(
		{latitude: userLat, longitude: userLon},
		{latitude: targetLat, longitude: targetLon}
	);
	
	outputBuffer += p("You are <b>" + distance + "</b> metres from the target.");

	outputBuffer += p("You are at " + userLat + ", " + userLon);
	
	//// Translate user location into grid
	var originLat = targetLat;
	var originLon = targetLon;
	
	var gameLat = userLat - originLat;
	var gameLon = userLon - originLon;
	
	outputBuffer += p("You are at relative coords " + gameLat + ", " + gameLon);
	
	// 1 degree longitude is about 70km at UK latitude
	// 1 degree latitude is about 110km
	
	// Define scale of the game grid in metres
	var gameScale = 100;
	
	// Define how big the "game area" roughly is in game squares.
	var gameRadius = 25;
	
	// Calculate relative position in metres (assumes UK latitudes!)
	var gameYm = gameLat * 70000;
	var gameXm = gameLon * 110000;
	
	// Use scale to calculate relative position in game grid
	var gameY = Math.round(gameYm / gameScale);
	var gameX = Math.round(gameXm / gameScale);

	// DEBUG: If geo position unavailable, randomise
	if (position == null) 
	{
		outputBuffer += p("Selecting random coordinates to debug");
		gameX = Math.round((Math.random() * 50)-25);
		gameY = Math.round((Math.random() * 50)-25);
	}
	
	var canvas = document.getElementsByTagName('canvas')[0];
	canvas.width = 50;
	canvas.height = 50;
	
	var ctx = canvas.getContext('2d');

	var image = ctx.createImageData(canvas.width, canvas.height);
	var data = image.data;
	
	/** RANDOMISE A MAP IMAGE TO HELP VISUALISE CURRENT mapGen function **/
	for (var drawX = 0; drawX < canvas.width; drawX++) {
		for (var drawY = 0; drawY < canvas.height; drawY++) {
			
			//var value = Math.abs(noise.simplex2(drawX / 10, drawY / 10)); // Bounces (abs) to give 0 to 1?
			
			var value = mapGen(drawX-(canvas.width/2), drawY-(canvas.width/2), gameRadius);
			
			//value *= 256; // Maps 0-1 to 0-256
			value *= 256; // Map the value onto 8 bit for an image
			
			var cell = (drawX + drawY * canvas.width) * 4; // Find the first (red) value of 4 (rgba) for this pixel
			data[cell] = data[cell + 1] = data[cell + 2] = value; // RGB?
			
			//data[cell] += Math.max(0, (25 - value) * 8); // Adjusts the red channel somehow
			
			data[cell + 3] = 255; // full alpha.
		}	
	}
	
	ctx.fillColor = 'black';
	ctx.fillRect(0, 0, 100, 100);
	ctx.putImageData(image, 0, 0);
	
	// DETAILS
	
	outputBuffer += p("You are at grid X" + gameX + ",Y" + gameY);
	
	// Use a noise function to get a value for the current grid
	
	// Seed noise library so it's is consistent for a given target
	// Procedurally generate "heat" for the current location
	
	// If digging, generate loot
	//if (stage > 0 && stage < 4) {
	if (stage > 0) {
	
		var seedA = (targetLat + targetLon);
		seedA = seedA - Math.floor(seedA);
		var seedB = (targetLat + targetLon) * 3;
		seedB = seedB - Math.floor(seedB);
		var seedC = (targetLat + targetLon) * 5;
		seedC = seedC - Math.floor(seedC);
		
		noise.seed(seedA);
		var heatA = mapGen(gameX,gameY, gameRadius);
		
		noise.seed(seedB);
		var heatB = mapGen(gameX,gameY, gameRadius);
		
		noise.seed(seedC);
		var heatC = mapGen(gameX,gameY, gameRadius);
		
		outputBuffer += p("seedA is " + seedA);
		outputBuffer += p("seedB is " + seedB);
		outputBuffer += p("seedC is " + seedC);
		
		outputBuffer += p("heatA here is " + heatA);
		outputBuffer += p("heatB here is " + heatB);
		outputBuffer += p("heatC here is " + heatC);

		// Factors in a fight in Wesnoth
		
		// your HP									 A
		// Your attacks                              W
		// your dam                                  W
		// their attacks
		// their dam
		// RANGED/MELEE                              W
		// Your protection profile                   A/M
		// Your terrain
		// Their protection profile
		// Their terrain
		// Your damage type                          W/M
		// Their resistances
		// Their damage type
		// Your resistances                          A/M
		// Defence-piercing (marksman / magic)       W/M
		// Who goes first
		
		tileIndex = (gameX+25 * 50) + gameY;
		
		console.info("tileIndex = " + tileIndex);
		
		var newGear;
		
		if (heatA >= heatB && heatA >= heatC) {
			newGear = generateWeapon(heatA, heatB, heatC, gameX, gameY);
		} else if (heatB >= heatA && heatB >= heatC) {
			newGear = generateArmour(heatA, heatB, heatC, gameX, gameY);
		} else if (heatC >= heatA && heatC >= heatB) {
			outputBuffer += p("magical");
		}
		
		// Print out the latest gear
		outputBuffer += JSON.stringify(newGear, null);
		
		// Convert stage to a 0-based index & store in global array
		gearArray[stage-2] = newGear;
	}
		
	if (distance < 20) {
		outputBuffer += p("<b>You are not at the target.</b>");
	}
	else
	{
		outputBuffer += p("You are not at the target.");
	}
	
	console.log("Stage was " + stage);
	
	stage = stage + 1;
	
	console.log("Next stage will be " + stage);
	
	// UPDATE UI
	var outputParagraph = document.getElementById("output");
	outputParagraph.innerHTML = outputBuffer;
}

function generateWeapon(heatA, heatB, heatC, gameX, gameY) {
	
	console.info("generateWeapon()");
	
	var newGear = {};
			
			newGear.type = "weapon";
	
			// Generate melee/ranged
			if (tileIndex % 2 == 1) { newGear.reach = "melee"; } else { newGear.reach = "ranged"; }
	
			// Generate attack properties directly from heat
			var newDamage = Math.max(1, 64 * heatA);
			
			newGear.attacks = Math.ceil(Math.random() * 6);
			newGear.hitDamage = Math.ceil(newDamage / newGear.attacks);
	
			// Generate attack type
			console.info("damageType seed " + gameX % 6);			
			newGear.damageType = ["blade","pierce","impact","fire","cold","arcane"][Math.abs(gameX % 6)];

			// Weapon ADJECTIVE
			if (heatA < 0.25) { newGear.adjective = "Crude"; }
			else if (heatA >= 0.25 && heatA < 0.5) { newGear.adjective = ""; }
			else if (heatA >= 0.5 && heatA < 0.75) { newGear.adjective = "Fine"; }
			else if (heatA >= 0.75) { newGear.adjective = "Epic"; }
			
			// Weapon NOUN
			switch(newGear.damageType) {
				case "blade":
					switch(newGear.reach) {
						case "melee":
							if(newGear.attacks < 3) { newGear.noun = "Axe"; } else { newGear.noun = "Sword"; }
							break;
						case "ranged":
							newGear.noun = "Chakram";
							break;
					}
					break;
				case "pierce":
					switch(newGear.reach) {
						case "melee":
							if (newGear.attacks == 1) { newGear.noun = "Lance"; } else { newGear.noun = "Spear"; }
							break;
						case "ranged":
							if (newGear.attacks == 1) { newGear.noun = "Javelin"; } else { newGear.noun = "Bow"; }
							break;
					}
					break;
				case "impact":
					switch(newGear.reach) {
						case "melee":
							newGear.noun = "Hammer";
							break;
						case "ranged":
							newGear.noun = "Sling";
							break;
					}
					break;
				case "fire":
					switch(newGear.reach) {
						case "melee":
							newGear.noun = "Fire Staff";
							break;
						case "ranged":
							newGear.noun = "Fire Wand";
							break;
					}
				break;
				case "cold":
					switch(newGear.reach) {
						case "melee":
							newGear.noun = "Ice Staff";
							break;
						case "ranged":
							newGear.noun = "Ice Wand";
							break;
					}
				break;
				case "arcane": 
					switch(newGear.reach) {
						case "melee":
							newGear.noun = "Arcane Staff";
							break;
						case "ranged":
							newGear.noun = "Wand";
							break;
					}
				break;
			}
			
	return newGear;
}

// armour drives HP, resistances and defences
// heatB is the primary value for armour
// A level 0 human has HP about 20
// So armour should give 0-80 E[HP] of benefit mixed amongst
// +HP
// defensive bonuses ...
// resistance bonuses (0-100%! on top of 0% baseline)
function generateArmour(heatA, heatB, heatC, gameX, gameY) {
	
	console.info("heatB = " + heatB);
	
	var newArmour = {
						type: "armour",
						defence: {},
						resist: {}
					};
	
	var EHPBonus = Math.round(heatB * 80);
	
	var defenceBonus = round(Math.min(heatB),1);
	
	// Weapon ADJECTIVE
		if (heatB < 0.25) { newArmour.adjective = "Crude"; }
		else if (heatB >= 0.25 && heatB < 0.5) { newArmour.adjective = ""; }
		else if (heatB >= 0.5 && heatB < 0.75) { newArmour.adjective = "Fine"; }
		else if (heatB >= 0.75) { newArmour.adjective = "Epic"; }
	
	// Step 1; does it protect, defend or resist?
	switch (Math.abs(gameX) % 3) {
		case 0:
			// Straight HP boost
			newArmour.HP = EHPBonus;
			newArmour.noun = "Armour";
			break;
		case 1:
			console.warn("dB = " + defenceBonus);
			newArmour.defence.all = defenceBonus;
			newArmour.noun = "Shield";
			break;
		case 2:
			newArmour.resist.all = round(heatB,1);
			newArmour.noun = "Cloak";
			break;
	}
	

	
	return newArmour;
}

// Avoid debugging in here - it gets called a lot
function mapGen(drawX, drawY, gameRadius) {

	var cellRadius = Math.sqrt(drawX * drawX + drawY * drawY);

	var noiseScale = 5; // 1 gives results like a mutually attractive white noise, bigger numbers give bigger features

	var value = (noise.simplex2(drawX / noiseScale, drawY / noiseScale) + 1)/2; // Mine goes from 0 to +1
	
	value = (value*value) // Peakiness function; suppresses values < 1
	
	// Scales the values down within the gameRadius
	value = value * Math.min((cellRadius/gameRadius),1);
	
	// Clip at 1
	value = Math.min(1,value);
	
	return value;
	// outputBuffer += p("At X"+ drawX + " Y" + drawY + " value = " + value); // Test debug map
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function p(text) {
	return "<p>" + text + "</p>\n\r";
}

