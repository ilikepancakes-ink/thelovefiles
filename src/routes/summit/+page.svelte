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

	<button type="submit">Submit</button>
</form>
