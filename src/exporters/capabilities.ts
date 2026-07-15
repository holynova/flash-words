import {
  getFirstEncodableVideoCodec,
  Mp4OutputFormat,
  WebMOutputFormat,
  type VideoCodec,
} from 'mediabunny';

export interface VideoCapability {
  container: 'mp4' | 'webm' | null;
  codec: VideoCodec | null;
  label: string;
}

export async function detectVideoCapability(width = 1080, height = 1080): Promise<VideoCapability> {
  try {
    const mp4 = new Mp4OutputFormat();
    const codec = await getFirstEncodableVideoCodec(
      mp4.getSupportedVideoCodecs().filter((item) => item === 'avc' || item === 'hevc'),
      {width, height},
    );
    if (codec) return {container: 'mp4', codec, label: codec === 'avc' ? 'MP4 · H.264' : 'MP4 · HEVC'};
  } catch {
    // Continue to WebM capability detection.
  }

  try {
    const webm = new WebMOutputFormat();
    const codec = await getFirstEncodableVideoCodec(webm.getSupportedVideoCodecs(), {width, height});
    if (codec) return {container: 'webm', codec, label: `WebM · ${codec.toUpperCase()}`};
  } catch {
    // Report the unsupported state below.
  }

  return {container: null, codec: null, label: '当前浏览器不支持视频编码'};
}
