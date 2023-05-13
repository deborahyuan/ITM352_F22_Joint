function calculateTimeDifference(start, end) {
	start = String(start);
	end = String(end);
	const startDate = new Date(
		parseInt("20" + start.substring(4, 6)),
		parseInt(start.substring(0, 2)) - 1,
		parseInt(start.substring(2, 4)),
		parseInt(start.substring(6, 8)),
		parseInt(start.substring(8, 10))
	);
	console.log(startDate);
	const endDate = new Date(
		parseInt("20" + end.substring(4, 6)),
		parseInt(end.substring(0, 2)) - 1,
		parseInt(end.substring(2, 4)),
		parseInt(end.substring(6, 8)),
		parseInt(end.substring(8, 10))
	);

	console.log(endDate);

	const timeDiff = endDate - startDate;

	let hours = timeDiff / (1000 * 60 * 60);

	if (hours >= 24) {
		hours += 24 * Math.floor(hours / 48);
	}
	const formattedHours = Number(hours.toFixed(2));

	return formattedHours;
}

results = calculateTimeDifference("0513231451", "0515230050");

console.log(results);
