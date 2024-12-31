// min and max inclusive
export function getRandomNumber(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

// Remove the import entirely; dependencies are now global
export function processImports(fileText: string): string {
	return fileText.replace(/import\s+{?\s*([\w\s,]+)\s*}?\s+from\s+['"].+?['"];/g, (match, imports) => {
		return "";
	});
}

export function captureConsoleLog(callback: () => void): string {
	let capturedLogs = ""; // String to store the captured logs

	// Save the original console.log function
	const originalConsoleLog = console.log;

	// Override console.log
	console.log = (...args: any[]) => {
		// Append the log arguments to the captured logs
		capturedLogs += args.map((arg) => String(arg)).join(" ") + "\n";
	};

	try {
		// Execute the callback where logs will be captured
		callback();
	} finally {
		// Restore the original console.log function
		console.log = originalConsoleLog;
	}

	return capturedLogs; // Return the captured logs as a string
}
