import { readdir, stat } from 'fs/promises';
import path from 'path';

export interface FileItem {
	name: string;
	path: string;
	type: 'file' | 'directory';
	size?: number;
}

export async function listFiles(dirPath: string, basePath: string = dirPath): Promise<FileItem[]> {
	const items: FileItem[] = [];
	try {
		const files = await readdir(dirPath);
		for (const file of files) {
			const filePath = path.join(dirPath, file);
			const fileStat = await stat(filePath);
			items.push({
				name: file,
				path: path.relative(basePath, filePath),
				type: fileStat.isDirectory() ? 'directory' : 'file',
				size: fileStat.size
			});
			if (fileStat.isDirectory()) {
				// Recursively list subdirectories
				const subItems = await listFiles(filePath, basePath);
				items.push(...subItems);
			}
		}
	} catch (error) {
		console.error(`Error reading directory ${dirPath}:`, error);
	}
	return items;
}

export async function listDirectory(dirPath: string, basePath: string = dirPath): Promise<FileItem[]> {
	const items: FileItem[] = [];
	try {
		const files = await readdir(dirPath);
		for (const file of files) {
			const filePath = path.join(dirPath, file);
			const fileStat = await stat(filePath);
			items.push({
				name: file,
				path: path.relative(basePath, filePath),
				type: fileStat.isDirectory() ? 'directory' : 'file',
				size: fileStat.size
			});
		}
	} catch (error) {
		console.error(`Error reading directory ${dirPath}:`, error);
	}
	return items;
}
