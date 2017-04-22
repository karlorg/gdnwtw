/* globals __DEV__ */
import Phaser from 'phaser';

import level1jsonMap from '../../assets/level1.json';

const TAU = Math.PI * 2;

const playerWidth = 32;
const playerHeight = 32;
const playerWalkSpeed = 1.5;

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

	this.world = this.makeWorld(this.player);
    }

    render () {
        if (__DEV__) {
        }
    }

    update () {
	this.controlPlayer();
	this.updateWorld();
	for (const npc of this.npcs) {
	    npc.updateFunc.call(this, npc);
	}
        this.player.sprite.x = this.player.x;
        this.player.sprite.y = this.player.y;
    }

    makePlayer ({x, y}) {
	return {
	    x, y,
	    sprite: this.game.add.sprite(
	    	x, y, 'player', 1
	    )
	};
    }

    makeKid ({x, y}) {
	const sprite = this.game.add.sprite(
 	    x, y, 'kid', 1
	);
	sprite.animations.add('skip right', [0, 1], 2, true);
	sprite.animations.add('skip left', [2, 3], 2, true);
	sprite.animations.add('talk', [10, 11], 2, true);
	sprite.animations.add('fall', [4, 5], 1, false);

	return {
	    x, y,
	    state: "skipping",
	    homeX: x, homeY: y,
	    destX: x, destY: y,
	    speed: 0.7,
	    updateFunc: this.updateKid,
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
	let kbd = this.game.input.keyboard;

	const isLeftPressed = (kbd.isDown(Phaser.KeyCode.A) ||
                               kbd.isDown(Phaser.KeyCode.LEFT));
	const isRightPressed = (kbd.isDown(Phaser.KeyCode.D) ||
				kbd.isDown(Phaser.KeyCode.RIGHT));
	const isUpPressed = (kbd.isDown(Phaser.KeyCode.W) ||
                               kbd.isDown(Phaser.KeyCode.UP));
	const isDownPressed = (kbd.isDown(Phaser.KeyCode.S) ||
				kbd.isDown(Phaser.KeyCode.DOWN));

	let newX = this.player.x;
	let newY = this.player.y;

	if (isLeftPressed) {
	    newX -= playerWalkSpeed;
	}
	if (isRightPressed) {
	    newX += playerWalkSpeed;
	}
	if (isUpPressed) {
	    newY -= playerWalkSpeed;
	}
	if (isDownPressed) {
	    newY += playerWalkSpeed;
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
	    let catchUp = Math.min(0.05 * (newDist - prefDist), 2);
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
	for (const {x, y} of offsets) {
	    okToMove = okToMove
		&& !this.isPosnBlocked(newX + x * worldWidth, newY + y * worldHeight);
	}
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

    updateKid(kid) {
	switch (kid.state) {
	case "skipping":
	    this.kidSkip(kid);
	}
    }

    kidSkip(kid) {
	if (Math.abs(kid.destX - kid.x) < 2 && Math.abs(kid.destY - kid.y) < 2) {
	    kid.destX = kid.homeX + game.rnd.between(-48, 48);
	    kid.destY = kid.homeY + game.rnd.between(-48, 48);
	}
	const angle = Math.atan2(kid.destY - kid.y, kid.destX - kid.x);
	const dx = kid.speed * Math.cos(angle);
	const dy = kid.speed * Math.sin(angle);
	kid.x += dx;
	kid.y += dy;
	if (dx < 0) {
	    kid.sprite.animations.play("skip left");
	} else {
	    kid.sprite.animations.play("skip right");
	}

	kid.sprite.x = kid.x;
	kid.sprite.y = kid.y;

	if (Phaser.Rectangle.intersects(kid.sprite, this.world.sprite)) {
	    this.kidGetBonked(kid);
	}
    }

    kidGetBonked(kid) {
	kid.state = "bonked";
	kid.sprite.animations.play("fall");
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
