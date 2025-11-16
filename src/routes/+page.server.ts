
import { listDirectory } from '$lib/files';
import { sanitizePath } from '$lib/security';

export async function load({ url }: { url: URL }) {
	const dir = url.searchParams.get('dir') || '';
	const dirPath = sanitizePath(dir);
	if (!dirPath) {
		return {
			files: [],
			currentDir: '',
			error: 'Invalid directory'
		};
	}

	try {
		const files = await listDirectory(dirPath, './thefiles');
		return {
			files,
			currentDir: dir
		};
	} catch (error) {
		console.error('Error loading directory:', error);
		return {
			files: [],
			currentDir: dir,
			error: 'Failed to load directory'
		};
	}
}
