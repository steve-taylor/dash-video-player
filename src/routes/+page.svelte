<script lang="ts">
    import {getDashManifest, parseDashManifest} from '$lib/mpeg-dash'
    import {onMount} from 'svelte'

    const DASH_MANIFEST_URL = '/api/video/big-buck-bunny/index.mpd'

    onMount(() => {
        const subscription = getDashManifest(DASH_MANIFEST_URL).subscribe({
            next(value) {
                // TODO: Download chunks and feed them into the buffer
                console.log(parseDashManifest(value))
            }
        })

        return () => subscription.unsubscribe()
    })
</script>

<h1>DASH video player</h1>
<div>
    <video controls />
</div>

<style>
    video {
        width: 90vw;
        aspect-ratio: 16 / 9;
    }
</style>
