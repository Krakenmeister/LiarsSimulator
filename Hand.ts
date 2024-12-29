export enum Card {
	Queen = "Q",
	King = "K",
	Ace = "A",
	Joker = "J",
}

export function tableToString(card: Card): string {
	switch (card) {
		case Card.Queen:
			return "Queen's Table";
		case Card.King:
			return "King's Table";
		case Card.Ace:
			return "Ace's Table";
	}
	return "Joker's Table?";
}

export class Hand {
	public cards: Card[];

	constructor() {
		this.cards = [];
	}

	public playCards(cardIndicesPlayed: number[]): Card[] {
		let cardsPlayed: Card[] = [];
		let newHand: Card[] = [];
		for (let handIndex: number = 0; handIndex < this.cards.length; handIndex++) {
			if (cardIndicesPlayed.includes(handIndex)) {
				cardsPlayed.push(this.cards[handIndex]);
			} else {
				newHand.push(this.cards[handIndex]);
			}
		}
		this.cards = newHand;
		return cardsPlayed;
	}

	public drawCard(newCard: Card) {
		this.cards.push(newCard);
	}

	public toString(): string {
		if (this.cards.length === 0) {
			return "Empty";
		}

		let handString: string = "";

		for (let card of this.cards) {
			handString += card.toString();
			handString += " ";
		}

		return handString.trim();
	}
}
