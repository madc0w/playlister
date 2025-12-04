import { useRuntimeConfig } from '#imports';
import { createError, defineEventHandler, readBody } from 'h3';
import OpenAI from 'openai';

export default defineEventHandler(async event => {
	const config = useRuntimeConfig();

	// Check if user is authenticated
	const session = await getUserSession(event);
	if (!session.user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized - Please sign in',
		});
	}

	// Get keywords from request body
	const body = await readBody(event);
	const { keywords, genre } = body;

	if (!keywords || typeof keywords !== 'string') {
		throw createError({
			statusCode: 400,
			statusMessage: 'Keywords are required',
		});
	}

	// Initialize OpenAI client
	const openai = new OpenAI({
		apiKey: config.openaiApiKey,
	});

	try {
		// Create GPT prompt
		const genreContext = genre ? ` Focus specifically on ${genre} music.` : '';
		const prompt = `Generate a playlist of 20 tracks based on these keywords: "${keywords}".${genreContext}
Return ONLY a JSON array of objects with "name", "artist", and "year" fields. No additional text or explanation.
Example format:
[
  {"name": "Song Title", "artist": "Artist Name", "year": 2020},
  {"name": "Another Song", "artist": "Another Artist", "year": 2015}
]

List relevant tracks that match the mood and theme of the keywords. The tracks must be available as YouTube videos.`;

		// Call OpenAI API
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are a music expert who creates perfect YouTube playlists. You always respond with valid JSON arrays only, no other text.',
				},
				{
					role: 'user',
					content: prompt,
				},
			],
			temperature: 0.8,
			max_tokens: 2000,
		});

		// Parse the response
		const content = response.choices[0]?.message?.content;
		if (!content) {
			throw new Error('No response from OpenAI');
		}

		// Extract JSON from response (in case GPT adds markdown code blocks)
		let jsonContent = content.trim();
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
		}

		// Log the raw response for debugging
		console.log('Raw OpenAI response:', content);
		console.log('Cleaned JSON content:', jsonContent);

		let playlist;
		try {
			playlist = JSON.parse(jsonContent);
		} catch (parseError: any) {
			console.error('JSON Parse Error:', parseError.message);
			console.error('Failed to parse content:', jsonContent);
			throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
		}

		// Validate the response structure
		if (!Array.isArray(playlist)) {
			throw new Error('Invalid response format - expected an array');
		}

		// Validate each song has name and artist
		const validatedPlaylist = playlist
			.filter(song => song.name && song.artist)
			.map(song => ({
				name: song.name,
				artist: song.artist,
				year: song.year || null,
			}));

		if (validatedPlaylist.length === 0) {
			throw new Error('No valid songs in playlist');
		}

		return {
			success: true,
			playlist: validatedPlaylist,
		};
	} catch (error: any) {
		console.error('Error generating playlist:', error);
		throw createError({
			statusCode: 500,
			statusMessage: error.message || 'Failed to generate playlist',
		});
	}
});
