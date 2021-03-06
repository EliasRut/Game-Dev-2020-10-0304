import DungeonLevel from './DungeonLevel';

// This class handles the completeness of the dungeon, so all levels + their metadata.
export default class Dungeon {
	levels: {[name: string]: DungeonLevel} = {};
}