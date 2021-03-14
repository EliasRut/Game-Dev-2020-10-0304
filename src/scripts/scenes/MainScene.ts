import 'phaser';

import globalState from '../worldstate/index';

import StoryLine from '../models/StoryLine';
import SideQuestLog from '../models/SideQuestLog';

import PlayerCharacterToken from '../drawables/tokens/PlayerCharacterToken';
import FpsText from '../drawables/ui/FpsText';

import StatScreen from '../screens/StatScreen';
import InventoryScreen from '../screens/InventoryScreen';
import DialogScreen from '../screens/DialogScreen';
import ItemScreen from '../screens/ItemScreen';

import KeyboardHelper from '../helpers/KeyboardHelper';
import { getCharacterSpeed, getFacing, updateMovingState } from '../helpers/movement';
import { NUM_ITEM_ICONS, UiDepths} from '../helpers/constants';
import { generateTilemap } from '../helpers/drawDungeon';
import DynamicLightingHelper from '../helpers/DynamicLightingHelper';
import Avatar from '../drawables/ui/Avatar';
import ScriptHelper from '../helpers/ScriptHelper';
import AbilityHelper from '../helpers/AbilityHelper';
import BackpackIcon from '../drawables/ui/BackpackIcon';
import { spawnNpc } from '../helpers/spawn';
import CharacterToken from '../drawables/tokens/CharacterToken';
import { NpcScript } from '../../../typings/custom';
import WorldItemToken from '../drawables/tokens/WorldItemToken';
import Item from '../worldstate/Item';
import { generateRandomItem } from '../helpers/item';
import DoorToken from '../drawables/tokens/DoorToken';

import fixedItems from '../../items/fixedItems.json';

const FADE_IN_TIME_MS = 1000;
const FADE_OUT_TIME_MS = 1000;

const DEBUG__ITEM_OFFSET_X = 30;
const DEBUG__ITEM_OFFSET_Y = 30;

const CASTING_SPEED_MS = 250;

const CONNECTION_POINT_THRESHOLD_DISTANCE = 32;
const STEP_SOUND_TIME= 200;

// The main scene handles the actual game play.
export default class MainScene extends Phaser.Scene {
	fpsText: Phaser.GameObjects.Text;

	keyboardHelper: KeyboardHelper;
	dynamicLightingHelper?: DynamicLightingHelper;
	scriptHelper: ScriptHelper;
	abilityHelper: AbilityHelper;

	mainCharacter: PlayerCharacterToken;
	npcMap: {[id: string]: CharacterToken};
	doorMap: {[id: string]: DoorToken};
	worldItems: WorldItemToken[];

	overlayScreens: {
		inventory: InventoryScreen;
		statScreen: StatScreen;
		dialogScreen: DialogScreen;
		itemScreen: ItemScreen;
	};
	alive: number;
	isPaused = false;
	blockUserInteraction = false;

	avatar: Avatar;
	backpackIcon: BackpackIcon;
	tileLayer: Phaser.Tilemaps.DynamicTilemapLayer;
	decorationLayer: Phaser.Tilemaps.DynamicTilemapLayer;
	overlayLayer: Phaser.Tilemaps.DynamicTilemapLayer;

	useDynamicLighting = false;
	storyLine: StoryLine;
	sideQuestLog: SideQuestLog;

	lastSave: number = Date.now();

	lastStepLeft: number | undefined;

	constructor() {
		super({ key: 'MainScene' });
	}

	create() {
		this.alive = 0;
		// tslint:disable-next-line:no-unused-expression
		this.cameras.main.fadeIn(FADE_IN_TIME_MS);

		this.generateStory();

		this.npcMap = {};
		this.doorMap = {};
		this.worldItems = [];
		const [startX, startY] = this.drawRoom();

		this.useDynamicLighting = globalState.roomAssignment[globalState.currentLevel].dynamicLighting;

		if (this.useDynamicLighting) {
			this.dynamicLightingHelper = new DynamicLightingHelper(
				this.tileLayer,
				this.decorationLayer,
				this.overlayLayer
			);
		}

		this.mainCharacter = new PlayerCharacterToken(
			this,
			globalState.playerCharacter.x || startX,
			globalState.playerCharacter.y || startY);
		this.mainCharacter.setDepth(UiDepths.TOKEN_MAIN_LAYER);
		this.cameras.main.startFollow(this.mainCharacter, false);
		this.physics.add.collider(this.mainCharacter, this.tileLayer);
		this.physics.add.collider(this.mainCharacter, this.decorationLayer);
		Object.values(this.doorMap).forEach((door) => {
			this.physics.add.collider(this.mainCharacter, door);
		});

		this.overlayScreens = {
			statScreen: new StatScreen(this),
			inventory: new InventoryScreen(this),
			itemScreen: new ItemScreen(this),
			dialogScreen: new DialogScreen(this)
		};

		this.fpsText = new FpsText(this);
		this.backpackIcon = new BackpackIcon(this);
		this.avatar = new Avatar(this);

		this.keyboardHelper = new KeyboardHelper(this);
		this.abilityHelper = new AbilityHelper(this);
		this.scriptHelper = new ScriptHelper(this);

	// 	var pointers = this.input.activePointer;
	// 	this.input.on('pointerdown', function () {
	// 	  console.log("mouse x", pointers.x)
	// 	  console.log("mouse y", pointers.y)
	// });

		this.sound.stopAll();
		if (globalState.currentLevel === 'town') {
			this.sound.play('score-town', {volume: 0.05, loop: true});
		} else {
			this.sound.play('score-dungeon', {volume: 0.04, loop: true});
		}
	}

	addNpc(id: string, type: string, x: number, y: number, script?: NpcScript) {
		this.npcMap[id] = spawnNpc(this, type, id, x, y);
		this.npcMap[id].setDepth(UiDepths.TOKEN_MAIN_LAYER);
		this.physics.add.collider(this.npcMap[id], this.tileLayer);
		this.physics.add.collider(this.npcMap[id], this.decorationLayer);
		this.npcMap[id].script = script;
	}

	addDoor(id: string, type: string, x: number, y: number, open: boolean) {
		if (!globalState.doors[id]) {
			globalState.doors[id] = {
				id,
				type,
				x,
				y,
				open
			};
		}
		this.doorMap[id] = new DoorToken(this, x, y, type, id);
		this.doorMap[id].setDepth(UiDepths.DECORATION_TILE_LAYER);
		this.physics.add.collider(this.doorMap[id], this.mainCharacter);
		Object.values(this.npcMap).forEach((npc) => {
			this.physics.add.collider(this.doorMap[id], npc);
		});
		this.doorMap[id].setFrame(globalState.doors[id].open ? 1 : 0);
	}

	addFixedItem(id: string, x: number, y: number) {
		this.dropItem(
			x - DEBUG__ITEM_OFFSET_X,
			y - DEBUG__ITEM_OFFSET_Y,
			{
				...(fixedItems as {[id: string]: Partial<Item>})[id],
				itemLocation: 0
			} as Item
		);
	}

	changeDoorState(id: string, open: boolean) {
		if (open) {
			this.doorMap[id].open();
		} else {
			this.doorMap[id].close();
		}
	}

	drawRoom() {
		const dungeonLevel = globalState.dungeon.levels[globalState.currentLevel];
		if (!dungeonLevel) {
			throw new Error(`No dungeon level was created for level name ${globalState.currentLevel}.`);
		}

		const {
			startPositionX,
			startPositionY,
			npcs,
			doors,
			items
		} = dungeonLevel;

		const [
			tileLayer,
			decorationLayer,
			overlayLayer
		] = generateTilemap(this, dungeonLevel);

		this.tileLayer = tileLayer;
		this.decorationLayer = decorationLayer;
		this.overlayLayer = overlayLayer;

		this.tileLayer.setDepth(UiDepths.BASE_TILE_LAYER);
		this.decorationLayer.setDepth(UiDepths.DECORATION_TILE_LAYER);
		this.overlayLayer.setDepth(UiDepths.OVERLAY_TILE_LAYER);

		npcs.forEach((npc) => {
			this.addNpc(npc.id, npc.type, npc.x, npc.y, npc.script);
		});

		doors.forEach((door) => {
			this.addDoor(door.id, door.type, door.x, door.y, door.open);
		});

		items.forEach((item) => {
			this.addFixedItem(item.id, item.x, item.y);
		});

		return [startPositionX, startPositionY];
	}

	renderDebugGraphics() {
		// tslint:disable: no-magic-numbers
		const debugGraphics = this.add.graphics().setAlpha(0.75);
		this.tileLayer.renderDebug(debugGraphics, {
			tileColor: null, // Color of non-colliding tiles
			collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
			faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
		});
		// tslint:enable: no-magic-numbers
	}

	update(globalTime: number, _delta: number) {
		globalState.gameTime = globalTime;
		this.fpsText.update();

		if (this.keyboardHelper.isKKeyPressed()) {
			globalState.clearState();
			location.reload();
		}

		if(globalState.playerCharacter.health <= 0 && this.alive === 0){
			this.cameras.main.fadeOut(FADE_OUT_TIME_MS);
			// tslint:disable-next-line: no-console
			console.log('you died');
			this.alive = 1;
			// this.scene.pause();
			return;
		}

		this.scriptHelper.handleScripts(globalTime);

		this.overlayScreens.statScreen.update();
		this.overlayScreens.itemScreen.update(this.overlayScreens.inventory.focusedItem);

		if (this.isPaused) {
			return;
		}

		if (!this.blockUserInteraction) {
			const msSinceLastCast = this.keyboardHelper.getMsSinceLastCast(globalTime);
			const isCasting = msSinceLastCast < CASTING_SPEED_MS;

			const [xFacing, yFacing] = this.keyboardHelper.getCharacterFacing();
			const newFacing = getFacing(xFacing, yFacing);

			const hasMoved = isCasting ? false : (xFacing !== 0 || yFacing !== 0);
			const playerAnimation = updateMovingState(
				globalState.playerCharacter,
				hasMoved,
				newFacing);
			if (playerAnimation) {
				this.mainCharacter.play(playerAnimation);
			}
			if (hasMoved) {
				const shouldPlayLeftStepSfx =
					!this.lastStepLeft || (globalTime - this.lastStepLeft) > STEP_SOUND_TIME;

				if (shouldPlayLeftStepSfx) {
					this.sound.play('sound-step-grass-l', {volume: 0.25});
					this.lastStepLeft = globalTime;
				}
			} else {
				this.lastStepLeft = undefined;
			}

			const speed = isCasting ? 0 : getCharacterSpeed(globalState.playerCharacter);

			this.mainCharacter.setVelocity(xFacing * speed, yFacing * speed);
			this.mainCharacter.body.velocity.normalize().scale(speed);

		}
		globalState.playerCharacter.x = Math.round(this.mainCharacter.x);
		globalState.playerCharacter.y = Math.round(this.mainCharacter.y);

		if (!this.blockUserInteraction) {
			const castAbilities = this.keyboardHelper.getCastedAbilities(globalTime);
			this.abilityHelper.update(castAbilities);
		}

		const cooldowns = this.keyboardHelper.getAbilityCooldowns(globalTime);
		this.avatar.update(cooldowns);

		if (this.useDynamicLighting && this.dynamicLightingHelper) {
			this.dynamicLightingHelper.updateDynamicLighting();
		}

		Object.values(this.npcMap).forEach((curNpc) => {
			curNpc.update(globalTime);
		});

		// TODO: remove items that are picked up
		this.worldItems = this.worldItems.filter((itemToken) => !itemToken.isDestroyed);
		this.worldItems.forEach((item) => {
			item.update(this);
		});

		// Check if the player is close to a connection point and move them if so
		const connections = globalState.dungeon.levels[globalState.currentLevel]?.connections || [];
		const playerX = globalState.playerCharacter.x;
		const playerY = globalState.playerCharacter.y;
		connections.forEach((connection) => {

			if (Math.hypot(
						connection.x - playerX,
						connection.y - playerY) < CONNECTION_POINT_THRESHOLD_DISTANCE) {
				globalState.playerCharacter.x = 0;
				globalState.playerCharacter.y = 0;
				if (connection.targetMap) {
					globalState.currentLevel = connection.targetMap;
					this.scene.start('RoomPreloaderScene');
				} else if (connection.targetScene) {
					this.scene.start(connection.targetScene);
				}
			}
		});

		// tslint:disable-next-line: no-magic-numbers
		if (Date.now() - this.lastSave > 10 * 1000) {
			this.lastSave = Date.now();
			globalState.storeState();
		}
	}

	pause() {
		this.isPaused = true;
		this.physics.pause();
	}

	resume() {
		this.isPaused = false;
		this.physics.resume();
	}

	dropItem(x: number, y: number, item: Item) {
		const itemToken = new WorldItemToken(this, x, y, item);
		itemToken.setDepth(UiDepths.TOKEN_MAIN_LAYER);
		this.worldItems.push(itemToken);
	}

	generateStory() {
		if(!this.storyLine) {
			this.storyLine = new StoryLine();
			// tslint:disable-next-line: no-console
			console.log(this.storyLine);
			const mainQuests = this.storyLine.storyLineData.mainQuests;
			this.sideQuestLog = new SideQuestLog(mainQuests.length, this.storyLine.storyLineData.themes);
			// tslint:disable-next-line: no-console
			console.log(this.sideQuestLog);

			for(let i = 0; i < mainQuests.length; i++) {
				const sideQuestRooms: string[] = [];
				for(const sideQuest of this.sideQuestLog.sideQuests) {
					if(sideQuest.level === i) {
						sideQuestRooms.concat(sideQuest.rooms);
					}
				}
				const rooms = ['connection_up'];
				if (i < mainQuests.length - 1) {
					rooms.push('connection_down');
				}
				globalState.roomAssignment['dungeonLevel' + (i + 1)] = {
					dynamicLighting: true,
					rooms: rooms.concat(mainQuests[i].rooms).concat(sideQuestRooms)
				};
			}
		}
	}
}