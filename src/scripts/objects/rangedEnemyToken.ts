import { AbilityType } from "../abilities/abilityData";
import { getFacing } from "../helpers/orientation";
import MainScene from "../scenes/mainScene";
import globalState from "../worldstate";
import Enemy from "../worldstate/Enemy";
import EnemyToken from "./enemyToken";

export default class RangedEnemyToken extends EnemyToken {

  constructor(scene: MainScene, x: number, y: number, tokenName: string) {
    super(scene, x, y, tokenName);

    this.proximity = 100; // how close the enemy comes.
  }

  public update(time: number,) {
    super.update(time);

    const player = globalState.playerCharacter;

    // check death
    if (this.stateObject.health <= 0){
      this.dropItem(player,this.scene);
      this.destroy();
      return;
    }

      const px = player.x;
      const py = player.y;
      const distance = this.getDistance(player);

      const totalDistance = Math.abs(px - this.x) + Math.abs(py - this.y);
      const xFactor = (px - this.x) / totalDistance;
      const yFactor = (py - this.y) / totalDistance;
      (this.stateObject as Enemy).exactTargetXFactor = xFactor;
      (this.stateObject as Enemy).exactTargetYFactor = yFactor;
      const xSpeed = xFactor * this.stateObject.movementSpeed;
      const ySpeed = yFactor * this.stateObject.movementSpeed;
      const newFacing = getFacing(xSpeed, ySpeed);

      if (this.proximity < distance
        && distance < this.stateObject.vision
        && this.attackedAt + this.stateObject.attackTime < time
        &&this.checkLoS(player)) {
          this.setVelocityX(xSpeed);
          this.setVelocityY(ySpeed);
          this.stateObject.currentFacing = newFacing;
          const animation = this.stateObject.updateMovingState(true, newFacing);

          if (animation) {
            this.play(animation);
          }
      } else {
        this.setVelocityX(0);
        this.setVelocityY(0);
        const animation =
          this.stateObject.updateMovingState(false, this.stateObject.currentFacing);

        if (animation) {
          this.play(animation);
        }
      }

      if(distance <= this.proximity && this.checkLoS(player)) {
        this.attack(time);
      }

      this.stateObject.x = this.body.x;
      this.stateObject.y = this.body.y;
    }

    attack(time) {
    const player = globalState.playerCharacter;
      if (this.attackedAt + this.stateObject.attackTime < time) {
        this.setVelocityX(0);
        this.setVelocityY(0);
        this.attackedAt = time;
        this.scene.triggerAbility(this.stateObject, AbilityType.ICESPIKE);
      }
    }
}