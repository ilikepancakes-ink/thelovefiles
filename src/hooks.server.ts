// Simple rate limiting using Map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // requests per window

function isRateLimited(clientIP: string): boolean {
	const now = Date.now();
	const clientData = rateLimitMap.get(clientIP);

	if (!clientData) {
		rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return false;
	}

	if (now > clientData.resetTime) {
		rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return false;
	}

	if (clientData.count >= MAX_REQUESTS) {
		return true;
	}

	clientData.count++;
	return false;
}

export const handle = async ({ event, resolve }) => {
	// Basic rate limiting
	const clientIP = event.getClientAddress() || 'unknown';
	if (isRateLimited(clientIP)) {
		return new Response('Rate limit exceeded', {
			status: 429,
			headers: {
				'Retry-After': '60'
			}
		});
	}

	const response = await resolve(event);

	// Add security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	return response;
};
