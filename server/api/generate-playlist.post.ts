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
	const { keywords } = body;

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
		const prompt = `Generate a playlist of 20 songs based on these keywords: "${keywords}".
Return ONLY a JSON array of objects with "name" and "artist" fields. No additional text or explanation.
Example format:
[
  {"name": "Song Title", "artist": "Artist Name"},
  {"name": "Another Song", "artist": "Another Artist"}
]

Generate diverse, popular, and relevant songs that match the mood and theme of the keywords.`;

		// Call OpenAI API
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are a music expert who creates perfect playlists. You always respond with valid JSON arrays only, no other text.',
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
			jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
		}

		const playlist = JSON.parse(jsonContent);

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
