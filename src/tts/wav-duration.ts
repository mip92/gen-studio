import { openSync, readSync, closeSync, statSync } from 'fs';

/**
 * Read the duration of a PCM wav file in milliseconds by parsing its RIFF
 * header. Returns null on any failure (file missing, not a wav, malformed
 * header) so callers can fall back gracefully — duration is "nice to have",
 * never load-bearing.
 *
 * Why not shell out to ffprobe / soundfile / wave: this runs on every
 * scenes-page load when older rows backfill their durationMs, so we want it
 * to be a single fs read with no subprocess.
 *
 * Standard wav layout we expect (what Silero writes):
 *   00..03  "RIFF"
 *   04..07  file size - 8
 *   08..11  "WAVE"
 *   12..15  "fmt "
 *   16..19  fmt chunk size (usually 16)
 *   20..21  audio format (1 = PCM)
 *   22..23  num channels
 *   24..27  sample rate
 *   28..31  byte rate (= sampleRate * channels * bitsPerSample / 8)
 *   32..33  block align
 *   34..35  bits per sample
 *   then    "data" chunk header + audio bytes
 *
 * We scan the first 256 bytes for the "data" marker rather than assuming
 * byte 36 because some encoders insert extra LIST/INFO chunks between fmt
 * and data — Silero usually doesn't, but the scan is cheap insurance.
 */
export function probeWavDurationMs(filePath: string): number | null {
  let fd: number | null = null;
  try {
    fd = openSync(filePath, 'r');
    const head = Buffer.alloc(256);
    const bytesRead = readSync(fd, head, 0, 256, 0);
    if (bytesRead < 44) return null;
    if (head.toString('ascii', 0, 4) !== 'RIFF') return null;
    if (head.toString('ascii', 8, 12) !== 'WAVE') return null;

    const numChannels   = head.readUInt16LE(22);
    const sampleRate    = head.readUInt32LE(24);
    const bitsPerSample = head.readUInt16LE(34);
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    if (!byteRate || byteRate <= 0) return null;

    // Look for the "data" subchunk in what we've already read. If found, its
    // size field gives the exact audio data length — most accurate path.
    for (let i = 12; i <= bytesRead - 8; i++) {
      if (
        head[i] === 0x64 /*d*/ && head[i + 1] === 0x61 /*a*/ &&
        head[i + 2] === 0x74 /*t*/ && head[i + 3] === 0x61 /*a*/
      ) {
        const dataSize = head.readUInt32LE(i + 4);
        if (dataSize > 0) {
          return Math.round((dataSize / byteRate) * 1000);
        }
        break;
      }
    }

    // Fallback: file size minus standard 44-byte header. Slightly less precise
    // (counts any trailing metadata chunks as audio) but accurate enough for
    // the >5s overflow check this is feeding.
    const fileSize = statSync(filePath).size;
    if (fileSize <= 44) return null;
    return Math.round(((fileSize - 44) / byteRate) * 1000);
  } catch {
    return null;
  } finally {
    if (fd !== null) {
      try { closeSync(fd); } catch { /* best-effort */ }
    }
  }
}
