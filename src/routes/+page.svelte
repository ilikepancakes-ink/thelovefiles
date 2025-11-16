<script lang="ts">
	import type { FileItem } from '$lib/files';

	interface PageData {
		files: FileItem[];
	}

	export let data: PageData;
</script>

<h1>The Love Files</h1>
<p>:3</p>
<p>FUCK YOU LOVE JONES</p>
<hr>


{#if data.files.length === 0}
	<p>No files found in /thefiles.</p>
{:else}
	<ul>
		{#each data.files as file}
			<li>
				{#if file.type === 'directory'}
					📁
				{:else}
					📄
				{/if}
				<a href="/files/{file.path}" target="_blank">{file.name}</a>
				{#if file.size !== undefined}
					({file.size} bytes)
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<p><a href="/download-all">Download All Files as ZIP</a></p>
