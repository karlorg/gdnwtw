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
      this.load.spritesheet('player', 'assets/images/player.png', 32, 32, 1, 0, 0, 1);
      this.load.spritesheet('world', 'assets/images/world.png', 16, 16, 1, 0, 0);
  }

  create () {
    this.state.start('Game')
  }
}
