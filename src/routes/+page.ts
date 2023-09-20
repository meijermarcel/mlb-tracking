import { Game, GameTeam, MemberStanding } from '$lib/types';
import axios from 'axios';
import cheerio from 'cheerio';
import { members } from '$lib/global-var';

let standings: MemberStanding[] = [];

const url = 'https://www.foxsports.com/mlb/standings';
// export const load = (async ({ fetch, params }) => {
// 	return { members: standings };
// }) satisfies Standings;

// function to reset standings
const resetStandings = () => {
	standings = [
		new MemberStanding('Marcel'),
		new MemberStanding('Nate'),
		new MemberStanding('Bob'),
		new MemberStanding('Tom'),
		new MemberStanding('Carter')
	];
};

const capitalize = (s: string) => {
	if (typeof s !== 'string') return '';
	return s.charAt(0).toUpperCase() + s.slice(1);
};

const getTeamName = (team: string) => {
	const teamSplit = team.split(' ');
	let sanitized = '';
	if (teamSplit.length === 2) {
		sanitized = capitalize(teamSplit[0].trim().toLowerCase());
	} else if (teamSplit.length === 3) {
		sanitized =
			capitalize(teamSplit[0].trim().toLowerCase()) +
			' ' +
			capitalize(teamSplit[1].trim().toLowerCase());
	}

	return sanitized;
};

const shouldShowScore = (game: Game) => {
	if (game.status.toLowerCase().includes('final')) {
		return true;
	}
	return false;
};

export const load = async () => {
	resetStandings();

	return axios.get(url).then((response) => {
		// Load HTML we fetched in the previous line
		const $ = cheerio.load(response.data);

		const listItems = $('tbody > tr');

		listItems.each((index, element) => {
			const team = $(element).find('td').eq(1).text();
			const record = $(element).find('td').eq(2).text();
			const runsScored = parseInt($(element).find('td').eq(7).text());
			const diff = parseInt($(element).find('td').eq(9).text());

			// get img src from team
			const teamImg = $(element).find('td').eq(1).find('img').attr('src');

			// remove leading and trailing whitespace from team name
			const teamSanitized = team.trim().split('\n')[0];
			// remove whitepsace from record
			const recordSanitized = record.replace(/\s/g, '');

			const split = recordSanitized.split('-');
			const wins = parseInt(split[0]);
			const losses = parseInt(split[1]);

			// console.log(teamSanitized, wins, losses);
			// find member that has this team
			const member = members.find((member) => member.teams.includes(teamSanitized));

			if (member) {
				// find member in standings list
				const memberStanding = standings.find((person) => person.name === member.name);
				if (memberStanding) {
					// add wins and losses to memberStanding
					memberStanding.wins += wins;
					memberStanding.losses += losses;
					memberStanding.runsScored += runsScored;
					memberStanding.diff += diff;
					// add team to memberStanding
					memberStanding.teams.push({
						name: teamSanitized,
						img: teamImg || '',
						wins,
						losses,
						runsScored: runsScored,
						diff: diff
					});
				}
			}
		});

		// sort standings by wins, total games
		standings.sort((a, b) => b.wins - a.wins || a.wins + a.losses - (b.wins + b.losses));

		// sort each member's teams by wins
		standings.forEach((member) => {
			member.teams.sort((a, b) => b.wins - a.wins);
		});

		// calculate games behind
		standings.forEach((member, index) => {
			if (index === 0) {
				member.gamesBehind = 0;
			} else {
				const leader = standings[0];
				member.gamesBehind = leader.wins - member.wins;
			}
		});

		return axios.get('https://www.foxsports.com/mlb/scores').then((response) => {
			const $ = cheerio.load(response.data);
			const listItems = $('.score-chip');

			listItems.each((index, element) => {
				const teamOne = $(element).find('.score-team-name.team').eq(0).text();
				const teamOneImg = $(element).find('.score-team-logo').eq(0).find('img').attr('src');

				const teamTwo = $(element).find('.score-team-name.team').eq(1).text();
				const teamTwoImg = $(element).find('.score-team-logo').eq(1).find('img').attr('src');

				const teamOneScore = $(element).find('.score-team-score').eq(0).text();
				const teamTwoScore = $(element).find('.score-team-score').eq(1).text();

				let statusText = $(element).find('.score-game-info').eq(0).find('span').text().trim();
				if (statusText === '-') {
					statusText = 'IN PROGRESS';
				} else if (statusText.includes('+') || statusText.includes('-')) {
					// split after first 8 characters
					statusText = 'SCHEDULED';
				}

				const teamOneSanitized = getTeamName(teamOne);
				const teamTwoSanitized = getTeamName(teamTwo);

				const game = new Game();
				game.awayTeam = new GameTeam(teamOneSanitized, '', teamOneImg);
				game.homeTeam = new GameTeam(teamTwoSanitized, '', teamTwoImg);
				game.awayTeam.score =
					teamOneScore && teamOneScore !== '-' ? parseInt(teamOneScore) : undefined;
				game.homeTeam.score =
					teamTwoScore && teamTwoScore !== '-' ? parseInt(teamTwoScore.trim()) : undefined;
				game.status = statusText;
				game.showScore = shouldShowScore(game);

				let awayOutcome = 'tbd';
				let homeOutcome = 'tbd';

				// if game is final, increment dailyWins and dailyLosses for each member
				if (game.status.toLowerCase().includes('final')) {
					if (game.awayTeam.score !== undefined && game.homeTeam.score !== undefined) {
						const awayTeamMember = standings.find((member) =>
							member.teams.find((team) => team.name === teamOneSanitized)
						);

						const homeTeamMember = standings.find((member) =>
							member.teams.find((team) => team.name === teamTwoSanitized)
						);

						if (awayTeamMember && homeTeamMember) {
							if (game.awayTeam.score > game.homeTeam.score) {
								awayTeamMember.dailyWins++;
								homeTeamMember.dailyLosses++;
								awayOutcome = 'win';
								homeOutcome = 'loss';
							} else {
								awayTeamMember.dailyLosses++;
								homeTeamMember.dailyWins++;
								awayOutcome = 'loss';
								homeOutcome = 'win';
							}
							if (awayTeamMember?.name === homeTeamMember?.name) {
								awayOutcome = 'win';
								homeOutcome = 'win';
								// decrement losses for member since a game is always a win when a member
								// has both teams
								awayTeamMember.dailyLosses--;
							}
						}
					}
				}

				// find away team member in standings
				const awayTeamMember = standings.find((member) =>
					member.teams.find((team) => team.name === teamOneSanitized)
				);
				if (awayTeamMember) {
					game.awayTeam.memberName = awayTeamMember.name;
					// create new game so we don't overwrite the original
					const awayGame = new Game();
					awayGame.awayTeam = game.awayTeam;
					awayGame.homeTeam = game.homeTeam;
					awayGame.status = game.status;
					awayGame.outcome = awayOutcome;
					awayGame.showScore = game.showScore;
					// find away team in member's teams
					awayTeamMember.gamesToday.push(awayGame);
				}

				// find home team in standings
				const homeTeamMember = standings.find((member) =>
					member.teams.find((team) => team.name === teamTwoSanitized)
				);
				if (homeTeamMember) {
					game.homeTeam.memberName = homeTeamMember.name;
					// if awayTeam member name is different than homeTeam member name
					if (awayTeamMember && awayTeamMember.name !== homeTeamMember.name) {
						game.outcome = homeOutcome;
						// find home team in member's teams
						homeTeamMember.gamesToday.push(JSON.parse(JSON.stringify(game)));
					} else if (awayTeamMember && game.outcome === 'loss') {
						// if member has both away and home team, find game in awayTeam member's gamesToday and set outcome to win
						awayTeamMember.gamesToday.forEach((game) => {
							if (game.awayTeam.name === teamTwoSanitized) {
								game.outcome = 'win';
							}
						});
					}
				}
			});

			return { members: standings };
		});
	});
};
