export default defineEventHandler(async event => {
	const config = useRuntimeConfig();

	return {
		status: 'ok',
		message: 'Playlister API is running',
		hasOpenAI: !!config.openaiApiKey,
	};
});
