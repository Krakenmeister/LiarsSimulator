export type Action = {
	cardIndicesPlayed: number[];
};

export function actionToString(action: Action): string {
	if (action.cardIndicesPlayed.length == 0) {
		return "Challenge!";
	}

	let actionString: string = "Playing card";
	if (action.cardIndicesPlayed.length > 1) {
		actionString += "s ";
	} else {
		actionString += " ";
	}
	for (let cardIndex of action.cardIndicesPlayed) {
		actionString += cardIndex.toString();
		actionString += ", ";
	}

	return actionString.trim().slice(0, -1);
}
