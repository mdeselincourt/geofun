var outputParagraph = document.getElementById("output");

var playButton = document.getElementById("playButton");

var stage = 0;
var bossNum = 0;

var gearArray = [];

var damageTypesArray = ["blade", "pierce", "impact", "fire", "cold", "arcane"];

function unit(hp, weapons, resist, defence) {
	this.HP = hp;
	this.weapons = weapons;
        this.resist = resist;
        this.defence = defence;
}

function weapon(name, damageType, damage, attacks) {
    this.name = name;
    this.damageType = damageType;
    this.damage = damage;
    this.attacks = attacks;
}

function damageTypes(blade, pierce, impact, fire, cold, arcane) {
    this.blade = blade;
    this.pierce = pierce;
    this.impact = impact;
    this.fire = fire;
    this.cold = cold;
    this.arcane = arcane;
}

function terrainTypes(castle, flat) {
    this.castle = castle;
    this.flat = flat;
}

var player = new unit(
        20, 
        {melee: new weapon("Fists", "impact", 3, 2)},
	new damageTypes(0.0,0.0,0.0,0.0,0.0,0.2),
	new terrainTypes(0.6, 0.4)
);

var bossesArray = [
	{
		name: "Orcish Warlord",
                level: 3,
		HP: 78,
		mAttacks: 3,
		mDamage: 15,
		rAttacks: 2,
		rDamage: 8,
		resist: {all: 0},
		defence: {castle: 0.6, flat: 0.4}
	}
	,
	{
		name: "Saurian Flanker",
                level: 3,
		HP: 47,
		mAttacks: 4,
		mDamage: 8,
		rAttacks: 2,
		rDamage: 7,
		resist: {all: -0.1},
		defence: {castle: 0.6, flat: 0.4}		
	}
	,
	{
		name: "Dread Bat",
		level: 2,
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
		name: "Elvish Marksman",
		level: 2,
                HP: 37,
		mDamage: 6,
                mAttacks: 2,
		rDamage: 9,
                rAttacks: 4,
		resist: {all: 0.05},
		defence: {castle: 0.6, flat: 0.6}
	}
	,
	{
		name: "Dwarf Fighter",
		level: 1,
                HP: 38,
		mAttacks: 3,
		mDamage: 7,
		rAttacks: 0,
		rDamage: 0,
		resist: {all: 0.15},
		defence: {castle: 0.6, flat: 0.3}
	}
        ,
        {
                name: "Thug",
		level: 1,
                HP: 32,
                mDamage: 5,	
                mAttacks: 4,
		rAttacks: 0,
		rDamage: 0,
		resist: {all: 0.03},
		defence: {castle: 0.6, flat: 0.4}
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
		
	outputBuffer += p("Today's boss is: ");
        
        outputBuffer += p(JSON.stringify(bossesArray[bossNum]));
	
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
	
	console.log("You are at relative coords " + gameLat + ", " + gameLon);
	
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
	if (stage > 0 && stage < 4) {
	//if (stage > 0) {
	
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
		
		console.log("seedA is " + seedA);
		console.log("seedB is " + seedB);
		console.log("seedC is " + seedC);
		
		outputBuffer += p("heatA here is " + heatA);
		outputBuffer += p("heatB here is " + heatB);
		outputBuffer += p("heatC here is " + heatC);

		// Factors in a fight in Wesnoth
		
		// your HP				     A
		// Your attacks                              W
		// your dam                                  W
		// their attacks
		// their dam
		// RANGED/MELEE                              W
		// Your defence profile                      A/M
		// Your terrain
		// Their defence profile
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
			newGear = generateMagical(heatA, heatB, heatC, gameX, gameY);
		}
		
		// Print out the latest gear
		outputBuffer += JSON.stringify(newGear, null);
		console.log(JSON.stringify(newGear, null));
		
		// Convert stage to a 0-based index & store in global array
		gearArray[stage-1] = newGear;
	}
	
	if (stage > 3) {
		
		console.log("Player before: " + JSON.stringify(player, null));
		
		applyGear();
		
		outputBuffer += "Player: " + JSON.stringify(player,null);
		
		resolveBoss();
		
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
			newGear.damage = Math.ceil(newDamage / newGear.attacks);
	
			// Generate attack type
			console.info("damageType seed " + gameX % 6);			
			newGear.damageType = damageTypesArray[Math.abs(gameX % damageTypesArray.length)];

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
						HP: 0,
						defence: {castle: 0.0, flat: 0.0},
						resist: {all: 0}
					};
	
	var EHPBonus = Math.round(heatB * 80);
	
	var defenceBonus = round(heatB * 0.3,1);
	
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

/**
 * A magical item which might 
 * 
 * @param {type} heatA
 * @param {type} heatB
 * @param {type} heatC
 * @param {type} gameX
 * @param {type} gameY
 * @returns {undefined}
 */
function generateMagical(heatA, heatB, heatC, gameX, gameY) {
    
    console.info("generateMagical()");
    
    var newMagical = {
        type: "magical item",
        defence: {all: 0},
        resist: {all: 0},
        adjective: "",
        noun: "Ring"
    };
    
    // Magical ADJECTIVE
	if (heatC < 0.25) { newMagical.adjective = "Crude"; }
	else if (heatC >= 0.25 && heatC < 0.5) { newMagical.adjective = ""; }
	else if (heatC >= 0.5 && heatC < 0.75) { newMagical.adjective = "Fine"; }
	else if (heatC >= 0.75) { newMagical.adjective = "Epic"; }
    
    if (Math.abs(gameY % 2) == 0) {
        // Defensive item
        if (Math.abs((gameX) % 2)) {
            newMagical.defence.all = round(heatC * 0.3,1);
            newMagical.noun = "Ring of Defence";
        }
        else
        {
           newMagical.resist.all = round(heatC * 0.3,1);
           newMagical.noun = "Ring of Resistance";
        }
    }
    else
    {
        // Offensive item
        if (Math.abs(gameY % 2) == 0) {
            newMagical.minHit = round(0.4 + (heatC * 0.3));
            newMagical.noun = "Ring of Accuracy";
        }
        else
        {
            newMagical.damageType = damageTypesArray[Math.floor(Math.random() * damageTypesArray.length)];
            newMagical.noun = "Ring of " + newMagical.damageType;
        }
    }
    
    return newMagical;
    
}

function applyGear() {

	console.log("applyGear()");
	
	for (var gearIndex = 0; gearIndex < gearArray.length; gearIndex++) {
		
		var thisGear = gearArray[gearIndex];
		
		console.log("Applying " + gearIndex + ":" + JSON.stringify(thisGear,null));
		
		switch (gearArray[gearIndex].type) {
			case "weapon":
				switch (thisGear.reach) {
					case "melee":
						player.mDamage = thisGear.damage;
						player.mAttacks = thisGear.attacks;
						player.mDamageType = thisGear.damageType;
						break;
					case "ranged":
						player.rDamage = thisGear.damage;
						player.rAttacks = thisGear.attacks;
						player.rDamageType = thisGear.damageType;
						break;
				}
				break;
			case "armour":
				player.HP = player.HP + thisGear.HP;
				player.resist.all = player.resist.all + thisGear.resist.all;
				
				for (var key in player.defence) {
					var value = player.defence[key];
					//console.log(JSON.stringify(value));
					player.defence[key] = player.defence[key] + thisGear.defence[key];
				
				}				
				break;
			case "magical item":
			
				//
			
				player.resist.all = player.resist.all + thisGear.resist.all;
				
				//player.defence.all = player.defence.all + thisGear.defence.all;
				
				for (var key in player.defence) {
					var value = player.defence[key];
					//console.log(JSON.stringify(value));
					player.defence[key] = player.defence[key] + thisGear.defence[key];
				}
				
				
				player.mDamageType = thisGear.damageType;
				player.rDamageType = thisGear.damageType;
				break;
		}
		
		console.log("Player update: " + JSON.stringify(player, null));
	}
}



function resolveBoss() {

	var yourTurn = false; // Start on the defensive (so firststrike can help)
	
	var boss = bossesArray[bossNum];
	

};

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

