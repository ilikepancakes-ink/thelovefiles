<script lang="ts">
	import type { FileItem } from '$lib/files';

	interface PageData {
		files: FileItem[];
		currentDir: string;
	}

	export let data: PageData;

	// Breadcrumb parts
	$: breadcrumb = data.currentDir ? ['thefiles', ...data.currentDir.split('/')] : ['thefiles'];
	$: breadcrumbPaths = breadcrumb.map((part, index) => ({
		name: part,
		path: index === 0 ? '' : breadcrumb.slice(1, index + 1).join('/')
	}));
</script>

<h1>The Love Files</h1>
<p>:3</p>
<p>FUCK YOU LOVE JONES</p>
<hr>

<a href="/summit">Summit to the Files!</a>

<!-- Breadcrumb navigation -->
<nav>
	{#each breadcrumbPaths as { name, path }, index}
		{#if index > 0}/{/if}
		<a href="?dir={path}">{name}</a>
	{/each}
</nav>

{#if data.files.length === 0}
	<p>No files found in current directory.</p>
{:else}
	<ul>
		{#each data.files as file}
			<li>
				{#if file.type === 'directory'}
					📁 <a href="?dir={file.path}">{file.name}</a>
				{:else}
					📄 <a href="/preview/{file.path}">{file.name}</a>
					{#if file.size !== undefined}
						({file.size} bytes)
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<p><a href="/download-all">Download All Files as ZIP</a></p>
