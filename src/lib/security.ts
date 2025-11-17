import path from 'path';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Sanitizes a file path to prevent directory traversal attacks
 * @param requestedPath The path requested by the user
 * @param baseDir The base directory (defaults to 'thefiles')
 * @returns The sanitized absolute path, or null if invalid
 */
export function sanitizePath(requestedPath: string, baseDir: string = 'thefiles'): string | null {
	try {
		// Resolve the full path
		const fullPath = path.resolve(process.cwd(), baseDir, requestedPath);

		// Ensure the resolved path is within the base directory
		const basePath = path.resolve(process.cwd(), baseDir);
		const relative = path.relative(basePath, fullPath);

		// Check if the resolved path is still within the base directory
		if (relative.startsWith('..') || path.isAbsolute(relative)) {
			return null;
		}

		return fullPath;
	} catch (error) {
		console.error('Path sanitization error:', error);
		return null;
	}
}

/**
 * Verifies admin authentication from request cookies
 */
export function verifyAdminAuth(event: RequestEvent): boolean {
	const token = event.cookies.get('adminSessionToken');
	const expected = 'admin-session-' + (process.env.PASS || '');
	console.log('Verifying admin auth. Token:', token, 'Expected:', expected, 'Match:', token === expected);
	if (!token) {
		console.log('No token found');
		return false;
	}
	// Simple check - in production use proper JWT or session tokens
	const isValid = token === expected;
	console.log('Is valid:', isValid);
	return isValid;
}

/**
 * Validates directory names to ensure they are safe
 */
export function isValidDirectory(dir: string): boolean {
	// Allow only alphanumeric, dash, underscore, and forward slash
	const safePattern = /^[a-zA-Z0-9\-_\/]*$/;
	return safePattern.test(dir) && !dir.includes('..');
}
