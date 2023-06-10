import { games } from '$db/games';

export async function POST({ request }) {
	const body = await request.json();

	console.log(body);

	return new Response(JSON.stringify({ message: 'Success!' }), { status: 201 });
}
