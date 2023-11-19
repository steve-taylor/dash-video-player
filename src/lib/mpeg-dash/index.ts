import {map, Observable} from 'rxjs'
import {ajax} from 'rxjs/ajax'

export function getDashManifest(url: string): Observable<XMLDocument> {
    return ajax<string>({
        url,
        method: 'GET',
        responseType: 'text'
    }).pipe(
        map(res => res.response),
        map(xml => new DOMParser().parseFromString(xml, 'application/xml'))
    )
}

type SegmentTemplate = {
    duration: number // seconds
    timescale: number
    media: string // e.g. "$RepresentationID$/$RepresentationID$_$Number$.m4v"
    startNumber: number
    initialization: string // "$RepresentationID$/$RepresentationID$_0.m4v"
}

type BaseRepresentation = {
    id: string
    codecs: string
    bandwidth: number
}

type VideoRepresentation = BaseRepresentation & {
    width: number
    height: number
    frameRate: number
    sar: string // aspect ratio, e.g. "1:1"
    scanType: 'progressive' | 'interlaced' // interlaced was a guess
}

type AudioChannelConfiguration = {
    value: number
}

type AudioRepresentation = BaseRepresentation & {
    audioSamplingRate: number
    audioChannelConfiguration: AudioChannelConfiguration
}

type BaseDashAdaptationSet = {
    mimeType: string
    subsegmentAlignment: boolean
    subsegmentStartsWithSAP: number
    segmentTemplate: SegmentTemplate
}

type DashVideoAdaptationSet = BaseDashAdaptationSet & {
    contentType: 'video'
    par: string // aspect ratio
    representations: VideoRepresentation[]
}

type DashAudioAdaptationSet = BaseDashAdaptationSet & {
    contentType: 'audio'
    representations: AudioRepresentation[]
}

type DashAdaptationSet = DashVideoAdaptationSet | DashAudioAdaptationSet

type DashPeriod = {
    adaptationSets: DashAdaptationSet[]
}

type DashManifest = {
    type: 'static' | 'dynamic'
    mediaPresentationDuration: number
    minBufferTime: number
    profiles: string
    baseUrl: string
    periods: DashPeriod[]
}

export function parseDashManifest(manifest: XMLDocument): DashManifest {
    const {documentElement} = manifest
    const typeAttribute = documentElement.getAttribute('type')
    const mediaPresentationDurationAttribute = documentElement.getAttribute(
        'mediaPresentationDuration'
    )
    const minBufferTimeAttribute = documentElement.getAttribute('minBufferTime')
    const profilesAttribute = documentElement.getAttribute('profiles')

    if (typeAttribute !== 'static' && typeAttribute !== 'dynamic') {
        throw new Error('Invalid type in MPD element: ' + typeAttribute)
    }

    if (!mediaPresentationDurationAttribute) {
        throw new Error('Missing mediaPresentationDuration in MPD element')
    }

    if (!minBufferTimeAttribute) {
        throw new Error('Missing minBufferTime in MPD element')
    }

    if (!profilesAttribute) {
        throw new Error('Missing profiles in MPD element')
    }

    const mediaPresentationDuration = parseSeconds(
        mediaPresentationDurationAttribute
    )
    const minBufferTime = parseSeconds(minBufferTimeAttribute)

    const periods: DashPeriod[] = []

    for (const periodElement of documentElement.getElementsByTagName(
        'Period'
    )) {
        periods.push(parsePeriod(periodElement))
    }

    const baseUrl =
        documentElement
            .getElementsByTagName('BaseURL')[0]
            ?.textContent?.trim() ?? './'

    return {
        type: typeAttribute,
        mediaPresentationDuration,
        minBufferTime,
        profiles: profilesAttribute,
        baseUrl,
        periods
    }
}

function parsePeriod(periodElement: Element): DashPeriod {
    const adaptationSets: DashAdaptationSet[] = []

    for (const adaptationSetElement of periodElement.getElementsByTagName(
        'AdaptationSet'
    )) {
        adaptationSets.push(parseAdaptationSet(adaptationSetElement))
    }

    return {
        adaptationSets
    }
}

function parseAdaptationSet(adaptationSetElement: Element): DashAdaptationSet {
    const contentTypeAttribute =
        adaptationSetElement.getAttribute('contentType')

    switch (contentTypeAttribute) {
        case 'video':
            return parseVideoAdaptationSet(adaptationSetElement)
        case 'audio':
            return parseAudioAdaptationSet(adaptationSetElement)
        default:
            throw new Error(
                'Invalid contentType in AdaptationSet: ' + contentTypeAttribute
            )
    }
}

function parseVideoAdaptationSet(
    adaptationSetElement: Element
): DashVideoAdaptationSet {
    const par = adaptationSetElement.getAttribute('par')

    if (!par) {
        throw new Error('Missing par in AdaptationSet')
    }

    const representations: VideoRepresentation[] = []

    for (const representationElement of adaptationSetElement.getElementsByTagName(
        'Representation'
    )) {
        representations.push(parseVideoRepresentation(representationElement))
    }

    return {
        ...parseBaseAdaptationSet(adaptationSetElement),
        contentType: 'video',
        par,
        representations
    }
}

function parseAudioAdaptationSet(
    adaptationSetElement: Element
): DashAudioAdaptationSet {
    const representations: AudioRepresentation[] = []

    for (const representationElement of adaptationSetElement.getElementsByTagName(
        'Representation'
    )) {
        representations.push(parseAudioRepresentation(representationElement))
    }

    return {
        ...parseBaseAdaptationSet(adaptationSetElement),
        contentType: 'audio',
        representations
    }
}

function parseBaseAdaptationSet(
    adaptationSetElement: Element
): BaseDashAdaptationSet {
    const mimeType = adaptationSetElement.getAttribute('mimeType')
    const subsegmentAlignment =
        adaptationSetElement.getAttribute('subsegmentAlignment') === 'true'
    const subsegmentStartsWithSAP = parseInt(
        adaptationSetElement.getAttribute('subsegmentStartsWithSAP') as string
    )

    if (!mimeType) {
        throw new Error('Missing mimeType in AdaptationSet')
    }

    if (!Number.isFinite(subsegmentStartsWithSAP)) {
        throw new Error(
            'Invalid subsegmentStartsWithSAP in AdaptationSet: ' +
                subsegmentStartsWithSAP
        )
    }

    const [segmentTemplateElement] =
        adaptationSetElement.getElementsByTagName('SegmentTemplate')

    if (!segmentTemplateElement) {
        throw new Error('Missing SegmentTemplate from AdaptationSet')
    }

    const segmentTemplate = parseSegmentTemplate(segmentTemplateElement)

    return {
        mimeType,
        segmentTemplate,
        subsegmentAlignment,
        subsegmentStartsWithSAP
    }
}

function parseSegmentTemplate(
    segmentTemplateElement: Element
): SegmentTemplate {
    const duration = parseInt(
        segmentTemplateElement.getAttribute('duration') as string
    )
    const timescale = parseInt(
        segmentTemplateElement.getAttribute('timescale') as string
    )
    const media = segmentTemplateElement.getAttribute('media')
    const startNumber = parseInt(
        segmentTemplateElement.getAttribute('startNumber') as string
    )
    const initialization = segmentTemplateElement.getAttribute('duration')

    if (!Number.isFinite(duration)) {
        throw new Error('Invalid duration in SegmentTemplate: ' + duration)
    }

    if (!Number.isFinite(timescale)) {
        throw new Error('Invalid timescale in SegmentTemplate: ' + timescale)
    }

    if (!media) {
        throw new Error('Missing media in SegmentTemplate')
    }

    if (!Number.isFinite(startNumber)) {
        throw new Error(
            'Invalid startNumber in SegmentTemplate: ' + startNumber
        )
    }

    if (!initialization) {
        throw new Error('Missing initialization in SegmentTemplate')
    }

    return {
        duration,
        timescale,
        media,
        startNumber,
        initialization
    }
}

function parseVideoRepresentation(
    representationElement: Element
): VideoRepresentation {
    // width, height, frameRate, sar, scanType
    const width = parseInt(
        representationElement.getAttribute('width') as string
    )
    const height = parseInt(
        representationElement.getAttribute('height') as string
    )
    const framerateAttribute = representationElement.getAttribute('frameRate')
    const sar = representationElement.getAttribute('sar')
    const scanType = representationElement.getAttribute('scanType')

    if (!Number.isFinite(width)) {
        throw new Error('Invalid width in Representation: ' + width)
    }

    if (!Number.isFinite(height)) {
        throw new Error('Invalid height in Representation: ' + height)
    }

    if (!framerateAttribute) {
        throw new Error('Missing frameRate in Representation')
    }

    if (!sar) {
        throw new Error('Missing sar in Representation')
    }

    if (scanType !== 'progressive' && scanType !== 'interlaced') {
        throw new Error('Invalid scanType in Representation: ' + scanType)
    }

    const [framerateNumerator, framerateDenominator] = (
        framerateAttribute?.split('/') ?? []
    ).map(number => parseInt(number))

    if (framerateNumerator === undefined) {
        throw new Error('Missing or invalid frameRate in Representation')
    }

    const frameRate =
        framerateDenominator === undefined
            ? framerateNumerator
            : framerateNumerator / framerateDenominator

    return {
        ...parseBaseRepresentation(representationElement),
        width,
        height,
        frameRate,
        sar,
        scanType
    }
}

function parseAudioRepresentation(
    representationElement: Element
): AudioRepresentation {
    const audioSamplingRate = parseInt(
        representationElement.getAttribute('audioSamplingRate') as string
    )

    if (!Number.isFinite(audioSamplingRate)) {
        throw new Error(
            'Invalid audioSamplingRate in Representation: ' + audioSamplingRate
        )
    }

    const [audioChannelConfigurationElement] =
        representationElement.getElementsByTagName('AudioChannelConfiguration')

    if (!audioChannelConfigurationElement) {
        throw new Error('Missing AudioChannelConfigurationin Representation')
    }

    return {
        ...parseBaseRepresentation(representationElement),
        audioSamplingRate,
        audioChannelConfiguration: parseAudioChannelConfiguration(
            audioChannelConfigurationElement
        )
    }
}

function parseBaseRepresentation(
    representationElement: Element
): BaseRepresentation {
    const id = representationElement.getAttribute('id')
    const codecs = representationElement.getAttribute('codecs')
    const bandwidth = parseInt(
        representationElement.getAttribute('bandwidth') as string
    )

    if (!id) {
        throw new Error('Representation missing id')
    }

    if (!codecs) {
        throw new Error('Representation missing codecs')
    }

    if (!Number.isFinite(bandwidth)) {
        throw new Error('Invalid bandwidth in Representation: ' + bandwidth)
    }

    return {
        id,
        codecs,
        bandwidth
    }
}

function parseAudioChannelConfiguration(
    audioChannelConfigurationElement: Element
): AudioChannelConfiguration {
    const value = parseInt(
        audioChannelConfigurationElement.getAttribute('value') as string
    )

    if (!Number.isFinite(value)) {
        throw new Error('Invalid value in AudioChannelConfiguration')
    }

    return {
        value
    }
}

function parseSeconds(time: string): number {
    return parseFloat(time.slice(2, -1))
}
