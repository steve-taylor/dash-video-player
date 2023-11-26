<script lang="ts">
    import getDashManifest from '$lib/mpeg-dash/manifest/getDashManifest'
    import {parseDashManifest} from '$lib/mpeg-dash/manifest/parseDashManifest'
    import loadAndPlay from '$lib/mpeg-dash/player/loadAndPlay'
    import {onMount} from 'svelte'

    const VIDEO_BASE_URL = '/api/video/big-buck-bunny'
    const DASH_MANIFEST_URL = `${VIDEO_BASE_URL}/index.mpd`

    let video: HTMLVideoElement

    onMount(() => {
        const abortController = new AbortController()

        getDashManifest(DASH_MANIFEST_URL, abortController.signal)
            .then(parseDashManifest)
            .then(manifest =>
                loadAndPlay(
                    video,
                    manifest,
                    VIDEO_BASE_URL,
                    abortController.signal
                )
            )

        return () => abortController.abort()
    })
</script>

<h1>DASH video player</h1>
<div>
    <video bind:this={video} controls autoplay />
</div>

<style>
    video {
        width: 90vw;
        aspect-ratio: 16 / 9;
    }
</style>
