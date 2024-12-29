import { Action } from "./Action";
import { Card } from "./Hand";

export type PublicPlayer = {
	playerId: string;
	currentChamber: number;
	cardsInHand: number;
	isDead: boolean;
};

export type PublicGameState = {
	players: PublicPlayer[];
	action: Action;
	table: Card;
};
