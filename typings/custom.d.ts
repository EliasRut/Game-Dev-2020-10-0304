import { AbilityType } from "../src/scripts/abilities/abilityData";

export type NpcScriptStep = ScriptWait | ScriptAnimation | ScriptMove | ScriptWalk;

export interface NpcScript {
	repeat: number;
	steps: NpcScriptStep [];
}

export interface NpcOptions {
	script?: NpcScript;
	questGiverId?: string;
	traderId?: string;
}

export interface NpcPositioning extends NpcOptions {
	type: string;
	id: string;
	x: number;
	y: number;
	facingX?: number;
	facingY?: number;
}

export interface MapConnection {
  x: number;
  y: number;
	targetScene?: string;
  targetMap?: string;
  targetRoom?: string;
  targetX?: number;
  targetY?: number;
}

export interface ItemsPositioning {
	id: string;
	x: number;
	y: number;
}

export interface Door {
	id: string;
	x: number;
	y: number;
	type: string;
	open: boolean;
}

export type OpeningDirection = "top" | "left" | "right" | "bottom";
export type Opening = [number, number, OpeningDirection];

export interface ScriptWait {
	type: "wait";
	time: number
}

export interface ScriptCondition {
	type: "condition";
	conditionType: "hasItem" | "scriptState";
	itemId?: string;
	scriptId?: string;
	scriptState?: "new" | "finished";
}

export interface ScriptPausedCondition {
	type: "pauseUntilCondition";
	itemIds?: string[];
	itemQuantities?: number[];
	questIds?: string[];
	questStates?: ('started' | 'notStarted' | 'startedOrFinished' | 'finished' | 'notFinished')[];
	roomName?: string;
}

export interface ScriptDialog {
	type: "dialog";
	portrait: string;
	text: string[];
}

export interface ScriptAnimation {
	type: "animation";
	target?: string;
	animation: string;
	duration: number;
}

export interface ScriptCast {
	type: "cast";
	ability: AbilityType;
}

export interface ScriptMove {
	type: "move";
	target?: string;
	posX: number;
	posY: number;
	facingX: number; //-1, 0, 1
	facingY: number; //-1, 0, 1
}

export interface ScriptWalk {
	type: "walk";
	target?: string;
	posX: number;
	posY: number;
}

export interface ScriptSpawn {
	facingX?: number;
	facingY?: number;
	type: "spawn";
	npcId: string;
	npcType: string;
	posX: number;
	posY: number;
}

export interface ScriptOpenDoor {
	type: "openDoor";
	doorId: string;
}

export interface ScriptSceneChange {
	type: "sceneChange";
	target: string;
}

export interface ScriptFadeIn {
	type: "fadeIn";
	time: number;
}

export interface ScriptFadeOut {
	type: "fadeOut";
	time: number;
}

export interface ScriptTakeItem {
	type: "takeItem";
	itemId: string;
	amount: number;
}

export interface ScriptPlaceItem {
	type: "placeItem";
	itemId: string;
	posX: number;
	posY: number;
}

export interface ScriptSetScriptState {
	type: "setScriptState";
	scriptId: string;
	scriptState: "new" | "finished";
}

export interface ScriptQuestState {
	type: "setQuestState";
	questId: string;
	questState: "new" | "finished";
}

export type ScriptEntry = ScriptWait | ScriptDialog | ScriptAnimation | ScriptSceneChange |
	ScriptFadeIn | ScriptFadeOut | ScriptMove | ScriptWalk | ScriptSpawn | ScriptOpenDoor |
	ScriptCondition | ScriptSetScriptState | ScriptTakeItem | ScriptCast | ScriptPlaceItem |
	ScriptPausedCondition | ScriptQuestState;

export interface Scripting {
	onEntry?: ScriptEntry[];
	onExit?: ScriptEntry[];
	onClear?: ScriptEntry[];
	onProximity?: {
		x: number;
		y: number;
		radius: number;
		steps: ScriptEntry[];
	}
}

export interface DatabaseRoom {
	startRoom?: boolean;
	tileset: string; 
	decorationTileset?: string; 
	overlayTileset?: string; 
	layout: string; //The first 32 (0-31) tiles of the tileset are colliding; 
	decorations: string; //The first 32 (0-31) tiles of the tileset are colliding; 
	overlays: string; //The first 32 (0-31) tiles of the tileset are colliding; 
	overlay?: string;
	npcs?: NpcPositioning[]; //place npcs in room
	connections?: MapConnection[];
	items?: ItemsPositioning[];
	openings: Opening[];
	name: string;
	scripts: Scripting;
	usedNpcTypes?: string[];
	doors?: Door[];
}


export interface Room {
	startRoom?: boolean;
	tileset: string; 
	decorationTileset?: string; 
	overlayTileset?: string; 
	layout: number[][]; //The first 32 (0-31) tiles of the tileset are colliding; 
	decorations?: number[][]; //The first 32 (0-31) tiles of the tileset are colliding; 
	overlays?: number[][]; //The first 32 (0-31) tiles of the tileset are colliding; 
	overlay?: number[][];
	npcs?: NpcPositioning[]; //place npcs in room
	connections?: MapConnection[];
	items?: ItemsPositioning[];
	openings: Opening[];
	name: string;
	scripts: Scripting;
	usedNpcTypes?: string[];
	doors?: Door[];
}

export interface Weapon {
	itemgroup: string;
	abilities: string[];
	tile: number[][];
}