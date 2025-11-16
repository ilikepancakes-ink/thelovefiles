<script lang="ts">
	let textContent = '';
	let file: File | null = null;

	async function handleSubmit() {
		const formData = new FormData();

		if (file) {
			formData.append('file', file);
		} else if (textContent.trim()) {
			formData.append('text', textContent);
		} else {
			alert('Please attach a file or enter text.');
			return;
		}

		try {
			const response = await fetch('/summit', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				alert('Submission successful!');
				textContent = '';
				file = null;
				// Reset the file input
				const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
				if (fileInput) fileInput.value = '';
			} else {
				alert('Submission failed.');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Submission failed.');
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
	</div>

	<button type="submit" class="submit-btn">Submit</button>
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
