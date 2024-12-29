import { Action } from "../Action";
import { Game } from "../Game";
import { Player } from "../Player";
import { PublicGameState } from "../PublicGameState";

export default class Challenger extends Player {
	constructor() {
		super();
	}

	public takeAction(gameHistory: PublicGameState[]): Action {
		// An action with no cards played is equivalent to a challenge
		let action: Action = {
			cardIndicesPlayed: [],
		};

		return action;
	}
}
