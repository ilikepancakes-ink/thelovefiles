import archiver from 'archiver';
import { createReadStream, stat } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET() {
	try {
		const archive = archiver('zip', {
			zlib: { level: 9 } // Best compression
		});

		const streams: NodeJS.ReadableStream[] = [];
		archive.on('error', (err) => {
			throw err;
		});

		// Function to add directory to archive
		async function addToArchive(dirPath: string, basePath: string = dirPath) {
			const files = await readdir(dirPath);
			for (const file of files) {
				const filePath = path.join(dirPath, file);
				try {
					const fileStat = await new Promise<any>((resolve, reject) => {
						stat(filePath, (err, stats) => {
							if (err) reject(err);
							else resolve(stats);
						});
					});
					if (fileStat.isFile()) {
						const stream = createReadStream(filePath);
						streams.push(stream);
						archive.file(filePath, { name: path.relative(basePath, filePath) });
					} else if (fileStat.isDirectory()) {
						archive.directory(filePath, path.relative(basePath, filePath));
						await addToArchive(filePath, basePath);
					}
				} catch (error) {
					console.error(`Error adding ${filePath}:`, error);
				}
			}
		}

		await addToArchive(path.join(process.cwd(), 'thefiles'));

		const response = new Response(archive as any, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': 'attachment; filename="all_files.zip"'
			}
		});

		return response;
	} catch (error) {
		console.error('Error creating zip:', error);
		return new Response('Error creating zip', { status: 500 });
	}
}
