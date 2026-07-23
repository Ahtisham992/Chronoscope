import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export class ExportService {
  /**
   * Generates a watermarked video or gif.
   * Pads the bottom of the video by 50px and draws the attribution text inside it.
   * Caches the output so subsequent requests are instant.
   */
  static async exportMedia(domain: string, format: 'mp4' | 'gif'): Promise<string> {
    const videoDir = path.join(process.cwd(), 'videos');
    const inputPath = path.join(videoDir, `${domain}.mp4`);
    const outputPath = path.join(videoDir, `${domain}_export.${format}`);

    // If already exported, return cached file
    if (fs.existsSync(outputPath)) {
      return outputPath;
    }

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Raw video for ${domain} not found`);
    }

    // Windows font path for Arial or similar
    const fontfile = 'C\\\\:/Windows/Fonts/arial.ttf';
    const attributionText = "Historical data via the Internet Archive's Wayback Machine.";
    
    // FFmpeg filter complex:
    // 1. Pad the bottom by 50 pixels (color black)
    // 2. Draw text in the padded area (x: center, y: bottom - 35)
    let filterGraph = `pad=width=iw:height=ih+50:x=0:y=0:color=black,drawtext=fontfile=${fontfile}:text='${attributionText}':fontcolor=white:fontsize=20:x=(w-text_w)/2:y=h-35`;

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      if (format === 'mp4') {
        command
          .videoCodec('libx264')
          .videoFilter(filterGraph)
          .outputOptions(['-pix_fmt yuv420p', '-movflags +faststart']);
      } else if (format === 'gif') {
        // For GIF, we scale down to 800px width for file size, apply pad/text, then generate palette and map
        filterGraph = `scale=800:-1,pad=width=iw:height=ih+50:x=0:y=0:color=black,drawtext=fontfile=${fontfile}:text='${attributionText}':fontcolor=white:fontsize=16:x=(w-text_w)/2:y=h-35`;
        
        command
          .complexFilter([
            `${filterGraph},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
          ]);
      }

      command
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          console.error(`[ExportService] Error exporting ${domain} as ${format}:`, err);
          reject(err);
        })
        .save(outputPath);
    });
  }
}
