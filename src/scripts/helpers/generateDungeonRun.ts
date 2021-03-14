import { DungeonLevelData, DungeonRunData } from '../models/DungeonRunData';
import { SecondaryContentBlock } from '../models/SecondaryContentBlock';
import { RuneAssignment } from './constants';
import ContentDataLibrary from './ContentDataLibrary';
import DungeonLevel from '../worldstate/DungeonLevel';

const CHANCE_FOR_MATCHING_SECONDARY_CONTENT = 0.5;

export const generateDungeonRun: (runes: RuneAssignment) => DungeonRunData = (runes) => {
	const matchingPrimaryContents = ContentDataLibrary.primaryContent
		.filter((primaryContent) => primaryContent.themes.includes(runes.primaryContent));
	const randomIndex = Math.floor(Math.random() * matchingPrimaryContents.length);
	const selectedPrimaryContent = matchingPrimaryContents[randomIndex];
	console.log(`--> Using primary block ${selectedPrimaryContent.title}`);

	const {
		lowerBoundOfSecondaryContentBlocks,
		upperBoundOfSecondaryContentBlocks
	} = selectedPrimaryContent;
	const numSecondaryContents = lowerBoundOfSecondaryContentBlocks + Math.floor(
		Math.random() * (upperBoundOfSecondaryContentBlocks - lowerBoundOfSecondaryContentBlocks + 1)
	);

	const secondaryContentBlocks: SecondaryContentBlock[] = [];
	const matchingSecondaryBlocks = ContentDataLibrary.secondaryContent
		.filter((secondaryContent) => secondaryContent.themes.includes(runes.secondaryContent));
	const nonMatchingSecondaryBlocks = ContentDataLibrary.secondaryContent
		.filter((secondaryContent) => !secondaryContent.themes.includes(runes.secondaryContent));
	for (let i = 0; i < numSecondaryContents; i++) {
		let usedSecondaryBlock: SecondaryContentBlock;
		if (Math.random() < CHANCE_FOR_MATCHING_SECONDARY_CONTENT) {
			const randomSecondaryIndex = Math.floor(Math.random() * matchingSecondaryBlocks.length);
			usedSecondaryBlock = matchingSecondaryBlocks.splice(randomSecondaryIndex, 1)[0];
			console.log(`--> Using matching secondary block ${usedSecondaryBlock.title}`);
		} else {
			const randomSecondaryIndex = Math.floor(Math.random() * nonMatchingSecondaryBlocks.length);
			usedSecondaryBlock = nonMatchingSecondaryBlocks.splice(randomSecondaryIndex, 1)[0];
			console.log(`--> Using non-matching secondary block ${usedSecondaryBlock.title}`);
		}
		secondaryContentBlocks.push(usedSecondaryBlock);
	}

	const secondaryContentRoomAssignment: {[level: number]: string[]} = {};
	secondaryContentBlocks.forEach((contentBlock) => {
		let firstFreeLevel = 0;
		for (let i = 0; i < contentBlock.rooms.length; i++) {
			const blocksLeftToPlace = contentBlock.rooms.length - i - 1;
			const roomMaxLevel = selectedPrimaryContent.dungeonLevels.length - blocksLeftToPlace;
			const randomLevel = firstFreeLevel  + Math.floor(
				(roomMaxLevel - firstFreeLevel) * Math.random());
			if (!secondaryContentRoomAssignment[randomLevel]) {
				secondaryContentRoomAssignment[randomLevel] = [];
			}
			secondaryContentRoomAssignment[randomLevel].push(...contentBlock.rooms[i]);
			firstFreeLevel = randomLevel + 1;
		}
	});

	const levels: DungeonLevelData[] = selectedPrimaryContent.dungeonLevels.map(
		(dungeonLevel, level) => ({
			title: dungeonLevel.title,
			style: dungeonLevel.style,
			rooms: [
				...dungeonLevel.rooms,
				...(secondaryContentRoomAssignment[level] || [])
			]
	}));

	return {
		levels,
		buff: runes.playerBuff
	};
};