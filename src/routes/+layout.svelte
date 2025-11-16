<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="container">
	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #111;
		background-image:
			linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px);
		background-size: 20px 20px;
		color: #fff;
		font-family: Arial, sans-serif;
	}

	:global(a) {
		text-decoration: none;
		color: #fff;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		margin-top: 20px;
		padding: 20px;
		border-radius: 20px;
		background: #222;
	}
</style>
