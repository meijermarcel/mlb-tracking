import { json } from '@sveltejs/kit';
import axios from 'axios';
import cheerio from 'cheerio';
import { members } from '$lib/global-var';
import { MemberStanding } from '$lib/types';
import { membersAndRecords } from '$db/membersAndRecords';

let standings: MemberStanding[] = [];

const url = 'https://www.foxsports.com/mlb/standings';

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

export async function GET() {
	resetStandings();

	const response = await axios.get(url);
	// Load HTML we fetched in the previous line
	const $ = await cheerio.load(response.data);

	const listItems = $('tbody > tr');

	listItems.each((index, element) => {
		const team = $(element).find('td').eq(1).text();
		const record = $(element).find('td').eq(2).text();
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
			}
		}
	});

	const current_date = new Date();

	const memberData = standings.map((standing) => {
		return {
			name: standing.name,
			records: [
				{
					wins: standing.wins,
					losses: standing.losses,
					date_time: current_date
				}
			]
		};
	});

	for (const member of memberData) {
		// check if member exists in db
		const result = await membersAndRecords.findOne({ name: member.name });
		if (result) {
			// member exists, update records
			await membersAndRecords.updateOne(
				{ name: member.name },
				{ $push: { records: member.records[0] } }
			);
		} else {
			// member does not exist, insert member
			await membersAndRecords.insertOne(member);
		}
	}

	return json(memberData);
}
