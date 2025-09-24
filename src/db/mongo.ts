import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

const client = new MongoClient(MONGODB_URI || 'mongodb://localhost:27017');

export function start_mongo() {
	console.log('Starting MongoDB...');
	return client.connect();
}

export default client.db('mlb');
