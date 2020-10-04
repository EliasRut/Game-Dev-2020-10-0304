import { ANIMATION_IDLE, ANIMATION_WALK, Facings, facingToSpriteNameMap } from "../helpers/constants";

export default class Character {
  private animationBase: string;
  public health: number;
  public damage: number;
  public movementSpeed: number;
  public slowFactor: number = 1;

  public currentFacing: Facings = Facings.SOUTH;
  public isWalking = false;

  constructor(
      animationBase: string,
      health: number = 100,
      damage: number = 10,
      movementSpeed: number = 100
    ) {
    this.animationBase = animationBase;
    this.health = health;
    this.damage = damage;
    this.movementSpeed = movementSpeed;
  }

  public getSpeed() {
    return this.movementSpeed * this.slowFactor;
  }

  public updateMovingState (hasMoved: boolean, facing: Facings) {
    if (!hasMoved) {
      const characterDirection = facingToSpriteNameMap[this.currentFacing];
      return `${this.animationBase}-${ANIMATION_IDLE}-${characterDirection}`;
    }
    if (facing === this.currentFacing && this.isWalking) {
      return false;
    }
    const characterDirection = facingToSpriteNameMap[facing];
    this.currentFacing = facing;
    this.isWalking = hasMoved;
    return `${this.animationBase}-${ANIMATION_WALK}-${characterDirection}`;
  }
}