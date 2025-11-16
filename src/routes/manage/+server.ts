import { getPendingSubmissions, getSubmission, approveSubmission, denySubmission } from '$lib/db';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { env } from '$env/dynamic/private';

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
					// In production, return a session token
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				return fail(401, { error: 'Invalid password' });
			}
		} else if (action === 'get_pending') {
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
			await approveSubmission(hash, directory); // TODO: implement actual file transfer
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
		}

		return fail(400, { error: 'Unknown action' });
	} catch (error) {
		console.error('Error in manage POST:', error);
		return fail(500, { error: 'Internal server error' });
	}
}
