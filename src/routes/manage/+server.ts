import { getPendingSubmissions, getSubmission, approveSubmission, denySubmission } from '$lib/db';
import type { RequestEvent } from './$types';
import { env } from '$env/dynamic/private';
import { listDirectory } from '$lib/files';
import { rename } from 'fs/promises';
import path from 'path';
import { sanitizePath, verifyAdminAuth, isValidDirectory } from '$lib/security';

export async function GET({ request }: RequestEvent) {
	// This would be the admin dashboard - but for now we'll handle everything in the page
	return new Response('Use the web interface', { status: 200 });
}

export async function POST({ request }: RequestEvent) {
	try {
		const url = new URL(request.url);
		const action = url.searchParams.get('action');

		if (action === 'authorize') {
			const { password } = await request.json();
			if (password === env.MANAGE_PASSWORD) {
				// Simple auth - in production use proper sessions
				return new Response(JSON.stringify({
					authorized: true,
					sessionToken: 'admin-session-' + env.MANAGE_PASSWORD
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				return new Response(JSON.stringify({ error: 'Invalid password' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// Check authentication for all other actions
		if (!verifyAdminAuth(request)) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		if (action === 'get_pending') {
			const pendingSubmissions = await getPendingSubmissions();
			return new Response(JSON.stringify({ submissions: pendingSubmissions }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'get_submission') {
			const { hash } = await request.json();
			const submission = await getSubmission(hash);
			return new Response(JSON.stringify({ submission }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'approve') {
			const { hash, directory } = await request.json();
			// Validate directory
			if (!isValidDirectory(directory)) {
				return new Response(JSON.stringify({ error: 'Invalid directory' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			await approveSubmission(hash, 'thefiles/' + directory);
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'deny') {
			const { hash } = await request.json();
			await denySubmission(hash);
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'list_files') {
			const { directory } = await request.json();
			// Validate directory
			if (directory && !isValidDirectory(directory)) {
				return new Response(JSON.stringify({ error: 'Invalid directory' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const dirPath = sanitizePath(directory || '');
			if (!dirPath) {
				return new Response(JSON.stringify({ error: 'Invalid directory path' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const files = await listDirectory(dirPath);
			return new Response(JSON.stringify({ files }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'rename_file') {
			const { directory, oldName, newName } = await request.json();
			// Validate inputs
			if (!isValidDirectory(directory) || oldName.includes('..') || newName.includes('..')) {
				return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const dirPath = sanitizePath(directory || '');
			if (!dirPath) {
				return new Response(JSON.stringify({ error: 'Invalid directory path' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const oldPath = path.resolve(dirPath, oldName);
			const newPath = path.resolve(dirPath, newName);
			await rename(oldPath, newPath);
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response(JSON.stringify({ error: 'Unknown action' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error in manage POST:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
