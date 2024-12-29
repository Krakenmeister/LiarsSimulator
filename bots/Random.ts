import { Action } from "../Action";
import { Game } from "../Game";
import { Player } from "../Player";
import { PublicGameState } from "../PublicGameState";

export default class Random extends Player {
	constructor() {
		super();
	}

	public takeAction(gameHistory: PublicGameState[]): Action {
		// Play the first card in your hand
		let action: Action = {
			cardIndicesPlayed: [0],
		};

		// Challenge 25% of the time
		if (Math.random() < 0.25) {
			action = { cardIndicesPlayed: [] };
		}

		return action;
	}
}
