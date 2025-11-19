import { randomBytes } from 'crypto';
import { fail } from '@sveltejs/kit';
import { addSubmission } from '$lib/db';
import type { RequestEvent } from './$types';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST({ request }: RequestEvent) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const text = formData.get('text') as string | null;

		if (!file && !text) {
			return fail(400, { error: 'No content provided' });
		}

		if (file && file.size > 5 * 1024 * 1024 * 1024) { // 5 GB
			return fail(413, { error: 'File too large. Maximum size is 5 GB.' });
		}

		// Generate random hash for ID
		const hash = randomBytes(16).toString('hex');

		const tempDir = path.join(process.cwd(), 'thefiles', 'temp');
		await fs.mkdir(tempDir, { recursive: true });

		if (file) {
			// Store file submission in database and temp file
			await addSubmission(hash, 'file', file);
			const tempPath = path.join(tempDir, file.name || hash);
			const buffer = await file.arrayBuffer();
			await fs.writeFile(tempPath, Buffer.from(buffer));
		} else if (text) {
			// Store text submission in database and create temp text file
			await addSubmission(hash, 'text', undefined, text);
			const tempPath = path.join(tempDir, `${hash}.txt`);
			await fs.writeFile(tempPath, text);
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
