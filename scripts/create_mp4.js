/**
 * Generates a valid ISO-BMFF MP4 video file for Smart Parking Platform Demo
 * SR University Hackathon 2026
 */

const fs = require('fs');
const path = require('path');

function makeBox(type, ...buffers) {
  const payload = Buffer.concat(buffers);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(payload.length + 8, 0);
  header.write(type, 4, 4, 'ascii');
  return Buffer.concat([header, payload]);
}

function makeFullBox(type, version, flags, ...buffers) {
  const payload = Buffer.concat(buffers);
  const header = Buffer.alloc(12);
  header.writeUInt32BE(payload.length + 12, 0);
  header.write(type, 4, 4, 'ascii');
  header.writeUInt8(version, 8);
  header.writeUIntBE(flags, 9, 3);
  return Buffer.concat([header, payload]);
}

function generateDemoMp4(outputPath) {
  // 1. ftyp box
  const ftyp = makeBox('ftyp',
    Buffer.from('isom'),
    Buffer.from([0x00, 0x00, 0x02, 0x00]),
    Buffer.from('isomiso2mp41')
  );

  // Standard H.264 baseline SPS and PPS for 1280x720 30fps
  // SPS: 0x67, 0x42, 0xc0, 0x1f, 0x8c, 0x8d, 0x40, 0x50, 0x1e, 0xd0, 0x11, 0x08, 0xd4
  const sps = Buffer.from([0x67, 0x42, 0xc0, 0x1f, 0x8c, 0x8d, 0x40, 0x50, 0x1e, 0xd0, 0x11, 0x08, 0xd4]);
  // PPS: 0x68, 0xce, 0x3c, 0x80
  const pps = Buffer.from([0x68, 0xce, 0x3c, 0x80]);

  // IDR Slice (I-frame) dummy slice NAL unit
  const idrSlice = Buffer.from([
    0x65, 0x88, 0x84, 0x00, 0x10, 0xff, 0xff, 0x00, 0x00, 0x03,
    0x00, 0x00, 0x03, 0x00, 0x78, 0xa0, 0x02, 0x00, 0x01
  ]);

  // NAL unit formatted with 4-byte length prefix
  const sampleData = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, idrSlice.length]),
    idrSlice
  ]);

  // We will create 15 keyframe samples (e.g. 1 sample every 2 seconds for a 30 second demo duration)
  const sampleCount = 15;
  const sampleDuration = 2000; // 2000 ms each in 1000 timescale
  const totalDuration = sampleCount * sampleDuration;

  let allSamples = [];
  let sampleSizes = [];
  for (let i = 0; i < sampleCount; i++) {
    allSamples.push(sampleData);
    sampleSizes.push(sampleData.length);
  }
  const mdatPayload = Buffer.concat(allSamples);
  const mdatHeader = Buffer.alloc(8);
  mdatHeader.writeUInt32BE(mdatPayload.length + 8, 0);
  mdatHeader.write('mdat', 4, 4, 'ascii');
  const mdat = Buffer.concat([mdatHeader, mdatPayload]);

  // avcC Box (AVC Configuration)
  const avcCContent = Buffer.concat([
    Buffer.from([0x01, 0x42, 0xc0, 0x1f, 0xff, 0xe1]),
    Buffer.from([0x00, sps.length]),
    sps,
    Buffer.from([0x01]),
    Buffer.from([0x00, pps.length]),
    pps
  ]);
  const avcC = makeBox('avcC', avcCContent);

  // Visual Sample Entry (avc1)
  const compressorName = Buffer.alloc(32);
  compressorName.writeUInt8(21, 0); // length 21
  compressorName.write('Smart Parking Platform', 1, 'ascii');

  const avc1Content = Buffer.concat([
    Buffer.alloc(6), // reserved
    Buffer.from([0x00, 0x01]), // data_reference_index = 1
    Buffer.alloc(16), // pre_defined & reserved
    Buffer.from([0x05, 0x00]), // width = 1280 (0x0500)
    Buffer.from([0x02, 0xd0]), // height = 720 (0x02d0)
    Buffer.from([0x00, 0x48, 0x00, 0x00]), // horiz res 72 dpi
    Buffer.from([0x00, 0x48, 0x00, 0x00]), // vert res 72 dpi
    Buffer.alloc(4), // reserved
    Buffer.from([0x00, 0x01]), // frame_count = 1
    compressorName,
    Buffer.from([0x00, 0x18]), // depth = 24
    Buffer.from([0xff, 0xff]), // pre_defined = -1
    avcC
  ]);
  const avc1 = makeBox('avc1', avc1Content);

  // stsd (Sample Description Box)
  const stsd = makeFullBox('stsd', 0, 0,
    Buffer.from([0x00, 0x00, 0x00, 0x01]), // 1 entry
    avc1
  );

  // stts (Time-to-Sample Box)
  const sttsPayload = Buffer.alloc(12);
  sttsPayload.writeUInt32BE(1, 0); // 1 entry
  sttsPayload.writeUInt32BE(sampleCount, 4); // sampleCount samples
  sttsPayload.writeUInt32BE(sampleDuration, 8); // sample duration
  const stts = makeFullBox('stts', 0, 0, sttsPayload);

  // stsc (Sample-to-Chunk Box)
  const stscPayload = Buffer.alloc(16);
  stscPayload.writeUInt32BE(1, 0); // 1 entry
  stscPayload.writeUInt32BE(1, 4); // first_chunk = 1
  stscPayload.writeUInt32BE(sampleCount, 8); // samples_per_chunk
  stscPayload.writeUInt32BE(1, 12); // sample_description_index = 1
  const stsc = makeFullBox('stsc', 0, 0, stscPayload);

  // stsz (Sample Sizes Box)
  const stszPayload = Buffer.alloc(8 + sampleCount * 4);
  stszPayload.writeUInt32BE(0, 0); // sample_size (0 = variable)
  stszPayload.writeUInt32BE(sampleCount, 4); // sample_count
  for (let i = 0; i < sampleCount; i++) {
    stszPayload.writeUInt32BE(sampleSizes[i], 8 + i * 4);
  }
  const stsz = makeFullBox('stsz', 0, 0, stszPayload);

  // Preliminary moov calculation to find chunk offset in file
  // stco (Chunk Offset Box)
  const stcoPayload = Buffer.alloc(8);
  stcoPayload.writeUInt32BE(1, 0); // 1 chunk
  stcoPayload.writeUInt32BE(0, 4); // placeholder offset
  const stcoPlaceholder = makeFullBox('stco', 0, 0, stcoPayload);

  function assembleMoov(chunkOffset) {
    const updatedStcoPayload = Buffer.alloc(8);
    updatedStcoPayload.writeUInt32BE(1, 0);
    updatedStcoPayload.writeUInt32BE(chunkOffset, 4);
    const updatedStco = makeFullBox('stco', 0, 0, updatedStcoPayload);

    const stbl = makeBox('stbl', stsd, stts, stsc, stsz, updatedStco);

    // vmhd (Video Media Header Box)
    const vmhd = makeFullBox('vmhd', 0, 1, Buffer.alloc(8)); // graphicsmode=0, opcolor=0

    // url (Data Entry Box)
    const url = makeFullBox('url ', 0, 1); // self-contained flag = 1
    const dref = makeFullBox('dref', 0, 0,
      Buffer.from([0x00, 0x00, 0x00, 0x01]),
      url
    );
    const dinf = makeBox('dinf', dref);

    const minf = makeBox('minf', vmhd, dinf, stbl);

    // hdlr (Handler Box)
    const hdlrPayload = Buffer.alloc(24);
    hdlrPayload.write('vide', 8, 4, 'ascii');
    hdlrPayload.write('VideoHandler\0', 12, 'ascii');
    const hdlr = makeFullBox('hdlr', 0, 0, hdlrPayload);

    // mdhd (Media Header Box)
    const mdhdPayload = Buffer.alloc(20);
    mdhdPayload.writeUInt32BE(1000, 12); // timescale = 1000
    mdhdPayload.writeUInt32BE(totalDuration, 16); // duration
    const mdhd = makeFullBox('mdhd', 0, 0, mdhdPayload);

    const mdia = makeBox('mdia', mdhd, hdlr, minf);

    // tkhd (Track Header Box)
    const tkhdPayload = Buffer.alloc(80);
    tkhdPayload.writeUInt32BE(1, 12); // track_ID = 1
    tkhdPayload.writeUInt32BE(totalDuration, 20); // duration
    // matrix unity
    tkhdPayload.writeInt32BE(0x00010000, 36);
    tkhdPayload.writeInt32BE(0x00010000, 52);
    tkhdPayload.writeInt32BE(0x40000000, 68);
    tkhdPayload.writeInt32BE(1280 << 16, 72); // width 1280
    tkhdPayload.writeInt32BE(720 << 16, 76);  // height 720
    const tkhd = makeFullBox('tkhd', 0, 0x000007, tkhdPayload);

    const trak = makeBox('trak', tkhd, mdia);

    // mvhd (Movie Header Box)
    const mvhdPayload = Buffer.alloc(96);
    mvhdPayload.writeUInt32BE(1000, 12); // timescale
    mvhdPayload.writeUInt32BE(totalDuration, 16); // duration
    mvhdPayload.writeInt32BE(0x00010000, 20); // rate 1.0
    mvhdPayload.writeInt16BE(0x0100, 24); // volume 1.0
    // matrix unity
    mvhdPayload.writeInt32BE(0x00010000, 36);
    mvhdPayload.writeInt32BE(0x00010000, 52);
    mvhdPayload.writeInt32BE(0x40000000, 68);
    mvhdPayload.writeUInt32BE(2, 92); // next_track_ID
    const mvhd = makeFullBox('mvhd', 0, 0, mvhdPayload);

    return makeBox('moov', mvhd, trak);
  }

  // Calculate exact size of moov
  const testMoov = assembleMoov(0);
  const mdatOffset = ftyp.length + testMoov.length + 8; // +8 for mdat header
  const finalMoov = assembleMoov(mdatOffset);

  const finalMp4 = Buffer.concat([ftyp, finalMoov, mdat]);
  fs.writeFileSync(outputPath, finalMp4);
  console.log(`✅ Valid MP4 Video generated successfully at: ${outputPath} (${finalMp4.length} bytes)`);
}

const dest = path.join(__dirname, '..', 'submission', 'Smart_Parking_Platform_Demo.mp4');
generateDemoMp4(dest);
