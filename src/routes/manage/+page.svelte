<script lang="ts">
	import { onMount } from 'svelte';
	import type { Submission } from '$lib/db';

	import type { FileItem } from '$lib/file-utils';

	let authPassword = '';
	let isAuthenticated = false;
	let submissions: Submission[] = [];
	let selectedSubmission: Submission | null = null;
	let message = '';
	let selectedDirectory = 'thefiles'; // default for submissions
	let directories: string[] = ['thefiles', 'thefiles/more', 'thefiles/photos', 'thefiles/screenshots', 'thefiles/vids']; // fallback static
	let selectedDirectoryFile = ''; // for file management, relative to thefiles
	let fileDirectories: string[] = ['', 'more', 'photos', 'screenshots', 'vids']; // fallback static
	let files: FileItem[] = [];
	let selectedFileIndex: number | null = null;
	let newName = '';
	let directoryRefreshInterval: any = null;

	async function authenticate() {
		try {
			const response = await fetch('/manage?action=authorize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: authPassword })
			});

			if (response.ok) {
				const data = await response.json();
				isAuthenticated = data.authorized;
				authPassword = '';
				await Promise.all([loadSubmissions(), loadDirectories()]);
				// Set up auto-refresh every 30 seconds
				if (directoryRefreshInterval) clearInterval(directoryRefreshInterval);
				directoryRefreshInterval = setInterval(loadDirectories, 30000);
			} else {
				message = 'Invalid password';
			}
		} catch (error) {
			console.error('Auth error:', error);
			message = 'Authentication failed';
		}
	}

	async function loadSubmissions() {
		try {
			const response = await fetch('/manage?action=get_pending', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const result = await response.json();
			submissions = result.submissions || [];
			selectedSubmission = null;
			message = '';
		} catch (error) {
			console.error('Load error:', error);
			message = 'Failed to load submissions';
		}
	}

	async function viewSubmission(hash: string) {
		try {
			const response = await fetch('/manage?action=get_submission', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hash })
			});

			const result = await response.json();
			selectedSubmission = result.submission;
		} catch (error) {
			console.error('View error:', error);
		}
	}

	async function approveSubmission(hash: string) {
		try {
			const response = await fetch('/manage?action=approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hash, directory: selectedDirectory })
			});

			if (response.ok) {
				await loadSubmissions();
				message = 'Submission approved';
			} else {
				message = 'Approve failed';
			}
		} catch (error) {
			console.error('Approve error:', error);
			message = 'Approve failed';
		}
	}

	async function denySubmission(hash: string) {
		try {
			const response = await fetch('/manage?action=deny', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hash })
			});

			if (response.ok) {
				await loadSubmissions();
				message = 'Submission denied';
			} else {
				message = 'Deny failed';
			}
		} catch (error) {
			console.error('Deny error:', error);
			message = 'Deny failed';
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleString();
	}

	async function loadFiles() {
		try {
			const response = await fetch('/manage?action=list_files', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directory: selectedDirectoryFile })
			});
			const result = await response.json();
			files = result.files || [];
			message = '';
		} catch (error) {
			console.error('Load files error:', error);
			message = 'Failed to load files';
		}
	}

	async function startRename(index: number, file: FileItem) {
		selectedFileIndex = index;
		newName = file.name;
	}

	async function saveRename(file: FileItem) {
		try {
			const response = await fetch('/manage?action=rename_file', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ directory: selectedDirectoryFile, oldName: file.name, newName })
			});
			if (response.ok) {
				await loadFiles();
				selectedFileIndex = null;
				message = 'File renamed successfully';
			} else {
				message = 'Rename failed';
			}
		} catch (error) {
			console.error('Rename error:', error);
			message = 'Rename failed';
		}
	}

	function cancelRename() {
		selectedFileIndex = null;
	}

	async function loadDirectories() {
		try {
			const response = await fetch('/manage?action=list_directories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.ok) {
				const result = await response.json();
				const dirNames = result.directories || [];
				// Create full paths for submissions and relative for file management
				directories = ['thefiles', ...dirNames.map((d: string) => `thefiles/${d}`)];
				fileDirectories = ['', ...dirNames];
			} else {
				throw new Error('Failed to load directories');
			}
		} catch (error) {
			console.error('Load directories error:', error);
			// Keep fallback directories on error
		}
	}


</script>

{#if !isAuthenticated}
	<h1>Admin Login</h1>
	<form on:submit|preventDefault={authenticate}>
		<div>
			<label for="password">Admin Password:</label>
			<input type="password" id="password" bind:value={authPassword} required>
		</div>
		<button type="submit">Login</button>
	</form>
{:else}
	<h1>Manage Submissions</h1>

	{#if message}
		<div class="message">{message}</div>
	{/if}

	<div class="container">
		<div class="submissions-list">
			<h2>Pending Submissions ({submissions.length})</h2>
			{#if submissions.length === 0}
				<p>No pending submissions</p>
			{:else}
				<ul>
					{#each submissions as submission}
						<li class="submission-item" class:selected={selectedSubmission?.hash === submission.hash}>
							<div class="submission-info">
								<div class="hash">{submission.hash}</div>
								<div class="meta">
									{submission.content_type} • {formatDate(submission.submit_time)}
									{#if submission.original_filename}
										• {submission.original_filename}
									{/if}
								</div>
							</div>
							<button on:click={() => viewSubmission(submission.hash)}>View</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if selectedSubmission}
			<div class="submission-detail">
				<h3>Submission Details</h3>
				<div class="submission-meta">
					<p><strong>Hash:</strong> {selectedSubmission.hash}</p>
					<p><strong>Type:</strong> {selectedSubmission.content_type}</p>
					<p><strong>Submitted:</strong> {formatDate(selectedSubmission.submit_time)}</p>
					{#if selectedSubmission.original_filename}
						<p><strong>Original Filename:</strong> {selectedSubmission.original_filename}</p>
					{/if}
				</div>

				<div class="content-preview">
					<h4>Content:</h4>
					{#if selectedSubmission.content_type === 'file'}
						<p>File content (binary - see database)</p>
					{:else if selectedSubmission.text_content}
						<pre class="text-content">{selectedSubmission.text_content}</pre>
					{/if}
				</div>

				<div class="actions">
					<div class="approve-section">
						<label for="directory-select">Select Directory:</label>
						<select id="directory-select" bind:value={selectedDirectory}>
							{#each directories as dir}
								<option value={dir}>{dir}</option>
							{/each}
						</select>
						<button class="approve" on:click={() => approveSubmission(selectedSubmission!.hash)}>Approve</button>
					</div>
					<button class="deny" on:click={() => denySubmission(selectedSubmission!.hash)}>Deny</button>
				</div>
			</div>
		{/if}
	</div>

	<div class="file-management">
		<h2>File Management</h2>
		<div class="file-controls">
			<label for="directory-file-select">Select Directory:</label>
		<select id="directory-file-select" bind:value={selectedDirectoryFile}>
			{#each fileDirectories as dir}
				<option value={dir}>{dir === '' ? 'thefiles' : `thefiles/${dir}`}</option>
			{/each}
		</select>
			<button on:click={loadFiles}>Load Files</button>
		</div>

		{#if files.length > 0}
			<ul class="file-list">
				{#each files as file, index}
					<li class="file-item">
						<span class="file-name">{file.name}</span>
						{#if selectedFileIndex === index}
							<input type="text" bind:value={newName} />
							<button on:click={() => saveRename(file)}>Save</button>
							<button on:click={cancelRename}>Cancel</button>
						{:else}
							<button on:click={() => startRename(index, file)}>Rename</button>
						{/if}
					</li>
				{/each}
			</ul>
		{:else if files.length === 0 && message.includes('load')}
			<p>No files loaded</p>
		{/if}
	</div>
{/if}

<style>
	.message {
		padding: 10px;
		margin: 10px 0;
		background: #333;
		color: #fff;
		border-radius: 4px;
	}

	.container {
		display: flex;
		gap: 20px;
		margin-top: 20px;
	}

	.submissions-list {
		flex: 1;
	}

	.submission-item {
		background: #222;
		border: 1px solid #444;
		padding: 15px;
		margin: 10px 0;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.submission-item.selected {
		background: #333;
		border-color: #666;
	}

	.submission-info {
		flex: 1;
	}

	.hash {
		font-family: monospace;
		font-size: 14px;
		color: #ccc;
	}

	.meta {
		font-size: 12px;
		color: #aaa;
		margin-top: 5px;
	}

	.submissions-list ul {
		list-style: none;
		padding: 0;
	}

	.submission-detail {
		flex: 1;
		background: #222;
		border: 1px solid #444;
		padding: 20px;
		border-radius: 4px;
		min-height: 400px;
	}

	.content-preview {
		margin: 20px 0;
	}

	.text-content {
		background: #333;
		color: #fff;
		padding: 15px;
		border-radius: 4px;
		border: 1px solid #444;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 300px;
		overflow-y: auto;
	}

	.actions {
		margin-top: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.approve-section {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	button {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button.approve {
		background: #4caf50;
		color: white;
	}

	button.deny {
		background: #f44336;
		color: white;
	}

	button:hover {
		opacity: 0.9;
	}

	form div {
		margin-bottom: 10px;
	}

	.file-management {
		margin-top: 40px;
	}

	.file-controls {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 20px;
	}

	.file-list {
		list-style: none;
		padding: 0;
	}

	.file-list li {
		background: #222;
		border: 1px solid #444;
		padding: 10px;
		margin: 5px 0;
		border-radius: 4px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.file-name {
		flex: 1;
		font-weight: bold;
	}

	.file-item button {
		margin-left: 10px;
		padding: 5px 10px;
		font-size: 12px;
	}
</style>
