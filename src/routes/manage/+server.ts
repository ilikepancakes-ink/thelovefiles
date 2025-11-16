import { getPendingSubmissions, getSubmission, approveSubmission, denySubmission } from '$lib/db';
import { fail } from '@sveltejs/kit';
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
				return fail(401, { error: 'Invalid password' });
			}
		}

		// Check authentication for all other actions
		if (!verifyAdminAuth(request)) {
			return fail(401, { error: 'Unauthorized' });
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
				return fail(400, { error: 'Invalid directory' });
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
				return fail(400, { error: 'Invalid directory' });
			}
			const dirPath = sanitizePath(directory || '');
			if (!dirPath) {
				return fail(400, { error: 'Invalid directory path' });
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
				return fail(400, { error: 'Invalid parameters' });
			}
			const dirPath = sanitizePath(directory || '');
			if (!dirPath) {
				return fail(400, { error: 'Invalid directory path' });
			}
			const oldPath = path.resolve(dirPath, oldName);
			const newPath = path.resolve(dirPath, newName);
			await rename(oldPath, newPath);
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return fail(400, { error: 'Unknown action' });
	} catch (error) {
		console.error('Error in manage POST:', error);
		return fail(500, { error: 'Internal server error' });
	}
}
