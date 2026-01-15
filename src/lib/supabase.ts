import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
	!supabaseUrl || !supabaseAnonKey
		? 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'
		: null;

export const isSupabaseConfigured = supabaseConfigError === null;

const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co';
const resolvedAnonKey = supabaseAnonKey || 'placeholder-key';

function safeUrlString(input: RequestInfo | URL): string {
	try {
		if (typeof input === 'string') return input;
		if (input instanceof URL) return input.toString();
		if (input instanceof Request) return input.url;
		return String(input);
	} catch {
		return '';
	}
}

async function loggingFetch(input: RequestInfo | URL, init?: RequestInit) {
	const response = await fetch(input, init);

	if (!response.ok) {
		const url = safeUrlString(input);
		let path = url;
		try {
			const parsed = new URL(url);
			path = `${parsed.pathname}${parsed.search}`;
		} catch {
			// ignore
		}

		let body = '';
		try {
			body = await response.clone().text();
		} catch {
			// ignore
		}

		// Don't log request headers (they include apikey/authorization).
		console.error('[Supabase HTTP]', response.status, response.statusText, path, body.slice(0, 2000));
	}

	return response;
}

export const supabase = createClient<Database>(resolvedUrl, resolvedAnonKey, {
	global: {
		fetch: loggingFetch,
	},
});
