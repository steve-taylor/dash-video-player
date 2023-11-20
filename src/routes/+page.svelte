<script lang="ts">
    import {
        type DashVideoAdaptationSet,
        getDashManifest,
        parseDashManifest,
        type VideoRepresentation
    } from '$lib/mpeg-dash'
    import {map, Observable} from 'rxjs'
    import {ajax} from 'rxjs/ajax'
    import {onMount} from 'svelte'

    const VIDEO_BASE_URL = '/api/video/big-buck-bunny'
    const DASH_MANIFEST_URL = `${VIDEO_BASE_URL}/index.mpd`

    let video: HTMLVideoElement

    onMount(() => {
        const subscription = getDashManifest(DASH_MANIFEST_URL)
            .pipe(map(parseDashManifest))
            .subscribe({
                next(manifest) {
                    console.log(manifest)

                    // TODO: Download chunks and feed them into the buffer

                    const [period] = manifest.periods

                    if (!period) {
                        return
                    }

                    const adaptationSet = period.adaptationSets.find(
                        (
                            adaptationSet
                        ): adaptationSet is DashVideoAdaptationSet =>
                            adaptationSet.contentType === 'video'
                    )

                    if (!adaptationSet) {
                        return
                    }

                    const [representation] = adaptationSet.representations

                    if (!representation) {
                        return
                    }

                    // Number of segments after the init segment
                    const segmentCount =
                        Math.ceil(
                            manifest.mediaPresentationDuration /
                                (adaptationSet.segmentTemplate.duration /
                                    adaptationSet.segmentTemplate.timescale)
                        ) - 1
                    const firstSegmentIndex =
                        adaptationSet.segmentTemplate.startNumber
                    const lastSegmentIndex = firstSegmentIndex + segmentCount

                    function getInitSegmentUrl(
                        adaptationSet: DashVideoAdaptationSet,
                        representation: VideoRepresentation
                    ) {
                        return `${VIDEO_BASE_URL}${
                            manifest.baseUrl
                        }/${adaptationSet.segmentTemplate.initialization
                            .replaceAll('$RepresentationID$', representation.id)
                            .replaceAll(
                                '$Bandwidth$',
                                `${representation.bandwidth}`
                            )}`
                    }

                    function getSegmentUrl(
                        adaptationSet: DashVideoAdaptationSet,
                        representation: VideoRepresentation,
                        index: number
                    ) {
                        return `${VIDEO_BASE_URL}${
                            manifest.baseUrl
                        }/${adaptationSet.segmentTemplate.media
                            .replaceAll('$RepresentationID$', representation.id)
                            .replaceAll(
                                '$Bandwidth$',
                                `${representation.bandwidth}`
                            )
                            .replaceAll('$Number$', `${index}`)}`
                    }

                    function loadArrayBuffer(
                        url: string
                    ): Observable<ArrayBuffer> {
                        return ajax<ArrayBuffer>({
                            url,
                            method: 'GET',
                            responseType: 'arraybuffer'
                        }).pipe(map(res => new Uint8Array(res.response)))
                    }

                    function loadInitSegment(
                        adaptationSet: DashVideoAdaptationSet,
                        representation: VideoRepresentation
                    ) {
                        return loadArrayBuffer(
                            getInitSegmentUrl(adaptationSet, representation)
                        )
                    }

                    function loadSegment(
                        adaptationSet: DashVideoAdaptationSet,
                        representation: VideoRepresentation,
                        index: number
                    ) {
                        return loadArrayBuffer(
                            getSegmentUrl(adaptationSet, representation, index)
                        )
                    }

                    // timescale: units per second (this could typically be frames per second)

                    // duration: duration / timescale = the duration of a segment (which means duration could typically be the number of frames in a segment)

                    const mediaSource = new MediaSource()

                    mediaSource.addEventListener(
                        'sourceopen',
                        () => {
                            const sourceBufferType = `${adaptationSet.mimeType}; codecs="${representation.codecs}"`
                            const sourceBuffer =
                                mediaSource.addSourceBuffer(sourceBufferType)

                            // Load the first segment
                            loadInitSegment(
                                adaptationSet,
                                representation
                            ).subscribe(initSegment => {
                                sourceBuffer.appendBuffer(initSegment)
                                // video.play()
                            })

                            // TODO: Load the remaining segments in sequence
                        },
                        {once: true}
                    )

                    video.src = URL.createObjectURL(mediaSource)
                }
            })

        return () => subscription.unsubscribe()
    })
</script>

<h1>DASH video player</h1>
<div>
    <video bind:this={video} controls />
</div>

<style>
    video {
        width: 90vw;
        aspect-ratio: 16 / 9;
    }
</style>
