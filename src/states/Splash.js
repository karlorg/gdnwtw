import Phaser from 'phaser'
import { centerGameObjects } from '../utils'

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg')
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar')
    centerGameObjects([this.loaderBg, this.loaderBar])

    this.load.setPreloadSprite(this.loaderBar)
    //
    // load your assets
    //
      this.load.tilemap('level1', 'assets/level1.json', null, Phaser.Tilemap.TILED_JSON);
      this.load.image('overworld', 'assets/images/overworld.png');
      this.load.image('hurt-border', 'assets/images/hurt-border.png');
      this.load.spritesheet('player', 'assets/images/player.png', 32, 32, -1, 0, 0, 0);
      this.load.spritesheet('kid', 'assets/images/kid.png', 32, 32, -1, 0, 0, 0);
      this.load.spritesheet('guard', 'assets/images/guard.png', 32, 32, -1, 0, 0, 0);
      this.load.spritesheet('chaser', 'assets/images/chaser.png', 32, 32, -1, 0, 0, 0);
      this.load.spritesheet('shooter', 'assets/images/shooter.png', 36, 36, -1, 0, 0, 0);
      this.load.spritesheet('world', 'assets/images/world.png', 16, 16, 1, 0, 0);
      this.load.spritesheet('shot', 'assets/images/shot.png', 16, 16, -1, 0, 0);

      this.load.audio('bang', 'assets/sound/bang0.ogg');
      for (const i of [...Array(7).keys()]) {
	  this.load.audio(`guard idle ${i}`, `assets/sound/guard idle ${i}.ogg`);
      }
      for (const i of [...Array(3).keys()]) {
	  this.load.audio(`guard attack ${i}`, `assets/sound/guard attack ${i}.ogg`);
      }
      for (const i of [...Array(5).keys()]) {
	  this.load.audio(`guard pain ${i}`, `assets/sound/guard pain ${i}.ogg`);
      }
      for (const i of [...Array(8).keys()]) {
	  this.load.audio(`chaser idle ${i}`, `assets/sound/chaser idle ${i}.ogg`);
      }
      for (const i of [...Array(5).keys()]) {
	  this.load.audio(`chaser attack ${i}`, `assets/sound/chaser attack ${i}.ogg`);
      }
      for (const i of [...Array(4).keys()]) {
	  this.load.audio(`chaser pain ${i}`, `assets/sound/chaser pain ${i}.ogg`);
      }
  }

  create () {
    this.state.start('Game')
  }
}
