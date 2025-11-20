import { randomBytes } from 'crypto';
import { fail, type RequestEvent } from '@sveltejs/kit';
import { addSubmission } from '$lib/db';
import path from 'path';
import { promises as fs } from 'fs';

const chunkStore = new Map<string, { chunks: Buffer[], fileName: string, totalChunks: number }>();

export async function POST({ request }: RequestEvent) {
	try {
		const formData = await request.formData();
		const chunk = formData.get('chunk') as Blob | null;
		const uploadId = formData.get('uploadId') as string;
		const chunkIndex = parseInt(formData.get('chunkIndex') as string);
		const totalChunks = parseInt(formData.get('totalChunks') as string);
		const fileName = formData.get('fileName') as string;

		if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Initialize chunk storage for this upload
		if (!chunkStore.has(uploadId)) {
			chunkStore.set(uploadId, { chunks: new Array(totalChunks), fileName, totalChunks });
		}

		const uploadData = chunkStore.get(uploadId)!;
		if (uploadData.totalChunks !== totalChunks) {
			return fail(400, { error: 'Total chunks mismatch' });
		}

		// Store the chunk
		uploadData.chunks[chunkIndex] = Buffer.from(await chunk.arrayBuffer());

		// Check if all chunks are received
		const allChunksReceived = uploadData.chunks.every(c => c !== undefined);

		if (allChunksReceived) {
			// Generate hash and assemble file
			const hash = randomBytes(16).toString('hex');

			const tempDir = path.join(process.cwd(), 'thefiles', 'temp');
			await fs.mkdir(tempDir, { recursive: true });

			// Combine all chunks
			const combinedBuffer = Buffer.concat(uploadData.chunks);

			const tempPath = path.join(tempDir, uploadData.fileName || hash);
			await fs.writeFile(tempPath, combinedBuffer);

			// Store submission in database
			await addSubmission(hash, 'file');

			// Clean up chunk data
			chunkStore.delete(uploadId);

			return new Response(JSON.stringify({ hash, success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			// Acknowledge chunk received, but not complete yet
			return new Response(JSON.stringify({ chunkReceived: chunkIndex }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	} catch (error) {
		console.error('Error in chunk POST:', error);
		return fail(500, { error: 'Internal server error' });
	}
}
