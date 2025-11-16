import { createReadStream, stat } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { Stats } from 'fs';

interface Params {
	path: string;
}

export async function GET({ params }: { params: Params }) {
	const filePath = path.join('/thefiles', params.path);

	try {
		const stats: Stats = await new Promise((resolve, reject) => {
			stat(filePath, (err, stats) => {
				if (err) reject(err);
				else resolve(stats);
			});
		});

		if (stats.isFile()) {
			const fileStream = createReadStream(filePath);
			const response = new Response(fileStream as any, {
				headers: {
					'Content-Type': 'application/octet-stream',
					'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
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
