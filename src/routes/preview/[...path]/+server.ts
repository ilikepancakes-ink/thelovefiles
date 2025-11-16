import { createReadStream, stat } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { Stats } from 'fs';
import mime from 'mime';
import { sanitizePath } from '$lib/security';

interface Params {
	path: string;
}

export async function GET({ params }: { params: Params }) {
	const filePath = sanitizePath(params.path);
	if (!filePath) {
		return new Response('Invalid path', { status: 400 });
	}

	try {
		const stats: Stats = await new Promise((resolve, reject) => {
			stat(filePath, (err, stats) => {
				if (err) reject(err);
				else resolve(stats);
			});
		});

		if (stats.isFile()) {
			const mimeType = mime.getType(filePath) || 'application/octet-stream';
			const fileStream = createReadStream(filePath);
			const response = new Response(fileStream as any, {
				headers: {
					'Content-Type': mimeType,
					'Content-Length': stats.size.toString()
				}
			});
			return response;
		} else {
			return new Response('Not a file', { status: 404 });
		}
	} catch (error) {
		console.error('Error serving file:', error);
		return new Response('File not found', { status: 404 });
	}
};
