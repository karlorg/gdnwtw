/* globals __DEV__ */
import Phaser from 'phaser';

import level1jsonMap from '../../assets/level1.json';

const playerWidth = 16;
const playerHeight = 16;
const playerWalkSpeed = 1.5;

export default class extends Phaser.State {
    init () {}
    preload () {}

    create () {
	this.game.stage.backgroundColor = '#787878';

	this.tilemap = this.game.add.tilemap('level1');
	this.tilemap.addTilesetImage('overworld', 'overworld');
	let layer = this.tilemap.createLayer('Ground');
	layer.resizeWorld();
	this.createEntitiesFromJsonMap(level1jsonMap);
	this.walkableIndices = this.getTileIndices(this.tilemap, 'walkable');

	this.camera.follow(this.player.sprite);
    }

    render () {
        if (__DEV__) {
        }
    }

    update () {
	this.controlPlayer();
        this.player.sprite.x = this.player.x;
        this.player.sprite.y = this.player.y;
	// console.log(this.tilemap.getTileWorldXY(this.player.x, this.player.y).index);
    }

    makePlayer ({x, y}) {
	return {
	    x, y,
	    sprite: this.game.add.sprite(
	    	x, y, 'player', 1
	    )
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

	const newTileIndex = this.tilemap.getTileWorldXY(newX, newY).index;
	if (this.walkableIndices.indexOf(newTileIndex) >= 0) {
	    this.player.x = newX;
	    this.player.y = newY;
	} else {
	}

    }

    getTileIndices(map, property, value='true') {
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
