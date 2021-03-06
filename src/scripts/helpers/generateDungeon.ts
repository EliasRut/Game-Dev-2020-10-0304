import { ItemsPositioning, MapConnection, NpcPositioning, OpeningDirection, Room } from '../../../typings/custom';
import { DungeonLevelData } from '../models/DungeonRunData';
import globalState from '../worldstate';
import Door from '../worldstate/Door';
import DungeonLevel from '../worldstate/DungeonLevel';
import { colorOfMagicToTilesetMap, enemyBudgetCost } from './constants';
import RoomGenerator from './generateRoom';

export const BLOCK_SIZE = 8;
export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;

export const GID_MULTIPLE = 1000;

const MAX_RETRIES = 100;

const BIT_NORTH = 1;
const BIT_EAST = 2;
const BIT_SOUTH = 4;
const BIT_WEST = 8;

// tslint:disable: no-magic-numbers
const CAP_NORTH = [
	[ 13,  8,  8,  8,  8,  8,  8, 12],
	[  6, 15, 22, 15, 15, 22, 15,  4],
	[  6, 18, 25, 18, 18, 25, 18,  4],
	[  6, 32, 39, 32, 32, 39, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
];
const CAP_SOUTH = [
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[ 11,  2,  2,  2,  2,  2,  2, 10],
];
const CAP_EAST = [
	[  8,  8,  8,  8,  8,  8,  8, 12],
	[ 15, 15, 22, 15, 15, 15, 22,  4],
	[ 18, 18, 25, 18, 18, 18, 25,  4],
	[ 32, 32, 39, 32, 32, 32, 39,  4],
	[ 32, 32, 32, 32, 32, 32, 32,  4],
	[ 32, 32, 32, 32, 32, 32, 32,  4],
	[ 32, 32, 32, 32, 32, 32, 32,  4],
	[  2,  2,  2,  2,  2,  2,  2, 10],
];
const CAP_WEST = [
	[ 13,  8,  8,  8,  8,  8,  8,  8],
	[  6, 15, 22, 15, 15, 15, 22, 15],
	[  6, 18, 25, 18, 18, 18, 25, 18],
	[  6, 32, 39, 32, 32, 32, 39, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[ 11,  2,  2,  2,  2,  2,  2,  2],
];
const CORRIDOR_UP = [
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
	[  6, 32, 32, 32, 32, 32, 32,  4],
];
const CORRIDOR_LEFT = [
	[  8,  8,  8,  8,  8,  8,  8,  8],
	[ 15, 15, 22, 15, 15, 15, 22, 15],
	[ 18, 18, 25, 18, 18, 18, 25, 18],
	[ 32, 32, 39, 32, 32, 32, 39, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[  2,  2,  2,  2,  2,  2,  2,  2],
];
const CORRIDOR_UP_RIGHT = [
	[ 13,  8,  8,  8,  8,  8,  8,  8],
	[  6, 15, 15, 15, 15, 22, 15, 15],
	[  6, 18, 18, 18, 18, 25, 18, 18],
	[  6, 32, 32, 32, 32, 39, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32,  1],
];
const CORRIDOR_UP_LEFT = [
	[  8,  8,  8,  8,  8,  8,  8, 12],
	[ 15, 15, 22, 15, 15, 15, 15, 4],
	[ 18, 18, 25, 18, 18, 18, 18, 4],
	[ 32, 32, 39, 32, 32, 32, 32, 4],
	[ 32, 32, 32, 32, 32, 32, 32, 4],
	[ 32, 32, 32, 32, 32, 32, 32, 4],
	[ 32, 32, 32, 32, 32, 32, 32, 4],
	[  3, 32, 32, 32, 32, 32, 32, 4],
];
const CORRIDOR_DOWN_RIGHT = [
	[  6, 32, 32, 32, 32, 32, 32,  7],
	[  6, 32, 32, 32, 32, 32, 32, 14],
	[  6, 32, 32, 32, 32, 32, 32, 17],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[ 11,  2,  2,  2,  2,  2,  2,  2],
];
const CORRIDOR_DOWN_LEFT = [
	[   9, 32, 32, 32, 32, 32, 32,  4],
	[  16, 32, 32, 32, 32, 32, 32,  4],
	[  19, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[   2,  2,  2,  2,  2,  2,  2, 10],
];
const T_CROSSING_TOP_LEFT_BOTTOM = [
	[   9, 32, 32, 32, 32, 32, 32,  4],
	[  16, 32, 32, 32, 32, 32, 32,  4],
	[  19, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[  32, 32, 32, 32, 32, 32, 32,  4],
	[   3, 32, 32, 32, 32, 32, 32,  4],
];
const T_CROSSING_TOP_LEFT_RIGHT = [
	[  9, 32, 32, 32, 32, 32, 32,  7],
	[ 16, 32, 32, 32, 32, 32, 32, 14],
	[ 19, 32, 32, 32, 32, 32, 32, 17],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 2,  2,  2,  2,  2,  2,  2,  2],
];
const T_CROSSING_TOP_RIGHT_BOTTOM = [
	[  6, 32, 32, 32, 32, 32, 32,  7],
	[  6, 32, 32, 32, 32, 32, 32, 14],
	[  6, 32, 32, 32, 32, 32, 32, 17],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32, 32],
	[  6, 32, 32, 32, 32, 32, 32,  1],
];
const T_CROSSING_LEFT_RIGHT_BOTTOM = [
	[  8,  8,  8,  8,  8,  8,  8,  8],
	[ 15, 15, 22, 15, 15, 15, 22, 15],
	[ 18, 18, 25, 18, 18, 18, 25, 18],
	[ 32, 32, 39, 32, 32, 32, 39, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[ 32, 32, 32, 32, 32, 32, 32, 32],
	[  3, 32, 32, 32, 32, 32, 32,  1],
];
const CROSSWAY = [
	[   9, 32, 32, 32, 32, 32, 32,  7],
	[  16, 32, 32, 32, 32, 32, 32, 14],
	[  19, 32, 32, 32, 32, 32, 32, 17],
	[  32, 32, 32, 32, 32, 32, 32, 32],
	[  32, 32, 32, 32, 32, 32, 32, 32],
	[  32, 32, 32, 32, 32, 32, 32, 32],
	[  32, 32, 32, 32, 32, 32, 32, 32],
	[   3, 32, 32, 32, 32, 32, 32,  1],
];
// tslint:disable: no-magic-numbers

const CORRIDOR_LAYOUTS = {
	[BIT_NORTH																		]:				CAP_NORTH,
	[							BIT_EAST												]:				CAP_EAST,
	[BIT_NORTH +	BIT_EAST												]:				CORRIDOR_DOWN_LEFT,
	[													BIT_SOUTH						]:				CAP_SOUTH,
	[BIT_NORTH +							BIT_SOUTH						]:				CORRIDOR_UP,
	[							BIT_EAST + 	BIT_SOUTH						]:				CORRIDOR_UP_LEFT,
	[BIT_NORTH +	BIT_EAST + 	BIT_SOUTH						]:				T_CROSSING_TOP_LEFT_BOTTOM,
	[																			BIT_WEST]:				CAP_WEST,
	[BIT_NORTH +													BIT_WEST]:				CORRIDOR_DOWN_RIGHT,
	[							BIT_EAST + 							BIT_WEST]:				CORRIDOR_LEFT,
	[BIT_NORTH +	BIT_EAST + 							BIT_WEST]:				T_CROSSING_TOP_LEFT_RIGHT,
	[													BIT_SOUTH + BIT_WEST]:				CORRIDOR_UP_RIGHT,
	[BIT_NORTH +							BIT_SOUTH + BIT_WEST]:				T_CROSSING_TOP_RIGHT_BOTTOM,
	[							BIT_EAST + 	BIT_SOUTH + BIT_WEST]:				T_CROSSING_LEFT_RIGHT_BOTTOM,
	[BIT_NORTH +	BIT_EAST + 	BIT_SOUTH + BIT_WEST]:				CROSSWAY,
};

export default class DungeonGenerator {
	tilesUsed: boolean[][];
	rooms: Room[];
	startRoomIndex: number;
	roomOffsets: [number, number][];
	tileSetCollections: {[name: string]: number[]};
	tileSetGid: {[name: string]: number};
	maxGenerationResets = 100;
	maxRoomPlacementTries = 1000;
	npcs: NpcPositioning[];
	combinedLayout: number[][];
	decorationLayout: number[][];
	overlayLayout: number[][];
	blocksUsed: number[][];
	tileLayer: Phaser.Tilemaps.TilemapLayer;
	dungeonLevel: number;

	fillerTilest: string;

	dungeonWidth: number;
	dungeonBlocksX: number;
	dungeonHeight: number;
	dungeonBlocksY: number;
	enemyBudget: number;

	public generateLevel: (
			id: string,
			dungeonLevel: number,
			levelData: DungeonLevelData
		) => DungeonLevel =
			(id, dungeonLevel, levelData) => {
		this.rooms = levelData.rooms.map((roomName) => globalState.availableRooms[roomName]);
		this.dungeonLevel = dungeonLevel;

		this.enemyBudget = levelData.enemyBudget;

		this.dungeonBlocksX = levelData.width;
		this.dungeonBlocksY = levelData.height;
		this.dungeonWidth = this.dungeonBlocksX * BLOCK_SIZE;
		this.dungeonHeight =  this.dungeonBlocksY * BLOCK_SIZE;

		this.fillerTilest = colorOfMagicToTilesetMap[levelData.style];

		while (levelData.numberOfRooms > this.rooms.length) {
			const roomGen = new RoomGenerator();
			const genericRoom = roomGen.generateRoom(this.fillerTilest);
			this.rooms.push(genericRoom);
			globalState.availableRooms[genericRoom.name] = genericRoom;
		}

		this.startRoomIndex = Math.max(0, this.rooms.findIndex((room) => room.startRoom));
		this.roomOffsets = [];
		this.tileSetCollections = {};
		this.tileSetGid = {};

		this.maxGenerationResets = MAX_RETRIES;
		this.maxRoomPlacementTries = MAX_RETRIES;

		this.rooms.forEach((room, roomIndex) => {
			if (!this.tileSetCollections[room.tileset]) {
				this.tileSetCollections[room.tileset] = [];
				this.tileSetGid[room.tileset] = Object.keys(this.tileSetGid).length * GID_MULTIPLE;
			}
			this.tileSetCollections[room.tileset].push(roomIndex);

			if (room.decorationTileset) {
				if (!this.tileSetCollections[room.decorationTileset]) {
					this.tileSetCollections[room.decorationTileset] = [];
					this.tileSetGid[room.decorationTileset] = Object.keys(this.tileSetGid).length * GID_MULTIPLE;
				}
				this.tileSetCollections[room.decorationTileset].push(roomIndex);
			}

			if (room.overlayTileset) {
				if (!this.tileSetCollections[room.overlayTileset]) {
					this.tileSetCollections[room.overlayTileset] = [];
					this.tileSetGid[room.overlayTileset] = Object.keys(this.tileSetGid).length * GID_MULTIPLE;
				}
				this.tileSetCollections[room.overlayTileset].push(roomIndex);
			}
		});

		// This will set the class variables and return true if everything worked, false otherwise
		if (!this.findRoomPlacement()) {
			throw new Error ('Failed to generate a dungeon. Too many tries.');
		}

		// At this point, we have a valid room placement

		// Reset the combined layout which holds the actual tileset data
		this.combinedLayout = [];
		this.decorationLayout = [];
		this.overlayLayout = [];
		for (let y = 0; y < this.dungeonHeight; y++) {
			this.combinedLayout[y] = [];
			this.decorationLayout[y] = [];
			this.overlayLayout[y] = [];
			for (let x = 0; x < this.dungeonWidth; x++) {
				this.combinedLayout[y][x] = -1;
				this.decorationLayout[y][x] = -1;
				this.overlayLayout[y][x] = -1;
			}
		}

		this.placeNpcs();

		this.findPaths();

		this.drawRooms();

		this.drawTilesForPaths();

		const [cameraOffsetX, cameraOffsetY] = this.getStartRoomCameraOffsets();

		const tilesets = Object.keys(this.tileSetGid)
			.sort((keyA, keyB) => this.tileSetGid[keyA] - this.tileSetGid[keyB]);

		const roomPositions = this.rooms.map((room, index) => {
			return {
				roomName: room.name,
				y: this.roomOffsets[index][0] * BLOCK_SIZE,
				x: this.roomOffsets[index][1] * BLOCK_SIZE,
				width: room.layout[0].length,
				height: room.layout.length
			};
		});

		const connections: MapConnection[] = [];
		this.rooms.forEach((room, index) => {
			(room.connections || []).forEach((connection) => {
				const y = connection.y + this.roomOffsets[index][0] * BLOCK_SIZE;
				const x = connection.x + this.roomOffsets[index][1] * BLOCK_SIZE;

				let targetX = connection.targetX;
				let targetY = connection.targetY;
				let targetMap = connection.targetMap;
				let targetRoom = connection.targetRoom;
				if (targetMap === 'NEXT_LEVEL') {
					targetMap = `dungeonLevel${this.dungeonLevel + 1}`;
					targetRoom = 'connection_up';
					targetX = 12;
					targetY = 5;
				} else if (targetMap === 'PREVIOUS_LEVEL') {
					if (this.dungeonLevel === 1) {
						targetMap = 'town_new';
						targetRoom = 'town_new';
						targetX = 75;
						targetY = 45;
					} else {
						targetMap = `dungeonLevel${this.dungeonLevel - 1}`;
						targetRoom = 'connection_down';
						targetX = 11;
						targetY = 6;
					}
				}

				connections.push({
					x: x * TILE_WIDTH,
					y: y * TILE_HEIGHT,
					targetX,
					targetY,
					targetRoom,
					targetMap,
					targetScene: connection.targetScene
				});
			});
		});

		const doors: Door[] = [];
		this.rooms.forEach((room, index) => {
			(room.doors || []).forEach((door) => {
				const y = door.y + this.roomOffsets[index][0] * BLOCK_SIZE;
				const x = door.x + this.roomOffsets[index][1] * BLOCK_SIZE;

				doors.push({
					x: x * TILE_WIDTH,
					y: y * TILE_HEIGHT,
					open: door.open,
					type: door.type,
					id: `${id}_${room.name}_${door.id}`
				});
			});
		});

		const items: ItemsPositioning[] = [];
		this.rooms.forEach((room, index) => {
			(room.items || []).forEach((item) => {
				const y = item.y + this.roomOffsets[index][0] * BLOCK_SIZE;
				const x = item.x + this.roomOffsets[index][1] * BLOCK_SIZE;

				items.push({
					x: x * TILE_WIDTH,
					y: y * TILE_HEIGHT,
					id: item.id
				});
			});
		});

		if (this.enemyBudget > 0) {
			let lastId = 0;
			const potentialEnemyFields: {x: number, y: number}[] = [];
			for (let y = 0; y < this.dungeonWidth; y++) {
				for (let x = 0; x < this.dungeonHeight; x++) {
					if (this.combinedLayout[y][x] === 32) {
						potentialEnemyFields.push({y, x});
					}
				}
			}
			while (this.enemyBudget > 0 && potentialEnemyFields.length > 0) {
				const randomIndex = Math.floor(potentialEnemyFields.length * Math.random());
				const {x, y} = potentialEnemyFields[randomIndex];
				this.enemyBudget--;
				this.npcs.push({
					facingX: 0,
					facingY: 0,
					type: 'enemy-zombie',
					id: `filler-${lastId++}`,
					x: x * TILE_WIDTH,
					y: y * TILE_HEIGHT
				});
				console.log(`Placed npc 'enemy-zombie' at ${x * TILE_WIDTH}, ${y * TILE_HEIGHT}. ` +
					`Budget left: ${this.enemyBudget}`);
				potentialEnemyFields.splice(randomIndex, 1);
			}
		}

		return {
			id,
			startPositionX: cameraOffsetX,
			startPositionY: cameraOffsetY,
			rooms: roomPositions,
			tilesets,
			layout: this.combinedLayout,
			decorationLayout: this.decorationLayout,
			overlayLayout: this.overlayLayout,
			npcs: this.npcs,
			connections,
			doors,
			items,
			enemyLevel:dungeonLevel
		};
	}

	private findRoomPlacement() {
		this.tilesUsed = [];

		// We initialize the array of arrays once and then only reset it's values in
		// tryRoomPlacement for performance reasons.
		for (let y = 0; y < this.dungeonBlocksY; y++) {
			this.tilesUsed[y] = [];
			for (let x = 0; x < this.dungeonBlocksX; x++) {
				this.tilesUsed[y][x] = false;
			}
		}
		this.roomOffsets = [];
		let numResets = 0;
		let roomPlacementFound = false;
		while (!roomPlacementFound && numResets < this.maxGenerationResets) {
			// tslint:disable-next-line: no-console
			console.log(`Starting ${numResets + 1}. try to generate a room placement.`);
			roomPlacementFound = this.tryRoomPlacement();
			numResets++;
		}

		let debugOutput = '';
		let firstLine = 'tiles used for rooms\n';
		for (let y = 0; y < this.dungeonBlocksY; y++) {
			firstLine += `${y}  `.substr(0, 3);
			debugOutput += `${y}`.padStart(2, ' ');
			for (let x = 0; x < this.dungeonBlocksX; x++) {
				debugOutput += this.tilesUsed[y][x] ? ' X ' : '   ';
			}
			debugOutput += '\n';
		}
		// tslint:disable-next-line: no-console
		console.log(firstLine + '\n' + debugOutput);

		for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
			const room = this.rooms[roomIndex];
			const [roomYBlockOffset, roomXBlockOffset] = this.roomOffsets[roomIndex];
			// tslint:disable-next-line: no-console
			console.log(`Drawing room ${room.name} to ${roomYBlockOffset}, ${roomXBlockOffset}.`);
		}

		return roomPlacementFound;
	}

	private tryRoomPlacement() {
		// Reset the map of used blocks
		for (let y = 0; y < this.dungeonBlocksY; y++) {
			for (let x = 0; x < this.dungeonBlocksX; x++) {
				this.tilesUsed[y][x] = false;
			}
		}
		this.roomOffsets = [];

		// Count how often we have tried to place a room in the dungeon, abort this function if it's
		// above this.maxRoomPlacementTries
		// Go through every room and try to place it. Record it's placement position if successful.
		for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
			let triesInRun = 0;
			const room = this.rooms[roomIndex];
			let isRoomOverlappingOtherRoom = false;
			let roomXBlockOffset;
			let roomYBlockOffset;

			// Dimensions in 8-block scale
			const roomWidth = Math.ceil(room.layout[0].length / BLOCK_SIZE);
			const roomHeight = Math.ceil(room.layout.length / BLOCK_SIZE);
			// Select a random position
			do {
				isRoomOverlappingOtherRoom = false;
				roomXBlockOffset = 1 + Math.floor(Math.random() * (this.dungeonBlocksX - roomWidth - 2));
				roomYBlockOffset = 1 + Math.floor(Math.random() * (this.dungeonBlocksY - roomHeight - 2));

				for (let y = -1; y <= roomHeight; y ++) {
					const rowIndex = y + roomYBlockOffset;
					for (let x = -1; x <= roomWidth; x++) {
						const columnIndex = x + roomXBlockOffset;
						if (this.tilesUsed[rowIndex][columnIndex]) {
							isRoomOverlappingOtherRoom = true;
							break;
						}
					}
					if (isRoomOverlappingOtherRoom) {
						triesInRun++;
						if (triesInRun > this.maxRoomPlacementTries) {
							return false;
						}
						break;
					}
				}
			} while (isRoomOverlappingOtherRoom);

			// We have found a position for this room.
			this.roomOffsets.push([
				roomYBlockOffset,
				roomXBlockOffset
			]);
			for (let y = 0; y < roomHeight; y++) {
				const rowIndex = y + roomYBlockOffset;
				for (let x = 0; x < roomWidth; x++) {
					const columnIndex = x + roomXBlockOffset;
					this.tilesUsed[rowIndex][columnIndex] = true;
				}
			}
		}
		// All rooms were placed
		return true;
	}

	private placeNpcs() {
		this.npcs = [];

		for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
			const room = this.rooms[roomIndex];
			room.npcs?.forEach((npc) => {
				const [roomYBlockOffset, roomXBlockOffset] = this.roomOffsets[roomIndex];
				const budgetCost = (enemyBudgetCost as {[name: string]: number})[npc.type] || 1;
				this.enemyBudget -= budgetCost;
				this.npcs.push({
					facingX: 0,
					facingY: 0,
					...npc,
					id: `${room.name}-${npc.id}`,
					x: (npc.x + roomXBlockOffset * BLOCK_SIZE) * TILE_WIDTH,
					y: (npc.y + roomYBlockOffset * BLOCK_SIZE) * TILE_HEIGHT
				});
			});
		}
	}

	private drawRoom(roomIndex: number) {
		const room = this.rooms[roomIndex];
		const gid = this.tileSetGid[room.tileset];
		const [roomYBlockOffset, roomXBlockOffset] = this.roomOffsets[roomIndex];
		const roomLayout = room.layout;

		// tslint:disable-next-line: no-console
		console.log(`Drawing room ${room.name} to ${roomYBlockOffset}, ${roomXBlockOffset}.`);

		for (let y = 0; y < roomLayout.length; y++) {
			for (let x = 0; x < roomLayout[y].length; x++) {
				if (roomLayout[y][x] > 0) {
					const actualY = y + roomYBlockOffset * BLOCK_SIZE;
					const actualX = x + roomXBlockOffset * BLOCK_SIZE;
					this.combinedLayout[actualY][actualX] = gid + roomLayout[y][x];
				}
			}
		}

		if (room.decorationTileset && room.decorations) {
			const decorationGid = this.tileSetGid[room.decorationTileset];
			const decorationLayout = room.decorations;
			// tslint:disable-next-line: no-console
			console.log(`Drawing decoration for room ${room.name}.`);

			for (let y = 0; y < decorationLayout.length; y++) {
				for (let x = 0; x < decorationLayout[y].length; x++) {
					if (decorationLayout[y][x] > 0) {
						const actualY = y + roomYBlockOffset * BLOCK_SIZE;
						const actualX = x + roomXBlockOffset * BLOCK_SIZE;
						this.decorationLayout[actualY][actualX] = decorationGid + decorationLayout[y][x];
					}
				}
			}
		}
		if (room.overlayTileset && room.overlays) {
			const overlayGid = this.tileSetGid[room.overlayTileset];
			const overlayLayout = room.overlays;
			// tslint:disable-next-line: no-console
			console.log(`Drawing overlay for room ${room.name}.`);

			for (let y = 0; y < overlayLayout.length; y++) {
				for (let x = 0; x < overlayLayout[y].length; x++) {
					if (overlayLayout[y][x] > 0) {
						const actualY = y + roomYBlockOffset * BLOCK_SIZE;
						const actualX = x + roomXBlockOffset * BLOCK_SIZE;
						this.overlayLayout[actualY][actualX] = overlayGid + overlayLayout[y][x];
					}
				}
			}
		}
	}

	private drawRooms() {
		for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
			this.drawRoom(roomIndex);
		}
	}

	private getExtraStepForOpening(y: number, x: number, openingDirection: OpeningDirection) {
		switch (openingDirection) {
			case 'top':
				return [y + 1, x];
			case 'right':
				return [y, x - 1];
			case 'bottom':
				return [y - 1, x];
			case 'left':
				return [y, x + 1];
		}
	}

	private findPaths() {
		this.blocksUsed = [];
		for (let y = 0; y < this.dungeonHeight / BLOCK_SIZE; y++) {
			this.blocksUsed[y] = [];
			for (let x = 0; x < this.dungeonWidth / BLOCK_SIZE; x++) {
				this.blocksUsed[y][x] = 0;
			}
		}

		// Don't draw paths if our start room doesn't have any openings
		if (this.rooms[this.startRoomIndex].openings.length === 0) {
			return;
		}

		let targetOpeningIndex: number;

		// Construct path.
		let numOpenings = 1;
		const visitedOpenings: [number, number, number, OpeningDirection][] =
			[[this.startRoomIndex, ...this.rooms[this.startRoomIndex].openings[0]]];
		const targetOpenings: [number, number, number, OpeningDirection][] = [];

		this.rooms[this.startRoomIndex].openings.slice(1).forEach((opening) => {
			numOpenings++;
			targetOpenings.push([this.startRoomIndex, ...opening]);
		});
		this.rooms.forEach((room, roomIndex) => {
			if (roomIndex === this.startRoomIndex) {
				return;
			}
			room.openings.forEach((opening) => {
				numOpenings++;
				targetOpenings.push([roomIndex, ...opening]);
			});
		});
		// tslint:disable-next-line: no-console
		console.log('target openings: ' + targetOpenings);

		// Special case dungeons with a single room with a single exit
		if (targetOpenings.length === 0) {
			const opening = this.rooms[this.startRoomIndex].openings[0];
			const targetCoordinates = [
				this.roomOffsets[this.startRoomIndex][0] + opening[0],
				this.roomOffsets[this.startRoomIndex][1] + opening[1]
			];

			this.blocksUsed[targetCoordinates[0]][targetCoordinates[1]] =
				(opening[2] === 'top'     ? BIT_NORTH : 0) +
				(opening[2] === 'right'   ? BIT_EAST  : 0) +
				(opening[2] === 'bottom'  ? BIT_SOUTH : 0) +
				(opening[2] === 'left'    ? BIT_WEST  : 0);
			return;
		}

		while (visitedOpenings.length < numOpenings) {
			const source = visitedOpenings[Math.floor(Math.random() * visitedOpenings.length)];
			const sourceRoomIndex = source[0];
			const sourceRoom = this.rooms[this.startRoomIndex];
			const sourceOpening = source.slice(1) as [number, number, OpeningDirection];

			targetOpeningIndex = Math.floor(Math.random() * targetOpenings.length);
			const target = targetOpenings[targetOpeningIndex];
			const targetRoomIndex = target[0];
			const targetRoom = this.rooms[targetRoomIndex];
			const targetOpening = target.slice(1) as [number, number, OpeningDirection];
			const targetCoordinates = [
				this.roomOffsets[targetRoomIndex][0] + targetOpening[0],
				this.roomOffsets[targetRoomIndex][1] + targetOpening[1]
			];

			const currentBlockY = this.roomOffsets[sourceRoomIndex][0] + sourceOpening[0];
			const currentBlockX = this.roomOffsets[sourceRoomIndex][1] + sourceOpening[1];
			// We need to know from where we went into the corridor to get the right corridor shape
			const [zeroStepY, zeroStepX] =
				this.getExtraStepForOpening(currentBlockY, currentBlockX, sourceOpening[2]);
			// We also need how we exited the corridor into the room
			const [lastStepY, lastStepX] =
				this.getExtraStepForOpening(targetCoordinates[0], targetCoordinates[1], targetOpening[2]);

			/*
				We are doing an iterative Breath-First-Search with a Taboo list.
				We start with the tile indicated in the room opening configuration by pushing all steps in
				that possible path, as an array of [y, x], to the nextExplorations array of arrays.
				In every step, we explore every possible direction: top, right, bottom, left
				These possible explorations are pushed to the end of the nextExplorations array
				At every, step, we take the exploration at the front of the array.
					-> This makes it Breath-First instead of Depth-First
				We do this until we have reached the target opening position, or no new exploration
				options are left.
				Every position we visit, we mark as visited
				We mark all positions that we know are rooms as already visited, this way we only need one
				taboo list.
				If we reach a position that was already visited, we don't explore further from there
				If we find the target position, we set foundPath to the history of this exploration.
			*/
			let foundPath: [number, number][] | undefined;
			const nextExplorations: [number, number][][] = [[
				[zeroStepY, zeroStepX],
				[currentBlockY, currentBlockX]
			]];
			const exploredBlocks: boolean[][] = [];
			for (let y = 0; y < this.dungeonHeight / BLOCK_SIZE; y++) {
				exploredBlocks[y] = [];
				for (let x = 0; x < this.dungeonWidth / BLOCK_SIZE; x++) {
					exploredBlocks[y][x] = this.tilesUsed[y][x];
				}
			}

			const makeStep = () => {
				if (nextExplorations.length === 0) {
					throw new Error(`Failed to build a way from ${sourceRoom.name} to ${targetRoom.name}. ` +
						`This should not have happened.`);
				}
				const history = nextExplorations.splice(0, 1)[0];
				if (foundPath) {
					return;
				}
				const [curY, curX] = history[history.length - 1];
				if (curY < 0 || curY >= this.dungeonBlocksY || curX < 0 || curX >= this.dungeonBlocksX) {
					return;
				}
				if (exploredBlocks[curY][curX]) {
					return;
				}
				exploredBlocks[curY][curX] = true;
				if (targetCoordinates[0] === curY && targetCoordinates[1] === curX) {
					foundPath = [...history];
					return;
				}
				if (this.tilesUsed[curY][curX] !== false) {
					return;
				}
				nextExplorations.push([...history, [curY - 1, curX]]);
				nextExplorations.push([...history, [curY + 1, curX]]);
				nextExplorations.push([...history, [curY, curX - 1]]);
				nextExplorations.push([...history, [curY, curX + 1]]);
			};

			while (!foundPath) {
				makeStep();
			}

			// Include the last step into the room in our path. We're not going to tile that, but we need
			// the info for calculating what kind of corridor we need.
			foundPath = [...foundPath, [lastStepY, lastStepX]];

			// tslint:disable-next-line: no-console
			console.log(`Build a way from ${sourceRoom.name} to ${targetRoom.name}: ` +
				JSON.stringify(foundPath));

			// The first step is the origin room, the last step is the target room. We ignore those two.
			for (let pathStep = 1; pathStep < foundPath.length - 1; pathStep++) {
				const prevStepY = foundPath[pathStep - 1][0];
				const prevStepX = foundPath[pathStep - 1][1];
				const curStepY = foundPath[pathStep][0];
				const curStepX = foundPath[pathStep][1];
				const nextStepY = foundPath[pathStep + 1][0];
				const nextStepX = foundPath[pathStep + 1][1];
				// We are using a good binary encounted value. 1, 2, 4 and 8 each are a single 1 in a binary
				// encoded number, so 0001 = 1, 0010 = 2, 0011 = 3, ..., 1000 = 8, ..., 1111 = 15
				const newValue =
					((prevStepY < curStepY || nextStepY < curStepY) ? BIT_NORTH : 0) +
					((prevStepX < curStepX || nextStepX < curStepX) ? BIT_EAST  : 0) +
					((prevStepY > curStepY || nextStepY > curStepY) ? BIT_SOUTH : 0) +
					((prevStepX > curStepX || nextStepX > curStepX) ? BIT_WEST  : 0);
				// Since we use binary values, we can now use the binary OR to only add "directions" to the
				// corridor block we are looking at. So, if there already was a corridor going
				// left <-> right from a previous path, and now we are going top <-> left, we want the
				// corridor to be a T rossing top-left-right.
				// Binary OR sets any given bit in the combined number 1 if it is 1 in either of the
				// individual numbers.
				// tslint:disable-next-line: no-bitwise
				this.blocksUsed[curStepY][curStepX] = this.blocksUsed[curStepY][curStepX] | newValue;
			}

			// We add the opening to the list of visited openings only if it isn't in it already. Since
			// we are creating a new array for each opening we look at, we need to compare content instead
			// of simple equality of opening === target (that would never hold)
			const entryPosition = visitedOpenings.findIndex((opening) => {
				return opening.every((_value, index) => opening[index] === target[index]);
			});
			// If findIndex doesn't find anything, it'll be -1
			if (entryPosition === -1) {
				visitedOpenings.push(target);
				targetOpenings.splice(targetOpeningIndex, 1);
			}
		}
	}

	private drawTilesForPaths() {
		for (let blockY = 0; blockY < this.dungeonBlocksY; blockY++) {
			for (let blockX = 0; blockX < this.dungeonBlocksX; blockX++) {
				if (this.blocksUsed[blockY][blockX]) {
					const corridorLayoutId = this.blocksUsed[blockY][blockX] as keyof typeof CORRIDOR_LAYOUTS;
					const blockLayout = CORRIDOR_LAYOUTS[corridorLayoutId];
					for (let y = 0; y < BLOCK_SIZE; y++) {
						for (let x = 0; x < BLOCK_SIZE; x++) {
							const tileY = blockY * BLOCK_SIZE + y;
							const tileX = blockX * BLOCK_SIZE + x;
							this.combinedLayout[tileY][tileX] = blockLayout[y][x];
						}
					}
				}
			}
		}
	}

	private getStartRoomCameraOffsets() {
		const [startRoomBlockY, startRoomBlockX] = this.roomOffsets[this.startRoomIndex];
		const startRoomHeight = this.rooms[this.startRoomIndex].layout.length * TILE_HEIGHT;
		const startRoomWidth = this.rooms[this.startRoomIndex].layout[0].length * TILE_WIDTH;
		return [
			startRoomBlockX * BLOCK_SIZE * TILE_WIDTH + (startRoomWidth / 2),
			startRoomBlockY * BLOCK_SIZE * TILE_HEIGHT + (startRoomHeight / 2)
		];
	}
}
