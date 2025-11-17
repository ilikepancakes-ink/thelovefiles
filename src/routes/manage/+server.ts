import { getPendingSubmissions, getSubmission, approveSubmission, denySubmission } from '$lib/db';
import type { RequestEvent } from './$types';
import { listDirectory } from '$lib/files';
import { rename } from 'fs/promises';
import path from 'path';
import { sanitizePath, verifyAdminAuth, isValidDirectory } from '$lib/security';

export async function GET(event: RequestEvent) {
	// This would be the admin dashboard - but for now we'll handle everything in the page
	return new Response('Use the web interface', { status: 200 });
}

export async function POST(event: RequestEvent) {
	try {
		const url = new URL(event.request.url);
		const action = url.searchParams.get('action');

		if (action === 'authorize') {
			const { password } = await event.request.json();
			console.log('Authorize attempt. Password provided. Process.env.PASS:', process.env.PASS);
			const tokenValue = 'admin-session-' + (process.env.PASS || '');
			console.log('Token to set:', tokenValue);
			if (password === process.env.PASS) {
				// Simple auth - in production use proper sessions
				const isSecure = event.url.protocol === 'https:';
				return new Response(JSON.stringify({
					authorized: true
				}), {
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Set-Cookie': `adminSessionToken=${tokenValue}; HttpOnly; Path=/; Max-Age=3600${isSecure ? '; Secure' : ''}; SameSite=Lax`
					}
				});
			} else {
				console.log('Password mismatch');
				return new Response(JSON.stringify({ error: 'Invalid password' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// Check authentication for all other actions
		if (!verifyAdminAuth(event)) {
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
			const { hash } = await event.request.json();
			const submission = await getSubmission(hash);
			return new Response(JSON.stringify({ submission }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'approve') {
			const { hash, directory } = await event.request.json();
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
			const { hash } = await event.request.json();
			await denySubmission(hash);
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'list_files') {
			const { directory } = await event.request.json();
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
		} else if (action === 'list_directories') {
			// Lists subdirectories of thefiles
			const baseDir = sanitizePath('') || 'thefiles';
			const allFiles = await listDirectory(baseDir);
			// Filter for directories only
			const directories = allFiles
				.filter((item: any) => item.type === 'directory')
				.map((item: any) => item.name);
			return new Response(JSON.stringify({ directories }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else if (action === 'rename_file') {
			const { directory, oldName, newName } = await event.request.json();
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
