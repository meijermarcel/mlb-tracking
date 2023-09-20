import { StatField, Stats } from '$lib/types';
import axios from 'axios';
import cheerio from 'cheerio';
import { members } from '$lib/global-var';

let stats: Stats = new Stats();
const battingURL =
	'https://www.foxsports.com/mlb/team-stats?category=batting&season=2023&seasonType=reg';
const pitchingURL =
	'https://www.foxsports.com/mlb/team-stats?category=pitching&season=2023&seasonType=reg';

// function to reset standings
const resetStats = () => {
	stats = new Stats();
};

function findAndAddStat(stats: StatField[], memberName: string, statName: string, value: number) {
	const statField = stats.find((stat) => stat.name === statName);
	if (statField) {
		const memberStat = statField.members.find((member) => member.name === memberName);
		if (memberStat) {
			memberStat.value += value;
		}
	}
}

function averageStatField(stats: StatField[], name: string) {
	const statField = stats.find((stat) => stat.name === name);
	if (statField) {
		statField.members.forEach((member) => {
			member.value = parseFloat((member.value / 6).toFixed(3));
		});
	}
}

export const load = async () => {
	resetStats();

	return axios.get(battingURL).then((response) => {
		// Load HTML we fetched in the previous line
		const $ = cheerio.load(response.data);

		const listItems = $('tbody > tr');

		listItems.each((index, element) => {
			const team = $(element).find('td').eq(1).text();
			const hr = parseInt($(element).find('td').eq(9).text());
			const rbi = parseInt($(element).find('td').eq(10).text());
			const avg = parseFloat($(element).find('td').eq(15).text());
			const sb = parseFloat($(element).find('td').eq(11).text());
			const walks = parseFloat($(element).find('td').eq(13).text());
			const strikeouts = parseFloat($(element).find('td').eq(14).text());
			const obp = parseFloat($(element).find('td').eq(16).text());
			const slugging = parseFloat($(element).find('td').eq(17).text());
			const ops = parseFloat($(element).find('td').eq(18).text());

			// remove leading and trailing whitespace from team name
			const teamSanitized = team.trim().split('\n')[0];

			// find member that has this team
			const member = members.find((member) => member.teams.includes(teamSanitized));

			if (member) {
				findAndAddStat(stats.batting, member.name, 'Home Runs', hr);
				findAndAddStat(stats.batting, member.name, 'RBI', rbi);
				findAndAddStat(stats.batting, member.name, 'AVG', avg);
				findAndAddStat(stats.batting, member.name, 'Stolen Bases', sb);
				findAndAddStat(stats.batting, member.name, 'Walks', walks);
				findAndAddStat(stats.batting, member.name, 'Strikeouts', strikeouts);
				findAndAddStat(stats.batting, member.name, 'OBP', obp);
				findAndAddStat(stats.batting, member.name, 'Slugging', slugging);
				findAndAddStat(stats.batting, member.name, 'OPS', ops);
			}
		});

		// divide ops by 6 and round to 3 decimal places
		averageStatField(stats.batting, 'OPS');
		averageStatField(stats.batting, 'AVG');
		averageStatField(stats.batting, 'Slugging');
		averageStatField(stats.batting, 'OBP');

		// sort all batting stats
		stats.batting.forEach((stat) => {
			if (stat.name === 'Strikeouts') {
				stat.members.sort((a, b) => a.value - b.value);
			} else {
				stat.members.sort((a, b) => b.value - a.value);
			}
		});

		return axios.get(pitchingURL).then((response) => {
			// Load HTML we fetched in the previous line
			const $ = cheerio.load(response.data);

			const listItems = $('tbody > tr');

			listItems.each((index, element) => {
				const team = $(element).find('td').eq(1).text();
				const wins = parseInt($(element).find('td').eq(3).text());
				const losses = parseInt($(element).find('td').eq(4).text());
				const era = parseInt($(element).find('td').eq(18).text());
				const saves = parseInt($(element).find('td').eq(9).text());
				const hits = parseInt($(element).find('td').eq(12).text());
				const hr = parseInt($(element).find('td').eq(15).text());
				const bb = parseInt($(element).find('td').eq(16).text());
				const strikeouts = parseInt($(element).find('td').eq(17).text());

				// remove leading and trailing whitespace from team name
				const teamSanitized = team.trim().split('\n')[0];
				// find member that has this team
				const member = members.find((member) => member.teams.includes(teamSanitized));

				if (member) {
					findAndAddStat(stats.pitching, member.name, 'Wins', wins);
					findAndAddStat(stats.pitching, member.name, 'Losses', losses);
					findAndAddStat(stats.pitching, member.name, 'ERA', era);
					findAndAddStat(stats.pitching, member.name, 'Saves', saves);
					findAndAddStat(stats.pitching, member.name, 'Hits', hits);
					findAndAddStat(stats.pitching, member.name, 'Home Runs', hr);
					findAndAddStat(stats.pitching, member.name, 'Walks', bb);
					findAndAddStat(stats.pitching, member.name, 'Strikeouts', strikeouts);
				}
			});

			averageStatField(stats.pitching, 'ERA');

			// sort all pitching stats
			stats.pitching.forEach((stat) => {
				if (stat.name === 'Wins' || stat.name === 'Saves' || stat.name === 'Strikeouts') {
					stat.members.sort((a, b) => b.value - a.value);
				} else {
					stat.members.sort((a, b) => a.value - b.value);
				}
			});

			// filter out any stats where members have a NaN value
			stats.batting = stats.batting.filter((stat) => {
				return stat.members.every((member) => {
					return !isNaN(member.value);
				});
			});

			stats.pitching = stats.pitching.filter((stat) => {
				return stat.members.every((member) => {
					return !isNaN(member.value);
				});
			});

			return {
				...stats
			};
		});
	});
};
