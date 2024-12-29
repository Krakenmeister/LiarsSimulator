import { Action } from "../Action";
import { Game } from "../Game";
import { Card, Hand } from "../Hand";
import { Player } from "../Player";
import { PublicGameState, PublicPlayer } from "../PublicGameState";

export default class Example extends Player {
	constructor() {
		super();
	}

	public takeAction(gameHistory: PublicGameState[]): Action {
		// Game history is a chronologically-ordered array of each turn's public information over the course of the entire game (all rounds included)
		let lastState: PublicGameState = gameHistory[gameHistory.length - 1];

		// Each state has the current tabled/safe card
		let tableCard: Card = lastState.table;

		// Each state has the action that player took
		// This gets how many cards they played (the values of the card indices are meaningless to you)
		let cardsPlayed: number = lastState.action.cardIndicesPlayed.length;

		// Each state has an ordered array of all the players at the table
		// The first entry of the array is always the player that took the action
		let previousPlayer: PublicPlayer = lastState.players[0];

		// Get other public information about players
		let previousPlayerHandSize: number = previousPlayer.cardsInHand; // How many cards the previous player has (after putting down their cards)
		let previousPlayerChamber: number = previousPlayer.currentChamber; // How many rounds the previous player has fired
		let previousPlayerId: string = previousPlayer.playerId; // Consistent ID so you can more easily determine a opponent's playstyle

		// Note that the player array will include players that are dead or out of cards
		// The ordering of the array is equivalent to counter-clockwise around the table
		// So lastState.players[1] is the player that would is to the right of the previous player
		// This is normally you, but if there is a dead player in between you and the last actor they would be right there
		// As such, find the next player to act by searching through valid players
		let validPlayerCount: number = 0;
		let me: PublicPlayer;
		let nextPlayer: PublicPlayer;
		for (let i = 1; i < lastState.players.length; i++) {
			if (!lastState.players[i].isDead && lastState.players[i].cardsInHand > 0) {
				validPlayerCount++;
				if (validPlayerCount === 1) {
					me = lastState.players[i];
				} else if (validPlayerCount === 2) {
					nextPlayer = lastState.players[i];
				}
			}
		}
		if (validPlayerCount === 1) {
			// This would mean there's only one player that could possibly act (me)
			// In this case the action returned is ignored and the simulator forces a challenge
		}

		// An action with no cards played is equivalent to a challenge
		let challengeAction: Action = {
			cardIndicesPlayed: [],
		};

		// Retrieve the cards in hand like so
		let myHand: Hand = this.hand;

		// Example of playing all of the safe cards
		let safeCardIndices: number[] = [];
		for (let i = 0; i < this.hand.cards.length; i++) {
			if (this.hand.cards[i] === tableCard) {
				safeCardIndices.push(i);
			}
		}
		let allSafe: Action = {
			cardIndicesPlayed: safeCardIndices,
		};

		/*                  */
		/* Code goes below: */
		/*                  */

		/*                  */
		/*                  */
		/*                  */

		return challengeAction;
	}
}
