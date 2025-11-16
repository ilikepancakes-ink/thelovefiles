import { randomBytes } from 'crypto';
import { fail } from '@sveltejs/kit';
import { addSubmission } from '$lib/db';
import type { RequestEvent } from './$types';

export async function POST({ request }: RequestEvent) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const text = formData.get('text') as string | null;

		if (!file && !text) {
			return fail(400, { error: 'No content provided' });
		}

		// Generate random hash for ID
		const hash = randomBytes(16).toString('hex');

		if (file) {
			// Store file submission in database
			await addSubmission(hash, 'file', file);
		} else if (text) {
			// Store text submission in database
			await addSubmission(hash, 'text', undefined, text);
		}

		return new Response(JSON.stringify({ hash, success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error in summit POST:', error);
		return fail(500, { error: 'Internal server error' });
	}
}
