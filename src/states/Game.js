/* globals __DEV__ */
import Phaser from 'phaser';

import level1jsonMap from '../../assets/level1.json';

const TAU = Math.PI * 2;

const playerWidth = 32;
const playerHeight = 32;
const playerWalkSpeed = 1.5;
const playerRunSpeed = playerWalkSpeed * 3;

const worldWidth = 16;
const worldHeight = 16;
const worldPreferredOrbit = 90;
const worldAngularSpeed = (TAU / 2) / 60;

export default class extends Phaser.State {
    init () {}
    preload () {}

    create () {
	this.game.stage.backgroundColor = '#787878';

	this.tilemap = this.game.add.tilemap('level1');
	this.tilemap.addTilesetImage('overworld', 'overworld');
	this.groundLayer = this.tilemap.createLayer('Ground');
	this.groundLayer.resizeWorld();
	this.obstacleLayer = this.tilemap.createLayer('Obstacles');

	this.npcs = [];
	this.createEntitiesFromJsonMap(level1jsonMap);
	this.walkableIndices = this.getTileIndices(this.tilemap, 'walkable');
	this.blockingIndices = this.getTileIndices(this.tilemap, 'blocks');

	this.camera.follow(this.player.sprite);

	this.hurtBorder = this.game.add.sprite(0, 0, "hurt-border");
	this.hurtBorder.fixedToCamera = true;
	this.hurtBorder.alpha = 0;

	this.world = this.makeWorld(this.player);
    }

    render () {
        if (__DEV__) {
        }
    }

    update() {
	this.controlPlayer();
	this.updateWorld();
	for (const npc of this.npcs) {
	    npc.updateFunc.call(this, npc);
	}
	this.checkContactDamage();
	this.updatePlayerHealth();
        this.player.sprite.x = this.player.x;
        this.player.sprite.y = this.player.y;
    }

    makePlayer ({x, y}) {
	return {
	    x, y,
	    maxHealth: 100,
	    health: 100,
	    healthRegenDelay: 3,  // seconds
	    healthRegen: 25,  // per second
	    lastDamageTime: 0,
	    knockbackSpeed: 3.5,
	    knockbackDuration: 0.7,
	    sprite: this.game.add.sprite(
	    	x, y, 'player', 1
	    )
	};
    }

    makeKid ({x, y}) {
	const sprite = this.game.add.sprite(
 	    x, y, 'kid', 1
	);
	sprite.animations.add('walk right', [0, 1], 2, true);
	sprite.animations.add('walk left', [2, 3], 2, true);
	sprite.animations.add('talk', [10, 11], 2, true);
	sprite.animations.add('fall right', [4, 5], 1, false);
	sprite.animations.add('fall left', [4, 5], 1, false);

	return {
	    x, y,
	    state: "idle",
	    homeX: x, homeY: y,
	    destX: x, destY: y,
	    speed: 0.7,
	    updateFunc: this.updateKid,
	    sprite
 	};
    }

    makeGuard ({x, y}) {
	const sprite = this.game.add.sprite(
 	    x, y, 'guard', 1
	);
	sprite.animations.add('walk left', [0], 2, true);
	sprite.animations.add('walk right', [10], 2, true);
	sprite.animations.add('fall left', [20, 21], 2, true);
	sprite.animations.add('fall right', [30, 31], 1, false);

	return {
	    x, y,
	    state: "idle",
	    homeX: x, homeY: y,
	    destX: x, destY: y,
	    speed: 0.7,
	    runSpeed: playerWalkSpeed * 1.7,
	    aggroRange: worldPreferredOrbit * 1.7,
	    contactDamage: 15,
	    updateFunc: this.updateGuard,
	    sprite
 	};
    }

    makeWorld (player) {
	const x = player.x + worldPreferredOrbit;
	const y = player.y;
	return {
	    x, y,
	    // vx and vy are not used for physics, but are recorded when the world is updated and
	    // (may be) used by collision recipients to find out what direction they've been hit from
	    vx: 0,
	    vy: 1,
	    sun: player,
	    sprite: this.game.add.sprite(
		x, y, 'world', 0
	    ),
	    dummyProp: false
	};
    }

    createEntitiesFromJsonMap(jsonMap) {
	const player = this.getObjectsFromJsonMap(jsonMap, {type: 'player'});
	this.player = this.makePlayer(player[0]);

	const kids = this.getObjectsFromJsonMap(jsonMap, {type: 'kid'});
	for (const kid of kids) {
	    this.npcs.push(this.makeKid(kid));
	}

	const guards = this.getObjectsFromJsonMap(jsonMap, {type: 'guard'});
	for (const guard of guards) {
	    this.npcs.push(this.makeGuard(guard));
	}
    }

    getObjectsFromJsonMap(jsonMap, {type}) {
	const layerArray = jsonMap.layers
	      .filter(layer => layer.name === 'Characters');
	if (layerArray.length < 1) {
	    throw new Error("Object layer not found");
	}
	const objs = layerArray[0].objects;
	return objs.filter(obj =>
			   type === undefined ? true : obj.type === type
			  );
    }

    controlPlayer() {
	let newX = this.player.x;
	let newY = this.player.y;

	if (this.player.state === "knocked back") {
	    if (this.player.lastDamageTime + this.player.knockbackDuration
	        < game.time.totalElapsedSeconds()) {
	        this.player.state = "normal";
	        return;
	    }
	    newX = this.player.x + this.player.knockbackSpeed * Math.cos(this.player.knockbackAngle);
	    newY = this.player.y + this.player.knockbackSpeed * Math.sin(this.player.knockbackAngle);
	} else {
	    
	    let kbd = this.game.input.keyboard;

	    const isLeftPressed = (kbd.isDown(Phaser.KeyCode.A) ||
				   kbd.isDown(Phaser.KeyCode.LEFT));
	    const isRightPressed = (kbd.isDown(Phaser.KeyCode.D) ||
				    kbd.isDown(Phaser.KeyCode.RIGHT));
	    const isUpPressed = (kbd.isDown(Phaser.KeyCode.W) ||
				 kbd.isDown(Phaser.KeyCode.UP));
	    const isDownPressed = (kbd.isDown(Phaser.KeyCode.S) ||
				   kbd.isDown(Phaser.KeyCode.DOWN));
	    const isRunPressed = kbd.isDown(Phaser.KeyCode.SHIFT);

	    const speed = isRunPressed ? playerRunSpeed : playerWalkSpeed;

	    if (isLeftPressed) {
		newX -= speed;
	    }
	    if (isRightPressed) {
		newX += speed;
	    }
	    if (isUpPressed) {
		newY -= speed;
	    }
	    if (isDownPressed) {
		newY += speed;
	    }
	}

	const offsets = [{x: 0.3, y: 0.35},
			 {x: 0.7, y: 0.35},
			 {x: 0.3, y: 0.9},
			 {x: 0.7, y: 0.9}];
	let okToMove = true;
	for (const {x, y} of offsets) {
	    okToMove = okToMove
	        && this.isPosnWalkable(newX + x * playerWidth, newY + y * playerHeight)
		&& !this.isPosnBlocked(newX + x * playerWidth, newY + y * playerHeight);
	}
	if (okToMove) {
	    this.player.x = newX;
	    this.player.y = newY;
	}
    }

    isPosnWalkable(x, y) {
	const tile = this.tilemap.getTileWorldXY(x, y, undefined, undefined, "Ground", true);
	if (tile === null) { return false };
	const groundIndex = tile.index;
	return this.walkableIndices.indexOf(groundIndex) >= 0;
    }

    isPosnBlocked(x, y) {
	const tile = this.tilemap.getTileWorldXY(x, y, undefined, undefined, "Obstacles", true);
	if (tile === null) { return true };
	const obstaclesIndex = tile.index;
	return this.blockingIndices.indexOf(obstaclesIndex) >= 0;
    }

    updateWorld() {
	const sunX = this.world.sun.x;
	const sunY = this.world.sun.y;
	const dist = Math.sqrt(
	    (sunX - this.world.x) * (sunX - this.world.x) +
	    (sunY - this.world.y) * (sunY - this.world.y)
	);
	const prefDist = worldPreferredOrbit;
	let newDist = dist;
	if (newDist > prefDist) {
	    let catchUp = Math.min(0.01 * (newDist - prefDist), 2);
	    newDist -= catchUp;
	    if (newDist < prefDist) {
		newDist = prefDist;
	    }
	} else if (newDist < prefDist) {
	    let catchUp = Math.min(0.05 * (prefDist - newDist), 2);
	    newDist += catchUp;
	    if (newDist > prefDist) {
		newDist = prefDist;
	    }
	} 

	let newAngle = Math.atan2(this.world.y - sunY, this.world.x - sunX) + worldAngularSpeed;
	let newX = sunX + newDist * Math.cos(newAngle);
	let newY = sunY + newDist * Math.sin(newAngle);

	const offsets = [{x: 0.1, y: 0.1},
			 {x: 0.9, y: 0.1},
			 {x: 0.1, y: 0.9},
			 {x: 0.9, y: 0.9}];
	let okToMove = true;
	// for (const {x, y} of offsets) {
	//     okToMove = okToMove
	// 	&& !this.isPosnBlocked(newX + x * worldWidth, newY + y * worldHeight);
	// }
	if (okToMove) {
	    this.world.vx = newX - this.world.x;
	    this.world.vy = newX - this.world.y;
	    this.world.x = newX;
	    this.world.y = newY;
	} else {
	    // try to scrape along the object in the x and y directions only
	    let angleOfTravel = Math.atan2(newY - this.world.y, newX - this.world.x);
	    let speedOfTravel = Math.sqrt(
		(newX - this.world.x) * (newX - this.world.x) +
		    (newY - this.world.y) * (newY - this.world.y)
	    );
	    let drag = 0;
	    if (dist > worldPreferredOrbit) {
		drag = (dist - worldPreferredOrbit) / (0.4 * worldPreferredOrbit);
		if (drag > 1) { drag = 1; }
	    }
	    let attempt = 0;
	    while (attempt < 2) {
		let newNewX = this.world.x;
		let newNewY = this.world.y;
		if (attempt === 0) {
	            newNewY += speedOfTravel * 0.6 * (1-drag) * Math.sin(angleOfTravel);
		} else {
	            newNewX += speedOfTravel * 0.6 * (1-drag) * Math.cos(angleOfTravel);
		}
	        let okToMove = true;
	        for (const {x, y} of offsets) {
	            okToMove = okToMove
		        && !this.isPosnBlocked(newNewX + x * worldWidth, newNewY + y * worldHeight);
	        }
	        if (okToMove) {
		    this.world.vx = newNewX - this.world.x;
		    this.world.vy = newNewX - this.world.y;
		    this.world.x = newNewX;
		    this.world.y = newNewY;
		    break;
	        }
		attempt += 1;
	    }
	}
	
	this.world.sprite.x = this.world.x;
	this.world.sprite.y = this.world.y;
    }

    checkContactDamage() {
	if (this.player.state === "knocked back") {
	    return;
	}
	for (const npc of this.npcs) {
	    if (npc.state === "bonked" || !npc.hasOwnProperty("contactDamage")) {
		continue;
	    }
	    if (Phaser.Rectangle.intersects(npc.sprite, this.player.sprite)) {
		this.player.knockbackAngle = Math.atan2(this.player.y - npc.y, this.player.x - npc.x);
		this.player.state = "knocked back";
		this.damagePlayer(npc.contactDamage);
	    }
	}
    }

    damagePlayer(damage) {
	console.log("damage");
	this.player.lastDamageTime = game.time.totalElapsedSeconds();
	this.player.health -= damage;
	if (this.player.health < 0) {
	    this.player.health = 0;
	    console.log("dead!");
	}
    }

    updateKid(kid) {
	switch (kid.state) {
	case "idle":
	    this.kidSkip(kid);
	}
    }

    kidSkip(kid) {
	this.walkAround(kid);

	kid.sprite.x = kid.x;
	kid.sprite.y = kid.y;

	if (Phaser.Rectangle.intersects(kid.sprite, this.world.sprite)) {
	    this.getBonked(kid);
	}
    }

    updateGuard(guard) {
	switch (guard.state) {
	case "idle":
	    this.walkAround(guard);
	    this.checkAggro(guard);
	    this.checkBonk(guard);
	    break;
	case "aggro":
	    this.updateAggro(guard);
	    this.checkBonk(guard);
	    break;
	}
	guard.sprite.x = guard.x;
	guard.sprite.y = guard.y;
    }

    checkAggro(guard) {
	const dist = Math.sqrt(
	    (guard.homeX - this.player.x) * (guard.homeX - this.player.x) +
		(guard.homeY - this.player.y) * (guard.homeY - this.player.y)
	);
	if (dist < guard.aggroRange) {
	    guard.state = "aggro";
	}
    }

    updateAggro(guard) {
	const dist = Math.sqrt(
	    (guard.homeX - this.player.x) * (guard.homeX - this.player.x) +
		(guard.homeY - this.player.y) * (guard.homeY - this.player.y)
	);
	if (dist > guard.aggroRange) {
	    guard.state = "idle";
	    return;
	}
	
	const angle = Math.atan2(this.player.y - guard.y, this.player.x - guard.x);
	guard.x += guard.runSpeed * Math.cos(angle);
	guard.y += guard.runSpeed * Math.sin(angle);
    }

    checkBonk(npc) {
	if (Phaser.Rectangle.intersects(npc.sprite, this.world.sprite)) {
	    this.getBonked(npc);
	}
    }

    getBonked(npc) {
	npc.state = "bonked";
	npc.sprite.animations.play("fall right");
    }

    walkAround(npc) {
	if (Math.abs(npc.destX - npc.x) < 2 && Math.abs(npc.destY - npc.y) < 2) {
	    npc.destX = npc.homeX + game.rnd.between(-48, 48);
	    npc.destY = npc.homeY + game.rnd.between(-48, 48);
	}
	const angle = Math.atan2(npc.destY - npc.y, npc.destX - npc.x);
	const dx = npc.speed * Math.cos(angle);
	const dy = npc.speed * Math.sin(angle);
	npc.x += dx;
	npc.y += dy;
	if (dx < 0) {
	    npc.sprite.animations.play("walk left");
	} else {
	    npc.sprite.animations.play("walk right");
	}
    }

    updatePlayerHealth() {
	if (this.player.lastDamageTime + this.player.healthRegenDelay
	    < game.time.totalElapsedSeconds()) {
	    this.player.health += this.player.healthRegen / 60;
	    if (this.player.health > this.player.maxHealth) {
		this.player.health = this.player.maxHealth;
	    }
	}
	this.hurtBorder.alpha = 1 - (this.player.health / this.player.maxHealth);
    }

    getTileIndices(map, property, value=true) {
	let result = [];
	for (const tileset of map.tilesets) {
            if (!(tileset.hasOwnProperty("tileProperties"))) {
                continue;
            }
	    const props = tileset.tileProperties;
	    for (const key of Object.keys(props)) {
		if (props[key].hasOwnProperty(property) && props[key][property] === value) {
		    result.push(parseInt(key, 10) + parseInt(tileset.firstgid, 10));
		}
	    }
	}
	return result;
    }

}
