import 'phaser'
import PlayerCharacterToken from '../objects/playerCharacterToken'
import FpsText from '../objects/fpsText'
import { getUrlParam } from '../helpers/browserState'
import { Room } from '../../../typings/custom'
import globalState from '../worldstate/index';
import PlayerCharacter from '../worldstate/PlayerCharacter';
import FireBallEffect from '../objects/fireBallEffect';
// import IceNovaEffect from '../objects/iceSpikeEffect';
import IceNovaEffect from '../objects/iceNovaEffect';
import { facingToSpriteNameMap } from '../helpers/constants';
import { getFacing, getVelocitiesForFacing } from '../helpers/orientation';
import FireBall from '../abilities/fireBall'
import EnemyToken from '../objects/enemyToken';
import ItemToken from '../objects/itemToken';
import OverlayScreen from '../screens/overlayScreen'
import StatScreen from '../screens/statScreen';
import InventoryScreen from '../screens/inventoryScreen'

// The main scene handles the actual game play.
export default class MainScene extends Phaser.Scene {
  fpsText: Phaser.GameObjects.Text;
  mainCharacter: PlayerCharacterToken;
  upKey: Phaser.Input.Keyboard.Key;
  downKey: Phaser.Input.Keyboard.Key;
  leftKey: Phaser.Input.Keyboard.Key;
  rightKey: Phaser.Input.Keyboard.Key;
  abilityKey1: Phaser.Input.Keyboard.Key;
  abilityKey2: Phaser.Input.Keyboard.Key;
  effects: Map<string, FireBall>;
  fireballEffect: FireBallEffect | undefined;
  icenovaEffect: IceNovaEffect | undefined;
  tileLayer: any;
  enemy: EnemyToken;
  item: ItemToken;
  overlayScreens: {[name: string]: OverlayScreen} = {};
  lastCameraPosition: {x: number, y: number};

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {}

  create() {
    // tslint:disable-next-line:no-unused-expression
    this.mainCharacter =
      new PlayerCharacterToken(this, this.cameras.main.width / 2, this.cameras.main.height / 2);
    this.mainCharacter.setDepth(1);

    this.lastCameraPosition = {x: 0, y: 0};
    this.cameras.main.startFollow(this.mainCharacter, false);

    this.enemy = new EnemyToken(this, this.cameras.main.width/2+20, this.cameras.main.height /2+20);
    this.enemy.setDepth(1);

    this.item = new ItemToken(this, this.cameras.main.width/2-80, this.cameras.main.height /2-50);
    this.item.setDepth(1);

    // const fireball =
      // new FireBall(this, this.cameras.main.width / 2, this.cameras.main.height / 2);

    this.fpsText = new FpsText(this);

    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.abilityKey1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.abilityKey2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

    this.drawRoom();

    this.overlayScreens.statScreen = new StatScreen(this);
    this.overlayScreens.statScreen.incXY(-this.cameras.main.width/2, -this.cameras.main.height /2);
    this.add.existing(this.overlayScreens.statScreen);
    // this.overlayScreens.statScreen.setVisible(false);

    this.overlayScreens.inventory = new InventoryScreen(this);
    this.overlayScreens.inventory.incXY(-this.cameras.main.width/2, -this.cameras.main.height /2);
    this.add.existing(this.overlayScreens.inventory);
    this.overlayScreens.inventory.setVisible(false);
  }

  drawRoom() {
    const roomId = getUrlParam('roomName') || 'room-firstTest';
    const room = this.cache.json.get(roomId) as Room;

    const map = this.make.tilemap({data: room.layout, tileWidth: 16, tileHeight: 16});
    const tiles = map.addTilesetImage('test-tileset-image', 'test-tileset', 16, 16, 1, 2);
    const roomHeight = tiles.tileHeight * room.layout.length;
    const roomWidth = tiles.tileWidth * room.layout[0].length;
    this.tileLayer = map.createStaticLayer(
      0,
      tiles,
      (this.cameras.main.width / 2) - roomWidth / 2,
      (this.cameras.main.height / 2) - roomHeight / 2
    );
    this.tileLayer.setCollisionBetween(0, 31, true);
    this.tileLayer.setDepth(0);

    this.physics.add.collider(this.mainCharacter, this.tileLayer);
    this.physics.add.collider(this.enemy, this.tileLayer);

    // const debugGraphics = this.add.graphics().setAlpha(0.75);
    // layer.renderDebug(debugGraphics, {
    //   tileColor: null, // Color of non-colliding tiles
    //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), 
      // Color of colliding tiles
    //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });
  }

  

  // drawStatScreen() {

    // this.add.group()
    // const leftBorderX = 16 + this.cameras.main.x;
    // const topBorderY = 80 + this.cameras.main.y;
    // const screenWidth = 200;
    // const screenHeight = 224;
    // const tileSize = 64;
    // const rightBorderX = leftBorderX + screenWidth - tileSize;
    // const bottomBorderY = topBorderY + screenHeight - tileSize;
    // const middlePieceX = leftBorderX + tileSize;
    // const middlePieceY = topBorderY + tileSize;

    // const topLeftCorner = this.add.image(leftBorderX, topBorderY, 'screen-background', 0);
    // const topRightCorner = this.add.image(rightBorderX, topBorderY, 'screen-background', 2);
    // const bottomLeftCorner = this.add.image(leftBorderX, bottomBorderY, 'screen-background', 6);
    // const bottomRightCorner = this.add.image(rightBorderX, bottomBorderY, 'screen-background', 8);

    // const topBorder = this.add.image(middlePieceX, topBorderY, 'screen-background', 1);
    // const bottomBorder = this.add.image(middlePieceX, bottomBorderY, 'screen-background', 7);

    // const leftBorder = this.add.image(leftBorderX, middlePieceY, 'screen-background', 3);
    // const rightBorder = this.add.image(rightBorderX, middlePieceY, 'screen-background', 5);

    // const centerPiece = this.add.image(middlePieceX, middlePieceY, 'screen-background', 4);

    // const pieces = [
    //   topLeftCorner,
    //   topRightCorner,
    //   bottomLeftCorner,
    //   bottomRightCorner,
    //   topBorder,
    //   bottomBorder,
    //   leftBorder,
    //   rightBorder,
    //   centerPiece,
    // ];
    // pieces.forEach((piece) => {
    //   piece.setDepth(3);
    // })
  // }

  update() {
    this.fpsText.update();
    const lastPlayerX = globalState.playerCharacter.x;
    const lastPlayerY = globalState.playerCharacter.y;

    this.enemy.update(globalState.playerCharacter);
    this.item.update(globalState.playerCharacter);

    if(globalState.playerCharacter.health <= 0){
      console.log("you died");
      return;
    }
    
    let yFacing = 0;
    let xFacing = 0;

    const speed = globalState.playerCharacter.movementSpeed * globalState.playerCharacter.slowFactor;

    if (this.upKey.isDown)
    {
      yFacing = -1;
      globalState.playerCharacter.y--;
    }
    else if (this.downKey.isDown)
    {
      yFacing = 1;
      globalState.playerCharacter.y++;
    }

    if (this.leftKey.isDown)
    {
      xFacing = -1;
      globalState.playerCharacter.x--;
    }
    else if (this.rightKey.isDown)
    {
      xFacing = 1;
      globalState.playerCharacter.x++;
    }

    if (yFacing !== 0 || xFacing !== 0) {
      const lastFacing = globalState.playerCharacter.currentFacing;
      const newFacing = getFacing(xFacing, yFacing);

      if (lastFacing !== newFacing || globalState.playerCharacter.isWalking === false) {
        const characterDirection = facingToSpriteNameMap[newFacing];
        this.mainCharacter.play(`player-walk-${characterDirection}`);
        globalState.playerCharacter.currentFacing = newFacing;
        globalState.playerCharacter.isWalking = true;
      }
    } else /* No movement keys pressed */ {
      const characterDirection = facingToSpriteNameMap[globalState.playerCharacter.currentFacing];
      this.mainCharacter.play(`player-character-idle-${characterDirection}`);
      globalState.playerCharacter.isWalking = false;
    }

    this.mainCharacter.setVelocity(xFacing * speed, yFacing * speed);
    this.mainCharacter.body.velocity.normalize().scale(speed);

    globalState.playerCharacter.x = this.mainCharacter.x;
    globalState.playerCharacter.y = this.mainCharacter.y;

    if (this.fireballEffect) {
      this.fireballEffect.update();
    }

    if (this.abilityKey1.isDown && !this.fireballEffect) {
      const fireballVelocities = getVelocitiesForFacing(globalState.playerCharacter.currentFacing)!;
      this.fireballEffect = new FireBallEffect(
        this,
        this.mainCharacter.x + (16 * fireballVelocities.x),
        this.mainCharacter.y + (16 * fireballVelocities.y)
      );
      this.fireballEffect.setVelocity(fireballVelocities.x, fireballVelocities.y);
      this.fireballEffect.body.velocity.normalize().scale(300);

      this.physics.add.collider(this.fireballEffect, this.tileLayer, (effect) => {
        effect.destroy();
        this.fireballEffect = undefined;
      });
      this.physics.add.collider(this.fireballEffect, this.enemy, (effect, enemy) => {
        effect.destroy();
        this.fireballEffect = undefined;
        this.enemy.health = this.enemy.health - globalState.playerCharacter.damage;
        console.log("damage dome =" ,globalState.playerCharacter.damage);
        console.log("life remaining =" ,this.enemy.health);
      });
    }

    if (this.icenovaEffect) {
      this.icenovaEffect.update();
    }

    if (this.abilityKey2.isDown && !this.icenovaEffect) {
      const iceNovaVelocities = getVelocitiesForFacing(globalState.playerCharacter.currentFacing)!;
      this.icenovaEffect = new IceNovaEffect(
        this,
        this.mainCharacter.x + (16 * iceNovaVelocities.x),
        this.mainCharacter.y + (16 * iceNovaVelocities.y),
        globalState.playerCharacter.currentFacing
      );
      this.icenovaEffect.setVelocity(iceNovaVelocities.x, iceNovaVelocities.y);
      this.icenovaEffect.body.velocity.normalize().scale(300);

      this.physics.add.collider(this.icenovaEffect, this.tileLayer, (effect) => {
        (effect as IceNovaEffect).destroy(() => {
          this.icenovaEffect = undefined;
        });
      });
      this.physics.add.collider(this.icenovaEffect, this.enemy, (effect, enemy) => {
        this.enemy.health = this.enemy.health - 3;
        const castEffect = (effect as IceNovaEffect);
        castEffect.attachToEnemy(enemy);
        castEffect.destroy(() => {
          this.icenovaEffect = undefined;
        });
      });
    }

    Object.values(this.overlayScreens).forEach((screen) => {
      if (screen) {
        screen.incXY(
          globalState.playerCharacter.x - this.lastCameraPosition.x,
          globalState.playerCharacter.y - this.lastCameraPosition.y
        );
      }
    })
    this.lastCameraPosition = {x: globalState.playerCharacter.x, y: globalState.playerCharacter.y};
  }
}
