<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let path: string = '';
	let contentType: string = '';
	let content: string | null = null;

	$: path = $page.params.path || '';

	async function loadFile() {
		try {
			const response = await fetch(`/preview/${path}`);
			const blob = await response.blob();
			contentType = response.headers.get('content-type') || '';

		if (contentType.startsWith('text/')) {
			content = await blob.text();
		} else if (contentType.startsWith('image/') || contentType.startsWith('video/') || contentType.startsWith('audio/')) {
			content = URL.createObjectURL(blob);
		} else {
			content = null;
		}
		} catch (error) {
			console.error('Error loading file:', error);
		}
	}

	onMount(() => {
		if (path) {
			loadFile();
		}
	});
</script>

<svelte:head>
	<title>File Preview - {path}</title>
</svelte:head>

<div class="preview-container">
	<div class="download-bar">
		<a href="/files/{path}" download class="download-btn">Download This File</a>
	</div>
	<div class="preview-content">
		{#if contentType.startsWith('text/') && content}
			<pre class="text-preview">{content}</pre>
		{:else if contentType.startsWith('image/') && content}
			<img src={content} alt="Preview" class="image-preview" />
		{:else if contentType.startsWith('video/') && content}
			<video controls class="media-preview" muted>
				<source src={content} type={contentType} />
				Your browser does not support the video tag.
			</video>
		{:else if contentType.startsWith('audio/') && content}
			<audio controls class="media-preview">
				<source src={content} type={contentType} />
				Your browser does not support the audio tag.
			</audio>
		{:else}
			<div class="unsupported-preview">
				<p>This file type cannot be previewed inline.</p>
				<p>Use the download button above to download the file.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.preview-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #111;
		background-image:
			linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px);
		background-size: 20px 20px;
		color: #fff;
	}

	.download-bar {
		background: #222;
		padding: 10px;
		border-bottom: 1px solid #444;
		text-align: center;
	}

	.download-btn {
		background: #333;
		color: #fff;
		padding: 12px 24px;
		text-decoration: none;
		border-radius: 8px;
		font-weight: bold;
		border: 1px solid #555;
		transition: background 0.2s;
	}

	.download-btn:hover {
		background: #555;
	}

	.preview-content {
		flex: 1;
		padding: 10px;
		overflow: auto;
	}

	.text-preview {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: monospace;
		background: #222;
		color: #fff;
		padding: 20px;
		border-radius: 5px;
		border: 1px solid #444;
	}

	.image-preview {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		display: block;
		margin: 0 auto;
	}

	.media-preview {
		display: block;
		margin: 0 auto;
		max-width: 100%;
	}

	.unsupported-preview {
		text-align: center;
		padding: 50px;
		color: #ccc;
	}
</style>
