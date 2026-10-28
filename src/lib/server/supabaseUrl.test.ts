import { describe, expect, it } from 'vitest';
import { projectUrl } from './supabaseUrl';

describe('projectUrl', () => {
	it('keeps a project URL as it is', () => {
		expect(projectUrl('https://abc.supabase.co')).toBe('https://abc.supabase.co');
	});

	it('strips the REST path and trailing slashes copied from the dashboard', () => {
		expect(projectUrl('https://abc.supabase.co/')).toBe('https://abc.supabase.co');
		expect(projectUrl(' https://abc.supabase.co/rest/v1/ ')).toBe('https://abc.supabase.co');
		expect(projectUrl('http://127.0.0.1:54321/rest/v1')).toBe('http://127.0.0.1:54321');
	});

	it('keeps the path of a self-hosted instance behind a proxy', () => {
		expect(projectUrl('https://example.org/supabase/rest/v1')).toBe('https://example.org/supabase');
	});

	it('rejects a value that is not a URL', () => {
		expect(projectUrl('abc.supabase.co')).toBeNull();
	});
});
