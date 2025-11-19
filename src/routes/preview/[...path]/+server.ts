import { createReadStream, stat } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { Stats } from 'fs';
import mime from 'mime';
import { sanitizePath } from '$lib/security';
import { spawn } from 'child_process';

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
			if (mimeType.startsWith('video/')) {
				// Generate thumbnail for video
				const thumbnailPath = filePath + '.thumbnail.jpg';
				try {
					await new Promise<void>((resolve, reject) => {
						const ffmpeg = spawn('ffmpeg', ['-i', filePath, '-frames:v', '1', '-q:v', '2', thumbnailPath]);
						ffmpeg.on('close', (code) => {
							if (code === 0) resolve();
							else reject(new Error('ffmpeg failed'));
						});
					});
					// Serve thumbnail
					const thumbnailStats: Stats = await new Promise((resolve, reject) => {
						stat(thumbnailPath, (err, stats) => {
							if (err) reject(err);
							else resolve(stats);
						});
					});
					const thumbnailStream = createReadStream(thumbnailPath);
					const response = new Response(thumbnailStream as any, {
						headers: {
							'Content-Type': 'image/jpeg',
							'Content-Length': thumbnailStats.size.toString()
						}
					});
					return response;
				} catch (error) {
					// Fallback to serving the video
					console.log('Failed to generate thumbnail:', error);
				}
			}
			// Serve original file
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
