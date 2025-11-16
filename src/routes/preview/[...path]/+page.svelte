<script lang="ts">
	import { page } from '$app/stores';

	$: path = $page.params.path;
	$: contentType = '';
	$: content = null;

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

	$: if (path) {
		loadFile();
	}
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
	}

	.download-bar {
		background: #f5f5f5;
		padding: 10px;
		border-bottom: 1px solid #ddd;
		text-align: center;
	}

	.download-btn {
		background: #007bff;
		color: white;
		padding: 10px 20px;
		text-decoration: none;
		border-radius: 5px;
		font-weight: bold;
	}

	.download-btn:hover {
		background: #0056b3;
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
		background: #f8f8f8;
		padding: 20px;
		border-radius: 5px;
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
		color: #666;
	}
</style>
