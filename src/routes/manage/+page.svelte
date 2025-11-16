<script lang="ts">
	import type { Submission } from '$lib/db';

	let authPassword = '';
	let isAuthenticated = false;
	let submissions: Submission[] = [];
	let selectedSubmission: Submission | null = null;
	let message = '';
	let selectedDirectory = 'thefiles'; // default
	const directories = ['thefiles', 'thefiles/more', 'thefiles/photos', 'thefiles/screenshots', 'thefiles/vids'];

	async function authenticate() {
		try {
			const response = await fetch('/manage?action=authorize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: authPassword })
			});

			if (response.ok) {
				isAuthenticated = true;
				authPassword = '';
				await loadSubmissions();
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
				method: 'POST'
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
{/if}

<style>
	.message {
		padding: 10px;
		margin: 10px 0;
		background: #f5f5f5;
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
		border: 1px solid #ddd;
		padding: 15px;
		margin: 10px 0;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.submission-item.selected {
		background: #e8f4fd;
		border-color: #2196f3;
	}

	.submission-info {
		flex: 1;
	}

	.hash {
		font-family: monospace;
		font-size: 14px;
		color: #666;
	}

	.meta {
		font-size: 12px;
		color: #888;
		margin-top: 5px;
	}

	.submissions-list ul {
		list-style: none;
		padding: 0;
	}

	.submission-detail {
		flex: 1;
		border: 1px solid #ddd;
		padding: 20px;
		border-radius: 4px;
		min-height: 400px;
	}

	.content-preview {
		margin: 20px 0;
	}

	.text-content {
		background: #f9f9f9;
		padding: 15px;
		border-radius: 4px;
		border: 1px solid #eee;
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
</style>
