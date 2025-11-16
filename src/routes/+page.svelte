<script lang="ts">
	import type { FileItem } from '$lib/files';
	import { goto } from '$app/navigation';

	interface PageData {
		files: FileItem[];
		currentDir: string;
		error?: string;
	}

	export let data: PageData;

	// Breadcrumb parts
	$: breadcrumb = data.currentDir ? ['thefiles', ...data.currentDir.split('/')] : ['thefiles'];
	$: breadcrumbPaths = breadcrumb.map((part, index) => ({
		name: part,
		path: index === 0 ? '' : breadcrumb.slice(1, index + 1).join('/')
	}));

	function isImage(name: string): boolean {
		const ext = name.split('.').pop()?.toLowerCase() || '';
		return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'].includes(ext);
	}
</script>

<h1>The Love Files</h1>
<p>Welcome to everything we have on love :3</p>
<hr>
<b>NOTE FOR LEGAL REASONS THIS IS ALL ALLEGED AND NOTHING HERE IS MARKETED AS THE TRUTH</b>

<button class="nav-btn" on:click={() => goto('/summit')}>Summit to the Files!</button>

<!-- Breadcrumb navigation -->
<nav>
	{#each breadcrumbPaths as { name, path }, index}
		{#if index > 0}/{/if}
		<a href="?dir={path}" class="breadcrumb-link">{name}</a>
	{/each}
</nav>

{#if data.files.length === 0}
	<p>No files found in current directory.</p>
{:else}
	<div class="file-grid">
		{#each data.files as file}
			<div class="file-item">
				{#if file.type === 'directory'}
					<div class="file-icon folder"></div>
					<a href="?dir={file.path}">{file.name}</a>
				{:else}
					{#if isImage(file.name)}
						<img src="/preview/{file.path}" alt="{file.name}" class="file-icon image-preview"/>
					{:else}
						<div class="file-icon file"></div>
					{/if}
					<a href="/preview/{file.path}">{file.name}</a>
					{#if file.size !== undefined}
						<span class="file-size">({file.size} bytes)</span>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
{/if}

<p><a href="/download-all" class="nav-btn">Download All Files as ZIP</a></p>

<style>
	nav {
		margin: 20px 0;
		padding: 10px;
		background: #333;
		border-radius: 8px;
		text-align: center;
		font-size: 14px;
	}

	.nav-btn {
		display: inline-block;
		background: #007bff;
		color: #fff;
		border: none;
		padding: 12px 24px;
		margin: 20px 0;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s;
		text-decoration: none;
		font-weight: bold;
	}

	.nav-btn:hover {
		background: #0056b3;
	}

	.breadcrumb-link {
		color: #ccc;
		text-decoration: underline;
	}

	.breadcrumb-link:hover {
		color: #fff;
	}

	.file-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 20px;
		margin: 20px 0;
	}

	.file-item {
		background: #333;
		border: 1px solid #444;
		border-radius: 10px;
		padding: 15px;
		text-align: center;
		transition: background 0.2s;
	}

	.file-item:hover {
		background: #444;
	}

	.file-icon {
		margin: 0 auto 10px;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: #555;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		color: #fff;
	}

	.file-icon.folder::before {
		content: "📁";
	}

	.file-icon.file::before {
		content: "📄";
	}

	.image-preview {
		object-fit: cover;
		border-radius: 50%;
		width: 50px;
		height: 50px;
	}

	.file-item a {
		display: block;
		margin-bottom: 5px;
		font-size: 16px;
		font-weight: bold;
		color: #fff;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-item a:hover {
		color: #007bff;
	}

	.file-size {
		font-size: 12px;
		color: #aaa;
	}
</style>
