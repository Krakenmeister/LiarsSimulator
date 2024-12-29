import { Action } from "../Action";
import { Game } from "../Game";
import { Card, Hand } from "../Hand";
import { Player } from "../Player";
import { PublicGameState, PublicPlayer } from "../PublicGameState";

export default class Truth extends Player {
	constructor() {
		super();
	}

	public takeAction(gameHistory: PublicGameState[]): Action {
		let lastState: PublicGameState = gameHistory[gameHistory.length - 1];
		let tableCard: Card = lastState.table;

		// Never lie, one card at a time
		let safeCardIndex: number = -1;
		for (let i = 0; i < this.hand.cards.length; i++) {
			if (this.hand.cards[i] === tableCard) {
				safeCardIndex = i;
			}
		}

		if (safeCardIndex > -1) {
			return { cardIndicesPlayed: [safeCardIndex] };
		}

		// Challenge if forced to
		return { cardIndicesPlayed: [] };
	}
}
