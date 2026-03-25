export const teamColors: Record<string, string> = {
	// AL East
	'Orioles': '#DF4601',
	'Red Sox': '#BD3039',
	'Yankees': '#003087',
	'Rays': '#092C5C',
	'Blue Jays': '#134A8E',

	// AL Central
	'White Sox': '#27251F',
	'Guardians': '#00385D',
	'Tigers': '#0C2340',
	'Royals': '#004687',
	'Twins': '#002B5C',

	// AL West
	'Astros': '#002D62',
	'Angels': '#BA0021',
	'Athletics': '#003831',
	'Mariners': '#0C2C56',
	'Rangers': '#003278',

	// NL East
	'Braves': '#CE1141',
	'Mets': '#002D72',
	'Phillies': '#E81828',
	'Marlins': '#00A3E0',
	'Nationals': '#AB0003',

	// NL Central
	'Cubs': '#0E3386',
	'Brewers': '#12284B',
	'Cardinals': '#C41E3A',
	'Pirates': '#27251F',
	'Reds': '#C6011F',

	// NL West
	'Dodgers': '#005A9C',
	'Padres': '#2F241D',
	'Giants': '#FD5A1E',
	'Diamondbacks': '#A71930',
	'Rockies': '#33006F'
};

export function getTeamColor(teamName: string): string {
	return teamColors[teamName] || '#888888';
}
