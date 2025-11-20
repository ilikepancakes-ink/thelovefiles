<script lang="ts">
	import { formatFileSize } from '$lib/files';

	let textContent = '';
	let file: File | null = null;
	let isUploading = false;

	const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB

	async function uploadChunks(file: File): Promise<string> {
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
		const uploadId = crypto.randomUUID();

		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);

			const chunkFormData = new FormData();
			chunkFormData.append('chunk', chunk);
			chunkFormData.append('uploadId', uploadId);
			chunkFormData.append('chunkIndex', chunkIndex.toString());
			chunkFormData.append('totalChunks', totalChunks.toString());
			chunkFormData.append('fileName', file.name);

			const response = await fetch('/summit/chunk', {
				method: 'POST',
				body: chunkFormData
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Chunk upload failed: ${errorText}`);
			}

			const result = await response.json();
			if (chunkIndex === totalChunks - 1) {
				return result.hash;
			}
		}
		throw new Error('All chunks uploaded but no hash returned');
	}

	async function handleSubmit() {
		isUploading = true;
		try {
			const formData = new FormData();

			if (file) {
				formData.append('file', file);
			} else if (textContent.trim()) {
				formData.append('text', textContent);
			} else {
				alert('Please attach a file or enter text.');
				return;
			}

			let response = await fetch('/summit', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				alert('Submission successful!');
			} else if (response.status === 413 && file) {
				// Payload too large, try chunking
				alert('File too large for single upload, attempting chunked upload...');
				const hash = await uploadChunks(file);
				alert('Chunked submission successful! Hash: ' + hash);
			} else {
				const errorText = await response.text();
				alert(`Submission failed: ${errorText}`);
			}

			textContent = '';
			file = null;
			// Reset the file input
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			if (fileInput) fileInput.value = '';
		} catch (error) {
			console.error('Error:', error);
			alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isUploading = false;
		}
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		file = input.files?.[0] || null;
	}
</script>

<h1>Summit to the Files</h1>

<form on:submit|preventDefault={handleSubmit}>
	<div>
		<label for="text">Text Content:</label><br>
		<textarea id="text" bind:value={textContent} placeholder="Type your content here..."></textarea>
	</div>

	<div>
		<label for="file">Or Attach File:</label><br>
		<input type="file" id="file" on:change={handleFileChange}>
		{#if file}
			<p>File size: {formatFileSize(file.size)}</p>
		{/if}
	</div>

	<button type="submit" class="submit-btn" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Submit'}</button>
</form>

<style>
	form {
		background: #222;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #444;
		max-width: 500px;
		margin-top: 20px;
	}

	div {
		margin-bottom: 15px;
	}

	label {
		color: #fff;
		font-weight: bold;
		margin-bottom: 5px;
		display: block;
	}

	textarea {
		width: 100%;
		padding: 10px;
		border: 1px solid #555;
		border-radius: 4px;
		background: #333;
		color: #fff;
		resize: vertical;
		min-height: 100px;
	}

	input[type="file"] {
		padding: 10px;
		background: #333;
		color: #fff;
		border: 1px solid #555;
		border-radius: 4px;
	}

	.submit-btn {
		background: #007bff;
		color: #fff;
		border: none;
		padding: 10px 20px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
	}

	.submit-btn:hover {
		background: #0056b3;
	}
</style>
