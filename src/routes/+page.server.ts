
import { listFiles } from '$lib/files';

export async function load() {
	const files = await listFiles('/thefiles');
	return {
		files
	};
}
