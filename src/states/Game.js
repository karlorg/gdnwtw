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
	game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

	game.physics.startSystem(Phaser.Physics.ARCADE);

	this.bangAudio = game.add.audio('bang');
	this.lightOnSound = game.add.audio('light on');
	this.seagullsSound = game.add.audio('seagulls');
	this.idleAudio = {guard: [], chaser: [], shooter: [], kid: []};
        for (const i of [...Array(7).keys()]) {
	    this.idleAudio.guard.push(game.add.audio(`guard idle ${i}`));
        }
        for (const i of [...Array(8).keys()]) {
	    this.idleAudio.chaser.push(game.add.audio(`chaser idle ${i}`));
        }
        for (const i of [...Array(10).keys()]) {
	    this.idleAudio.shooter.push(game.add.audio(`shooter idle ${i}`));
        }
        for (const i of [...Array(7).keys()]) {
	    this.idleAudio.kid.push(game.add.audio(`kid idle ${i}`));
        }
	this.guardAttackAudio = [];
        for (const i of [...Array(3).keys()]) {
	    this.guardAttackAudio.push(game.add.audio(`guard attack ${i}`));
        }
	this.chaserAttackAudio = [];
        for (const i of [...Array(5).keys()]) {
	    this.chaserAttackAudio.push(game.add.audio(`chaser attack ${i}`));
        }
	this.shooterPrepareAudio = [];
        for (const i of [...Array(5).keys()]) {
	    this.shooterPrepareAudio.push(game.add.audio(`shooter prepare ${i}`));
        }
	this.shooterAttackAudio = [];
        for (const i of [...Array(5).keys()]) {
	    this.shooterAttackAudio.push(game.add.audio(`shooter attack ${i}`));
        }
	this.painAudio = {guard: [], chaser: [], shooter: [], kid: []};
        for (const i of [...Array(5).keys()]) {
	    this.painAudio.guard.push(game.add.audio(`guard pain ${i}`));
        }
        for (const i of [...Array(4).keys()]) {
	    this.painAudio.chaser.push(game.add.audio(`chaser pain ${i}`));
        }
        for (const i of [...Array(4).keys()]) {
	    this.painAudio.shooter.push(game.add.audio(`shooter pain ${i}`));
        }
	this.painAudio.kid.push(game.add.audio("kid pain 0"));
	this.playerPainAudio = [];
        for (const i of [...Array(6).keys()]) {
	    this.playerPainAudio.push(game.add.audio(`player pain ${i}`));
        }
	this.playerDeathAudio = game.add.audio("player death 0");

	this.tilemap = this.game.add.tilemap('level1');
	this.tilemap.addTilesetImage('overworld', 'overworld');
	this.groundLayer = this.tilemap.createLayer('Ground');
	this.groundLayer.resizeWorld();
	this.obstacleLayer = this.tilemap.createLayer('Obstacles');
	this.frillsLayer = this.tilemap.createLayer('Frills');

	this.npcs = [];
	this.shots = [];
	this.arenaTriggers = [];
	this.arenaStates = [];
	this.checkpoints = [];
	this.respawns = [];
	this.createEntitiesFromJsonMap(level1jsonMap);
	this.walkableIndices = this.getTileIndices(this.tilemap, 'walkable');
	this.blockingIndices = this.getTileIndices(this.tilemap, 'blocks');
	this.gateClosedIndices = [];
	[this.gateClosedIndices[1]] = this.getTileIndices(this.tilemap, 'gateClosed', 1);
	[this.gateClosedIndices[2]] = this.getTileIndices(this.tilemap, 'gateClosed', 2);
	this.gateOpenIndices = [];
	[this.gateOpenIndices[1]] = this.getTileIndices(this.tilemap, 'gateOpen', 1);
	[this.gateOpenIndices[2]] = this.getTileIndices(this.tilemap, 'gateOpen', 2);
	this.lighthouseOffIndices = [];
	[this.lighthouseOffIndices[1]] = this.getTileIndices(this.tilemap, 'lighthouse off', 1);
	[this.lighthouseOffIndices[2]] = this.getTileIndices(this.tilemap, 'lighthouse off', 2);
	this.lighthouseOnIndices = [];
	[this.lighthouseOnIndices[1]] = this.getTileIndices(this.tilemap, 'lighthouse on', 1);
	[this.lighthouseOnIndices[2]] = this.getTileIndices(this.tilemap, 'lighthouse on', 2);

	this.camera.follow(this.player.sprite);

	this.overSpritesLayer = this.tilemap.createLayer('Over sprites');

	this.world = this.makeWorld(this.player);

	this.hurtBorder = this.game.add.sprite(0, 0, "hurt-border");
	this.hurtBorder.fixedToCamera = true;
	this.hurtBorder.alpha = 0;

	this.titleScreen = this.game.add.sprite(0, 0, "title");
	this.titleScreen.fixedToCamera = true;
	this.titleScreen.alpha = 1;
	this.titleOff = false;

	this.runHintScreen = this.game.add.sprite(0, 0, "run hint");
	this.runHintScreen.fixedToCamera = true;
	this.runHintScreen.alpha = 0;
	this.runHintShown = false;

	this.finScreen = this.game.add.sprite(0, 0, "fin");
	this.finScreen.fixedToCamera = true;
	this.finScreen.alpha = 0;

	this.fullscreenIcon = this.game.add.button(640, 480, "fullscreen", () => {
	    this.toggleFullScreen();
	});
	this.fullscreenIcon.anchor.setTo(1, 1);
	this.fullscreenIcon.fixedToCamera = true;
	this.fullscreenIcon.animations.add("off", [0], 1, false);
	this.fullscreenIcon.animations.add("on", [1], 1, false);
	this.fullscreenIcon.animations.play("off");

	this.muteIcon = this.game.add.button(0, 480, "mute", () => {
	    game.sound.mute = !game.sound.mute;
	});
	this.muteIcon.anchor.setTo(0, 1);
	this.muteIcon.fixedToCamera = true;
	this.muteIcon.animations.add("off", [0], 1, false);
	this.muteIcon.animations.add("on", [1], 1, false);
	this.muteIcon.animations.play("off");
    }

    render () {
        if (__DEV__) {
	    // for (const t of this.arenaTriggers) {
	    //     this.game.debug.geom(new Phaser.Rectangle(t.x, t.y, t.width, t.height),
	    // 			     'rgba(255,0,0,0.5)');
	    // }
        }
    }

    update() {
	this.updateAudioToggle();
	this.checkTitleOffTrigger();
	this.checkRunHintTrigger();
	this.checkEndTrigger();
	this.controlPlayer();
	this.checkArenaTriggers();
	this.checkCheckpoints();
	this.updateWorld();
	// updateBonkees needs to happen before the npcs' native updateFuncs as the latter will
	// move the sprites to match our data
	this.updateBonkees();
	for (const npc of this.npcs) {
	    npc.updateFunc.call(this, npc);
	}
	this.updateShots();
	this.checkShotDamage();
	this.checkContactDamage();
	this.updatePlayerHealth();
        this.player.sprite.x = this.player.x;
        this.player.sprite.y = this.player.y;
    }

    makePlayer ({x, y}) {
	const sprite = this.game.add.sprite(
	    x, y, 'player', 0
	);
	sprite.animations.add('stand down', [0, 20], 0.5, true);
	sprite.animations.add('walk down', [3, 4, 5, 6], 2, true);
	sprite.animations.add('run down', [3, 4, 5, 6], 4, true);
	sprite.animations.add('walk up', [23, 24, 25, 26], 2, true);
	sprite.animations.add('run up', [23, 24, 25, 26], 4, true);
	sprite.animations.add('knock up', [1]);
	sprite.animations.add('knock down', [21]);
	sprite.animations.add('dead up', [42]);
	sprite.animations.add('dead down', [41]);
	sprite.animations.play('run down');

	return {
	    x, y,
	    state: "normal",
	    currentRespawn: null,
	    maxHealth: 100,
	    health: 100,
	    healthRegenDelay: 3,  // seconds
	    healthRegen: 25,  // per second
	    invincibleDuration: 2,  // seconds
	    timeInvincibleStarted: 0,
	    lastDamageTime: 0,
	    diedTime: 0,
	    knockbackDirection: "none",
	    knockbackSpeed: 3,
	    knockbackDuration: 0.5,
	    sprite
 	};
    }

    resetPlayer({x, y}) {
	this.player.x = x;
	this.player.y = y;
	this.world.x = this.player.x + worldPreferredOrbit;
	this.world.y = this.player.y;
	this.player.health = this.player.maxHealth;
	this.player.state = "normal";
	this.player.timeInvincibleStarted = game.time.totalElapsedSeconds();
    }

    makeKid ({x, y}) {
	const sprite = this.game.add.sprite(
 	    x, y, 'kid', 1
	);
	sprite.animations.add('walk right', [0, 1], 2, true);
	sprite.animations.add('walk left', [2, 3], 2, true);
	sprite.animations.add('talk', [10, 11], 2, true);
	sprite.animations.add('fall right', [4, 5], 1, false);
	sprite.animations.add('fall left', [6, 7], 1, false);

	return {
	    type: 'kid',
	    x, y,
	    width: 32, height: 32,
	    collisionOffsets: [{x: 0.3, y: 0.4},
			       {x: 0.7, y: 0.4},
			       {x: 0.3, y: 0.9},
			       {x: 0.7, y: 0.9}],
	    lastPlayedIdleAudio: 0,
	    idleAudioMinDelay: 1,
	    idleAudioMaxDelay: 2.5,
	    idleAudioVolume: 0.1,
	    currentIdleAudioDelay: 1,
	    currentIdleSound: null,
	    state: "idle",
	    homeX: x, homeY: y,
	    destX: x, destY: y,
	    speed: 0.7,
	    updateFunc: this.updateKid,
	    sprite
 	};
    }

    makeGuard ({x, y, name, properties}) {
	const sprite = this.game.add.sprite(
 	    x, y, 'guard', 1
	);
	sprite.animations.add('walk left', [0, 1], 2, true);
	sprite.animations.add('walk right', [10, 11], 2, true);
	sprite.animations.add('run left', [0, 1], 4, true);
	sprite.animations.add('run right', [10, 11], 4, true);
	sprite.animations.add('fall left', [20, 21], 2, false);
	sprite.animations.add('fall right', [30, 31], 1, false);

	let unlocksArenaNo = undefined;
	if (properties !== undefined) {
	    unlocksArenaNo = properties.unlocksArenaNo;
	    if (unlocksArenaNo !== undefined && unlocksArenaNo !== null) {
	        this.unlocksArenaNo = unlocksArenaNo;
	        this.addArenaUnlocker(unlocksArenaNo);
	    }
	}

	return {
	    type: "guard",
	    x, y,
	    width: 32, height: 32,
	    state: "idle",
	    collisionOffsets: [{x: 0.1, y: 0.1},
			       {x: 0.9, y: 0.1},
			       {x: 0.1, y: 0.9},
			       {x: 0.9, y: 0.9}],
	    homeX: x, homeY: y,
	    destX: x, destY: y,
	    lastPlayedIdleAudio: 0,
	    idleAudioMinDelay: 1,
	    idleAudioMaxDelay: 3,
	    currentIdleAudioDelay: 1,
	    lastPlayedAttackSound: 0,
	    currentAttackSound: null,
	    speed: 0.7,
	    runSpeed: playerWalkSpeed * 1.7,
	    aggroRange: worldPreferredOrbit * 1.7,
	    contactDamage: 15,
	    tauntStartTime: 0,
	    tauntDuration: 1,
	    unlocksArenaNo,
	    updateFunc: this.updateGuard,
	    sprite
 	};
    }

    makeChaser ({x, y, properties}) {
	const sprite = this.game.add.sprite(
 	    x, y, 'chaser', 1
	);
	sprite.animations.add('walk left', [0], 2, true);
	sprite.animations.add('walk right', [10], 2, true);
	sprite.animations.add('chase', [50, 51, 52, 51], 3, true);
	sprite.animations.add('fall left', [20, 21], 2, false);
	sprite.animations.add('fall right', [30, 31], 1, false);
	sprite.animations.add('idle', [40, 41], 1.5, true);
	sprite.animations.play('idle');

	let unlocksArenaNo = undefined;
	if (properties !== undefined) {
	    unlocksArenaNo = properties.unlocksArenaNo;
	    if (unlocksArenaNo !== undefined && unlocksArenaNo !== null) {
	        this.unlocksArenaNo = unlocksArenaNo;
	        this.addArenaUnlocker(unlocksArenaNo);
	    }
	}

	return {
	    type: 'chaser',
	    x, y,
	    width: 32, height: 32,
	    state: "idle",
	    collisionOffsets: [{x: 0.1, y: 0.1},
			       {x: 0.9, y: 0.1},
			       {x: 0.1, y: 0.9},
			       {x: 0.9, y: 0.9}],
	    lastPlayedIdleAudio: 0,
	    idleAudioMinDelay: 0.75,
	    idleAudioMaxDelay: 1.75,
	    currentIdleAudioDelay: 1,
	    lastPlayedAttackSound: 0,
	    attackAudioMinDelay: 0.4,
	    attackAudioMaxDelay: 1,
	    currentAttackAudioDelay: 1,
	    currentAttackSound: null,
	    speed: playerWalkSpeed * 1.7,
	    runSpeed: playerWalkSpeed * 1.7,
	    aggroRange: playerWidth * 7.5,
	    contactDamage: 15,
	    tauntStartTime: 0,
	    tauntDuration: 1,
	    unlocksArenaNo,
	    updateFunc: this.updateChaser,
	    sprite
 	};
    }

    makeShooter ({x, y, properties}) {
	const sprite = this.game.add.sprite(
 	    x, y, 'shooter', 1
	);
	sprite.animations.add('idle', [0, 1], 2, true);
	sprite.animations.add('prepare shot', [10], 1, false);
	sprite.animations.add('shoot', [11], 1, false);
	sprite.animations.add('fall right', [20, 21], 1, false);
	sprite.animations.add('fall left', [20, 21], 1, false);
	sprite.animations.play('idle')

	let unlocksArenaNo = undefined;
	if (properties !== undefined) {
	    unlocksArenaNo = properties.unlocksArenaNo;
	    if (unlocksArenaNo !== undefined && unlocksArenaNo !== null) {
	        this.unlocksArenaNo = unlocksArenaNo;
	        this.addArenaUnlocker(unlocksArenaNo);
	    }
	}

	return {
	    type: 'shooter',
	    x, y,
	    width: 32, height: 32,
	    state: "idle",
	    collisionOffsets: [{x: 0.1, y: 0.1},
			       {x: 0.9, y: 0.1},
			       {x: 0.1, y: 0.9},
			       {x: 0.9, y: 0.9}],

	    lastPlayedIdleAudio: 0,
	    idleAudioMinDelay: 0.2,
	    idleAudioMaxDelay: 0.5,
	    idleAudioVolume: 0.3,
	    currentIdleAudioDelay: 1,
	    lastPlayedAttackSound: 0,

	    homeX: x, homeY: y,
	    destX: x, destY: y,
	    speed: playerWalkSpeed,
	    aggroRange: worldPreferredOrbit * 2.5,
	    shotRange: worldPreferredOrbit * 3.5,
	    timeStartedPreparingShot: 0,
	    shotPrepareTime: 0.7,
	    timeStartedRecovery: 0,
	    shotRecoverTime: 0.7,
	    shotCooldownTime: 2,
	    shotSpeed: playerRunSpeed * 0.8,
	    shotDamage: 21,
	    contactDamage: 10,
	    tauntStartTime: 0,
	    tauntDuration: 1,
	    unlocksArenaNo,
	    updateFunc: this.updateShooter,
	    sprite
 	};
    }

    updateShooter(npc) {
	switch (npc.state) {
	case "idle":
	    this.processIdleSounds(npc, "shooter");
	    this.walkAround(npc);
	    this.checkShooterAggro(npc);
	    this.checkBonk(npc);
	    break;
	case "preparing shot":
	    this.updatePreparingShot(npc);
	    this.checkBonk(npc);
	    break;
	case "recovering":
	    this.updateRecovery(npc);
	    this.checkBonk(npc);
	    break;
	case "taunting":
	    this.updateTaunting(npc);
	    this.checkBonk(npc);
	    break;
	}
	npc.sprite.x = npc.x;
	npc.sprite.y = npc.y;
    }

    makeArenaTrigger({x, y, height, width, properties: {locksArenaNo}}) {
	return {
	    x, y, width, height, locksArenaNo
	};
    }

    makeArenaState() {
	return {
	    state: "not triggered",
	    unlockersRemaining: 0
	};
    }

    addArenaUnlocker(no) {
	if (this.arenaStates[no] === undefined) {
	    this.arenaStates[no] = this.makeArenaState();
	}
	this.arenaStates[no].unlockersRemaining += 1;
    }

    countUnlocker(no) {
	this.arenaStates[no].unlockersRemaining -= 1;
	if (this.arenaStates[no].unlockersRemaining <= 0) {
	    this.arenaStates[no].state = "finished";
	    this.openAllGates();
	}
    }

    makeCheckpoint({x, y, width, height, properties: {respawnNo}}) {
	return {
	    x, y, width, height, respawnNo
	};
    }

    makeRespawn({x, y, properties: {respawnNo}}) {
	return {
	    x, y, respawnNo
	};
    }

    makeWorld (player) {
	const x = player.x + worldPreferredOrbit;
	const y = player.y;
	const emitter = game.add.emitter(x, y, 20);
	emitter.makeParticles('cloud', [0, 1, 2]);
	emitter.setAlpha(1, 0, 1000);
	emitter.setScale(1, 0, 1, 0, 1000);
	emitter.setRotation(0, TAU);
	// emitter.start(false, 1000, 5);
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
	    emitter,
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

	const chasers = this.getObjectsFromJsonMap(jsonMap, {type: 'chaser'});
	for (const chaser of chasers) {
	    this.npcs.push(this.makeChaser(chaser));
	}

	const shooters = this.getObjectsFromJsonMap(jsonMap, {type: 'shooter'});
	for (const shooter of shooters) {
	    this.npcs.push(this.makeShooter(shooter));
	}

	const triggers = this.getObjectsFromJsonMap(jsonMap, {type: 'arena trigger'});
	for (const trigger of triggers) {
	    this.arenaTriggers.push(this.makeArenaTrigger(trigger));
	}

	const checkpoints = this.getObjectsFromJsonMap(jsonMap, {type: 'checkpoint'});
	for (const cp of checkpoints) {
	    this.checkpoints.push(this.makeCheckpoint(cp));
	}

	this.titleOffTrigger = this.getObjectsFromJsonMap(jsonMap, {type: 'title off trigger'})[0];
	this.runHintTrigger = this.getObjectsFromJsonMap(
	    jsonMap, {type: 'run hint trigger'})[0];
	this.endTrigger = this.getObjectsFromJsonMap(jsonMap, {type: 'end trigger'})[0];
	this.lighthouse = this.getObjectsFromJsonMap(jsonMap, {type: 'lighthouse'})[0];
	this.lighthouseLight = this.getObjectsFromJsonMap(jsonMap, {type: 'light'})[0];

	const respawns = this.getObjectsFromJsonMap(jsonMap, {type: 'respawn'});
	for (const respawn of respawns) {
	    this.respawns[respawn.properties.respawnNo] = this.makeRespawn(respawn);
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
	let dx = 0;
	let dy = 0;

	if (this.player.state === "ending") {
	    this.walkPlayerTowardLighthouse();
	    return;
	}

	if (this.player.state === "dead" || this.player.state == "done") {
	    return;
	}

	if (this.player.state === "knocked back" || this.player.state === "dying") {
	    if (this.player.lastDamageTime + this.player.knockbackDuration
	        < game.time.totalElapsedSeconds()) {
		if (this.player.state === "knocked back") {
	            this.player.state = "normal";
		    this.player.timeInvincibleStarted = game.time.totalElapsedSeconds();
		    this.player.sprite.animations.play('stand down');
	            return;
		} else { // dying
		    this.player.state = "dead";
		    switch (this.player.knockbackDirection) {
		    case "up":
			this.player.sprite.animations.play("dead up");
			break;
		    case "down":
			this.player.sprite.animations.play("dead down");
			break;
		    }
		    const timer = game.time.create(true);
		    timer.add(4000, this.respawnPlayer, this);
		    timer.start();
		    return;
		}
	    }
	    dx = this.player.knockbackSpeed * Math.cos(this.player.knockbackAngle);
	    dy = this.player.knockbackSpeed * Math.sin(this.player.knockbackAngle);
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
		dx -= speed;
	    }
	    if (isRightPressed) {
		dx += speed;
	    }
	    if (isUpPressed) {
		dy -= speed;
	    }
	    if (isDownPressed) {
		dy += speed;
	    }
	    const totalSpeed = Math.sqrt(dx * dx + dy * dy);
	    if (totalSpeed > 0) {
	        dx *= speed / totalSpeed;
	        dy *= speed / totalSpeed;
	    }

	    const finalSpeed = Math.sqrt(dx * dx + dy * dy);
	    if (finalSpeed > playerWalkSpeed + 0.01) {
		if (dy > 0) {
	            this.player.sprite.animations.play('run down');
		} else {
	            this.player.sprite.animations.play('run up');
		}
	    } else if (finalSpeed > 0.01) {
		if (dy > 0) {
	            this.player.sprite.animations.play('walk down');
		} else {
	            this.player.sprite.animations.play('walk up');
		}
	    } else {
	        this.player.sprite.animations.play('stand down');
	    }
	}

	const offsets = [{x: 0.3, y: 0.35},
			 {x: 0.7, y: 0.35},
			 {x: 0.3, y: 0.9},
			 {x: 0.7, y: 0.9}];
	({dx, dy} =
	    this.adjustPathForObstacles(this.player.x, this.player.y, dx, dy,
					playerWidth, playerHeight, offsets));
	this.player.x += dx;
	this.player.y += dy;
    }

    respawnPlayer() {
	if (this.player.currentRespawn === null) {
	    const player = this.getObjectsFromJsonMap(level1jsonMap, {type: 'player'})[0];
	    this.resetPlayer({x: player.x, y: player.y});
	    return;
	}
	const respawn = this.respawns[this.player.currentRespawn];
	this.resetPlayer(respawn);
    }

    isPosnWalkable(x, y) {
	const tile = this.tilemap.getTileWorldXY(x, y, undefined, undefined, "Ground", true);
	// have to check Frills layer too as bridge transition tiles live there
	const fTile = this.tilemap.getTileWorldXY(x, y, undefined, undefined, "Frills", true);
	if (tile === null) { return false };
	if (fTile === null) { return false };
	const groundIndex = tile.index;
	const frillsIndex = fTile.index;
	return (this.walkableIndices.indexOf(groundIndex) >= 0
		|| this.walkableIndices.indexOf(frillsIndex) >= 0);
    }

    isPosnBlocked(x, y) {
	const tile = this.tilemap.getTileWorldXY(x, y, undefined, undefined, "Obstacles", true);
	if (tile === null) { return true };
	const obstaclesIndex = tile.index;
	return this.blockingIndices.indexOf(obstaclesIndex) >= 0;
    }

    checkArenaTriggers() {
	for (const trigger of this.arenaTriggers) {
	    const tRect = new Phaser.Rectangle(
		trigger.x, trigger.y, trigger.width, trigger.height);
	    if (Phaser.Rectangle.intersects(this.player.sprite, tRect)) {
		const arenaNo = trigger.locksArenaNo;
		const arena = this.arenaStates[arenaNo];
		if (arena.state === "not triggered") {
		    arena.state = "locked";
		    this.closeAllGates();
		}
	    }
	}
    }

    closeAllGates() {
	this.tilemap.forEach((tile) => {
	    const openIndex = this.gateOpenIndices.indexOf(tile.index);
	    if (openIndex >= 0) {
		const closed = this.gateClosedIndices[openIndex];
		this.tilemap.putTile(closed, tile.x, tile.y, "Obstacles");
	    }
	}, this, 0, 0, this.tilemap.width, this.tilemap.height, "Obstacles");
    }

    openAllGates() {
	this.tilemap.forEach((tile) => {
	    const closedIndex = this.gateClosedIndices.indexOf(tile.index);
	    if (closedIndex >= 0) {
		const open = this.gateOpenIndices[closedIndex];
		this.tilemap.putTile(open, tile.x, tile.y, "Obstacles");
	    }
	}, this, 0, 0, this.tilemap.width, this.tilemap.height, "Obstacles");
    }

    checkCheckpoints() {
	for (const cp of this.checkpoints) {
	    const cpRect = new Phaser.Rectangle(cp.x, cp.y, cp.width, cp.height);
	    if (Phaser.Rectangle.intersects(this.player.sprite, cpRect)) {
		this.player.currentRespawn = cp.respawnNo;
	    }
	}
    }

    checkTitleOffTrigger() {
	if (this.titleOff) {
	    return;
	}
	const t = this.titleOffTrigger;
	const rect = new Phaser.Rectangle(t.x, t.y, t.width, t.height);
	if (Phaser.Rectangle.intersects(this.player.sprite, rect)) {
	    game.add.tween(this.titleScreen).to(
		{ alpha: 0 }, 4000, Phaser.Easing.Linear.None, true);
	    this.titleOff = true;
	}
    }

    checkRunHintTrigger() {
	if (this.runHintShown) {
	    return;
	}
	const t = this.runHintTrigger;
	const rect = new Phaser.Rectangle(t.x, t.y, t.width, t.height);
	if (Phaser.Rectangle.intersects(this.player.sprite, rect)) {
	    game.add.tween(this.runHintScreen).to(
		{ alpha: 1 }, 2000, Phaser.Easing.Linear.None, true);
	    game.add.tween(this.runHintScreen).to(
		{ alpha: 0 }, 4000, Phaser.Easing.Linear.None, true, 4000);
	    this.runHintShown = true;
	}
    }

    checkEndTrigger() {
	if (this.player.state !== "ending") {
	    const t = this.endTrigger;
	    const rect = new Phaser.Rectangle(t.x, t.y, t.width, t.height);
	    if (Phaser.Rectangle.intersects(this.player.sprite, rect)) {
		this.player.state = "ending";
	    }
	}
    }

    walkPlayerTowardLighthouse() {
	const dx = this.lighthouse.x - this.player.x;
	const dy = this.lighthouse.y - this.player.y;
	const distSqr = dx * dx + dy * dy;
	if (distSqr < 4) {
	    this.player.state = "done";
	    this.triggerLighthouse();
	    return;
	}
	this.player.sprite.animations.play("walk down");
	const angle = Math.atan2(this.lighthouse.y - this.player.y,
				 this.lighthouse.x - this.player.x);
	this.player.x += playerWalkSpeed * Math.cos(angle);
	this.player.y += playerWalkSpeed * Math.sin(angle);
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
	this.world.vx = newX - this.world.x;
	this.world.vy = newY - this.world.y;
	this.world.x = newX;
	this.world.y = newY;
	
	this.world.sprite.x = this.world.x;
	this.world.sprite.y = this.world.y;
	this.world.emitter.minParticleSpeed.set(-this.world.vx, -this.world.vy);
	this.world.emitter.maxParticleSpeed.set(-this.world.vx, -this.world.vy);
	this.world.emitter.x = this.world.x + 8;
	this.world.emitter.y = this.world.y + 8;
    }

    updateBonkees() {
	for (const npc of this.npcs) {
	    if (npc.state === "bonked") {
		if (npc.bonkedTime + 1 < game.time.totalElapsedSeconds()) {
		    npc.state = "dead";
		    continue;
		}

		let dx = 3 * Math.cos(npc.bonkAngle);
		let dy = 3 * Math.sin(npc.bonkAngle);
		({dx, dy} = this.adjustPathForObstacles(npc.x, npc.y, dx, dy,
							npc.width, npc.height,
							npc.collisionOffsets));
		npc.x += dx;
		npc.y += dy;
	    }
	}
    }

    updateShots() {
	let toRemove = [];
	for (const [i, shot] of this.shots.entries()) {
	    shot.x += shot.vx;
	    shot.y += shot.vy;
	    const dist = Math.sqrt(shot.vx * shot.vx + shot.vy * shot.vy);
	    shot.distanceLeft -= dist;
	    if (shot.distanceLeft <= 0) {
		toRemove.push(i);
	    }
	    shot.sprite.x = shot.x;
	    shot.sprite.y = shot.y;
	}
	for (let j = toRemove.length - 1; j >= 0; j--) {
	    const shot = this.shots[toRemove[j]];
	    shot.sprite.destroy();
	    this.shots.splice(toRemove[j], 1);
	}
    }

    checkContactDamage() {
	if (!this.playerCanTakeDamage()) {
	    return;
	}
	for (const npc of this.npcs) {
	    if (npc.state === "bonked" || npc.state === "dead"
		|| !npc.hasOwnProperty("contactDamage")) {
		continue;
	    }
	    if (Phaser.Rectangle.intersects(npc.sprite, this.player.sprite)) {
		const angle = this.player.knockbackAngle =
		    Math.atan2(this.player.y - npc.y, this.player.x - npc.x);
		this.knockbackPlayer(angle);
		this.damagePlayer(npc.contactDamage);
		if (npc.hasOwnProperty("tauntDuration")) {
		    npc.tauntStartTime = game.time.totalElapsedSeconds();
		    npc.state = "taunting";
		}
	    }
	}
    }

    knockbackPlayer(angle) {
	if (angle > 0 && angle < TAU / 2) {
	    this.player.sprite.animations.play('knock down');
	    this.player.knockbackDirection = "down";
	} else {
	    this.player.sprite.animations.play('knock up');
	    this.player.knockbackDirection = "up";
	}
	this.player.state = "knocked back";
    }

    checkShotDamage() {
	if (!this.playerCanTakeDamage()) {
	    return;
	}
	let toRemove = [];
	for (const [i, shot] of this.shots.entries()) {
	    if (Phaser.Rectangle.intersects(shot.sprite, this.player.sprite)) {
		const angle = this.player.knockbackAngle = Math.atan2(shot.vy, shot.vx);
		this.knockbackPlayer(angle);
		this.damagePlayer(shot.damage);
		toRemove.push(i);
	    }
	}
	for (let j = toRemove.length - 1; j >= 0; j--) {
	    const shot = this.shots[toRemove[j]];
	    shot.sprite.destroy();
	    this.shots.splice(toRemove[j], 1);
	}
    }

    damagePlayer(damage) {
	this.player.lastDamageTime = game.time.totalElapsedSeconds();
	this.player.health -= damage;
	if (this.player.health < 0) {
	    this.player.health = 0;
	    this.player.state = "dying";
	    this.player.diedTime = game.time.totalElapsedSeconds();
	    this.playerDeathAudio.play();
	} else {
	    const sound = game.rnd.pick(this.playerPainAudio);
	    sound.play();
	}
    }

    updateKid(kid) {
	switch (kid.state) {
	case "idle":
	    this.walkAround(kid);
	    this.processIdleSounds(kid, "kid");
	    this.checkBonk(kid);
	}
	kid.sprite.x = kid.x;
	kid.sprite.y = kid.y;
    }

    updateGuard(guard) {
	switch (guard.state) {
	case "idle":
	    this.walkAround(guard);
	    this.processIdleSounds(guard, "guard");
	    this.checkAggro(guard);
	    this.checkBonk(guard);
	    break;
	case "aggro":
	    this.updateAggro(guard);
	    this.checkBonk(guard);
	    break;
	case "taunting":
	    this.updateTaunting(guard);
	    this.checkBonk(guard);
	    break;
	}
	guard.sprite.x = guard.x;
	guard.sprite.y = guard.y;
    }

    updateChaser(npc) {
	switch (npc.state) {
	case "idle":
	    this.processIdleSounds(npc, "chaser");
	    this.checkChaserAggro(npc);
	    this.checkBonk(npc);
	    break;
	case "aggro":
	    this.updateChaserAggro(npc);
	    this.checkBonk(npc);
	    break;
	case "taunting":
	    this.updateTaunting(npc);
	    this.checkBonk(npc);
	    break;
	}
	npc.sprite.x = npc.x;
	npc.sprite.y = npc.y;
    }

    checkAggro(guard) {
	const dist = Math.sqrt(
	    (guard.homeX - this.player.x) * (guard.homeX - this.player.x) +
		(guard.homeY - this.player.y) * (guard.homeY - this.player.y)
	);
	if (dist < guard.aggroRange) {
	    const sound = game.rnd.pick(this.guardAttackAudio);
	    sound.play();
	    guard.lastPlayedAttackSound = game.time.totalElapsedSeconds();
	    guard.currentAttackSound = sound;
	    guard.state = "aggro";
	}
    }

    checkChaserAggro(npc) {
	const dist = Math.sqrt(
	    (npc.x - this.player.x) * (npc.x - this.player.x) +
		(npc.y - this.player.y) * (npc.y - this.player.y)
	);
	if (dist < npc.aggroRange) {
	    npc.sprite.animations.play("chase");
	    const sound = game.rnd.pick(this.chaserAttackAudio);
	    sound.play();
	    npc.currentAttackAudioDelay = game.rnd.realInRange(npc.attackAudioMinDelay,
							       npc.attackAudioMaxDelay);
	    npc.lastPlayedAttackSound = game.time.totalElapsedSeconds();
	    npc.currentAttackSound = sound;
	    npc.state = "aggro";
	}
    }

    checkShooterAggro(npc) {
	if (npc.timeStartedRecovery + npc.shotCooldownTime > game.time.totalElapsedSeconds()) {
	    return;
	}
	const dist = Math.sqrt(
	    (npc.x - this.player.x) * (npc.x - this.player.x) +
		(npc.y - this.player.y) * (npc.y - this.player.y)
	);
	if (dist < npc.aggroRange) {
	    npc.sprite.animations.play("prepare shot");
	    const sound = game.rnd.pick(this.shooterPrepareAudio);
	    sound.play();
	    npc.lastPlayedAttackSound = game.time.totalElapsedSeconds();
	    npc.currentAttackSound = sound;
	    npc.timeStartedPreparingShot = game.time.totalElapsedSeconds();
	    npc.state = "preparing shot";
	}
    }

    updateAggro(guard) {
	const dist = Math.sqrt(
	    (guard.homeX - this.player.x) * (guard.homeX - this.player.x) +
		(guard.homeY - this.player.y) * (guard.homeY - this.player.y)
	);
	if (dist > guard.aggroRange * 1.3) {
	    guard.state = "idle";
	    return;
	}
	
	const angle = Math.atan2(this.player.y - guard.y, this.player.x - guard.x);
	let dx = guard.runSpeed * Math.cos(angle);
	let dy = guard.runSpeed * Math.sin(angle);
	({dx, dy} = this.adjustPathForObstacles(guard.x, guard.y, dx, dy,
						guard.width, guard.height, guard.collisionOffsets));
	guard.x += dx;
	guard.y += dy;
    }

    updateChaserAggro(npc) {
	const dist = Math.sqrt(
	    (npc.x - this.player.x) * (npc.x - this.player.x) +
		(npc.y - this.player.y) * (npc.y - this.player.y)
	);
	if (dist > npc.aggroRange) {
	    npc.state = "idle";
	    return;
	}

	if (npc.lastPlayedAttackSound + npc.currentAttackAudioDelay
	    < game.time.totalElapsedSeconds()) {
	    npc.currentAttackSound.stop();
	    const sound = game.rnd.pick(this.chaserAttackAudio);
	    sound.play();
	    npc.lastPlayedAttackSound = game.time.totalElapsedSeconds();
	    npc.currentAttackSound = sound;
	    npc.currentAttackAudioDelay = game.rnd.realInRange(npc.attackAudioMinDelay,
							       npc.attackAudioMaxDelay);
	}
	
	const angle = Math.atan2(this.player.y - npc.y, this.player.x - npc.x);
	let dx = npc.runSpeed * Math.cos(angle);
	let dy = npc.runSpeed * Math.sin(angle);
	({dx, dy} = this.adjustPathForObstacles(npc.x, npc.y, dx, dy,
						npc.width, npc.height, npc.collisionOffsets));
	npc.x += dx;
	npc.y += dy;
    }

    updateTaunting(npc) {
	if (npc.tauntStartTime + npc.tauntDuration < game.time.totalElapsedSeconds()) {
	    npc.state = "idle";
	}
    }

    updatePreparingShot(npc) {
	if (npc.timeStartedPreparingShot + npc.shotPrepareTime < game.time.totalElapsedSeconds()) {
	    this.shootAt(npc, this.player);
	    npc.sprite.animations.play("shoot");
	    const sound = game.rnd.pick(this.shooterAttackAudio);
	    sound.play();
	    npc.lastPlayedAttackSound = game.time.totalElapsedSeconds();
	    npc.currentAttackSound = sound;
	    npc.timeStartedRecovery = game.time.totalElapsedSeconds();
	    npc.state = "recovering";
	}
    }

    updateRecovery(npc) {
	if (npc.timeStartedRecovery + npc.shotRecoverTime < game.time.totalElapsedSeconds()) {
	    npc.sprite.animations.play("idle");
	    npc.state = "idle";
	}
    }

    shootAt(source, target) {
	const shot = {
	    x: source.x, y: source.y,
	    speed: source.shotSpeed,
	    damage: source.shotDamage,
	    distanceLeft: source.shotRange
	};
	const angle = Math.atan2(target.y - source.y, target.x - source.x);
	shot.vx = shot.speed * Math.cos(angle);
	shot.vy = shot.speed * Math.sin(angle);
	shot.sprite = game.add.sprite(shot.x, shot.y, 'shot');
	shot.sprite.animations.add('idle', [0, 1], 3, true);
	shot.sprite.animations.play('idle');
	this.shots.push(shot);
    }

    checkBonk(npc) {
	if (Phaser.Rectangle.intersects(npc.sprite, this.world.sprite)) {
	    this.bangAudio.play();
	    if (npc.hasOwnProperty("lastPlayedAttackSound")
		&& npc.currentAttackSound) {
		npc.currentAttackSound.stop();
	    }
	    if (npc.hasOwnProperty("currentIdleSound")
		&& npc.currentIdleSound) {
		npc.currentIdleSound.stop();
	    }
	    if (this.painAudio.hasOwnProperty(npc.type)) {
		const painSound = game.rnd.pick(this.painAudio[npc.type]);
		painSound.play();
	    }
	    this.getBonked(npc);
	}
    }

    getBonked(npc) {
	npc.state = "bonked";
	const dir = this.world.vx < 0 ? "left" : "right";
	npc.sprite.animations.play(`fall ${dir}`);
	const bonkAngle = Math.atan2(this.world.vy, this.world.vx);
	console.log(bonkAngle);
	npc.bonkAngle = bonkAngle;
	npc.bonkedTime = game.time.totalElapsedSeconds();
	if (npc.hasOwnProperty("unlocksArenaNo") && npc.unlocksArenaNo !== undefined) {
	    this.countUnlocker(npc.unlocksArenaNo);
	}
    }

    walkAround(npc) {
	if (Math.abs(npc.destX - npc.x) < 2 && Math.abs(npc.destY - npc.y) < 2) {
	    for (const n in [...Array(10).keys()]) {
	        npc.destX = npc.homeX + game.rnd.between(-48, 48);
	        npc.destY = npc.homeY + game.rnd.between(-48, 48);
		if (this.isDestWalkableAndNotBlocked(npc.destX, npc.destY,
					             npc.width, npc.height, npc.collisionOffsets)) {
		    break;
		}
		if (n === 9) {
		    // couldn't find a place to wander to
		    return;
		}
	    }
	}
	const angle = Math.atan2(npc.destY - npc.y, npc.destX - npc.x);
	let dx = npc.speed * Math.cos(angle);
	let dy = npc.speed * Math.sin(angle);
	({dx, dy} = this.adjustPathForObstacles(npc.x, npc.y, dx, dy, npc.width, npc.height,
						npc.collisionOffsets));
	npc.x += dx;
	npc.y += dy;
	const speed = Math.sqrt(dx * dx + dy * dy);
	const gait = speed > npc.speed + 0.01 ? "run" : "walk";
	const dir = dx < 0 ? "left" : "right";
	npc.sprite.animations.play(`${gait} ${dir}`);
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

    isDestWalkableAndNotBlocked(x, y, w, h,
				offsets=[{x: 0, y: 0},
					 {x: 0, y: 1},
					 {x: 1, y: 0},
					 {x: 1, y: 1}]) {
	let okToMove = true;
	for (const {x: xoff, y: yoff} of offsets) {
	    okToMove = okToMove
		&& this.isPosnWalkable(x + xoff * w, y + yoff * h)
		&& !this.isPosnBlocked(x + xoff * w, y + yoff * h);
	}
	return okToMove;
    }

    adjustPathForObstacles(x, y, dx, dy, w, h, offsets) {
	const dist = Math.sqrt(dx * dx + dy * dy);
	const dxSign = dx < 0 ? -1 : 1;
	const dySign = dy < 0 ? -1 : 1;
	const xOnly = Math.abs(dx) > 0.01 ? {dx: dist * dxSign, dy: 0} : {dx: 0, dy: 0};
	const yOnly = Math.abs(dy) > 0.01 ? {dx: 0, dy: dist * dySign} : {dx: 0, dy: 0};
	const toTry = Math.abs(dx) > Math.abs(dy)
	      ? [{dx, dy}, xOnly, yOnly]
	      : [{dx, dy}, yOnly, xOnly];
	for ({dx, dy} of toTry) {
	    if (this.isDestWalkableAndNotBlocked(x + dx, y + dy, w, h, offsets)) {
	        return {dx: dx, dy: dy};
	    }
	}
	return {dx: 0, dy: 0};
    }

    playerCanTakeDamage() {
	return !(this.player.state === "knocked back" || this.player.state === "dying"
		 || this.player.state === "dead"
		 || (this.player.timeInvincibleStarted + this.player.invincibleDuration
		     > game.time.totalElapsedSeconds())
	        );
    }


    toggleFullScreen() {
	if (game.scale.isFullScreen) {
	    game.scale.stopFullScreen();
	    this.fullscreenIcon.animations.play("off");
	} else {
	    game.scale.startFullScreen(false);
	    this.fullscreenIcon.animations.play("on");
	}
    }

    processIdleSounds(npc, type) {
	if (npc.lastPlayedIdleAudio + npc.currentIdleAudioDelay
	    > game.time.totalElapsedSeconds()) {
	    return;
	}
	const dx = npc.x - this.player.x;
	const dy = npc.y - this.player.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist > worldPreferredOrbit * 4) {
	    return;
	}
	const sound = game.rnd.pick(this.idleAudio[type]);
	let volume = 1 - ((dist - worldPreferredOrbit) / (worldPreferredOrbit * 2.5));
	if (npc.hasOwnProperty("idleAudioVolume")) {
	    volume *= npc.idleAudioVolume;
	}
	sound.play('', 0, volume);
	npc.currentIdleSound = sound;
	npc.lastPlayedIdleAudio = game.time.totalElapsedSeconds();
	npc.currentIdleAudioDelay = game.rnd.realInRange(npc.idleAudioMinDelay, npc.idleAudioMaxDelay);
    }
    
    updateAudioToggle() {
	if (this.game.sound.mute) {
	    this.muteIcon.animations.play("off");
	} else {
	    this.muteIcon.animations.play("on");
	}
    }

    triggerLighthouse() {
	const timer = game.time.create(true);
	timer.add(4000, () => {
	    this.world.sun = this.lighthouseLight;
	    this.lightOnSound.play();
	    this.tilemap.forEach((tile) => {
		const offIndex = this.lighthouseOffIndices.indexOf(tile.index);
		if (offIndex >= 0) {
		    const on = this.lighthouseOnIndices[offIndex];
		    this.tilemap.putTile(on, tile.x, tile.y, "Over sprites");
		}
	    }, this, 0, 0, this.tilemap.width, this.tilemap.height, "Over sprites");
	    game.add.tween(this.finScreen).to(
		{ alpha: 1 }, 2000, Phaser.Easing.Linear.None, true, 3000);
	    const timer = game.time.create(true);
	    timer.add(3000, () => {
		this.seagullsSound.fadeIn(6000, true);
	    }, this);
	    timer.start();
	}, this);
	timer.start();
    }

}
