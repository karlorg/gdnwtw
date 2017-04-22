/* globals __DEV__ */
import Phaser from 'phaser';

import level1jsonMap from '../../assets/level1.json';

const TAU = Math.PI * 2;

const playerWidth = 32;
const playerHeight = 32;
const playerWalkSpeed = 1.5;
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

    makeWorld (player) {
	const x = player.x + worldPreferredOrbit;
	const y = player.y;
	return {
	    x, y,
	    angle: 0,
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

	// const powerUps = this.getObjectsFromJsonMap(jsonMap, {type: 'power up'});
	// for (const pu of powerUps) {
	//     this.powerUps.push(this.makePowerUp(pu));
	// }
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
	    okToMove = okToMove && this.isPosnBlocked(newX + x * playerWidth,
						      newY + y * playerHeight);
	}
	if (okToMove) {
	    this.player.x = newX;
	    this.player.y = newY;
	}
    }

    isPosnBlocked(x, y) {
	const groundIndex = this.tilemap.getTileWorldXY(
	    x, y, undefined, undefined, "Ground", true).index;
	const obstaclesIndex = this.tilemap.getTileWorldXY(
	    x, y, undefined, undefined, "Obstacles", true).index;
	return (this.walkableIndices.indexOf(groundIndex) >= 0
	        && this.blockingIndices.indexOf(obstaclesIndex) < 0);
    }

    updateWorld() {
	const sunX = this.world.sun.x;
	const sunY = this.world.sun.y;
	this.world.angle += worldAngularSpeed;
	let newX = sunX + worldPreferredOrbit * Math.cos(this.world.angle);
	let newY = sunY + worldPreferredOrbit * Math.sin(this.world.angle);
	this.world.x = newX;
	this.world.y = newY;
	
	this.world.sprite.x = this.world.x;
	this.world.sprite.y = this.world.y;
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
