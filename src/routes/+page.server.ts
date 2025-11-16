
import { listDirectory } from '$lib/files';

export async function load({ url }) {
	const dir = url.searchParams.get('dir') || '';
	const dirPath = dir ? `./thefiles/${dir}` : './thefiles';
	const files = await listDirectory(dirPath, './thefiles');
	return {
		files,
		currentDir: dir
	};
}
