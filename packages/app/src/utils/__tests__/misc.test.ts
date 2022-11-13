import { describe, expect, it } from "vitest";
import { extractTimestamps, formatTimestamp, parseTimestamp } from "../misc";

describe("parseTimestamp", () => {
  it("basic", () => {
    expect(parseTimestamp("01:01:01.001")).toMatchInlineSnapshot("3661.001");
    expect(parseTimestamp("01:01.001")).toMatchInlineSnapshot("61.001");
  });

  it("error", () => {
    expect(() => parseTimestamp("01.001")).toThrow(/invalid timestamp/);
    expect(() => parseTimestamp("1")).toThrow(/invalid timestamp/);
    expect(() => parseTimestamp("x1y")).toThrow(/invalid timestamp/);
  });
});

describe("formatTimestamp", () => {
  it("basic", () => {
    expect(formatTimestamp(3661.001)).toMatchInlineSnapshot('"01:01:01.001"');
    expect(formatTimestamp(61.001)).toMatchInlineSnapshot('"00:01:01.001"');
    expect(formatTimestamp(1.001)).toMatchInlineSnapshot('"00:00:01.000"');
    expect(formatTimestamp(1)).toMatchInlineSnapshot('"00:00:01.000"');
  });
});

describe("extractTimestamps", () => {
  it("basic", () => {
    // pnpm -s ts ./src/misc/fetch-info.ts --id https://www.youtube.com/watch?v=rv4wf7bzfFE | jq .videoDetails.shortDescription
    const text =
      "VULFPECK /// Live at Madison Square Garden\nbuy on bandcamp → https://vulfpeck.bandcamp.com/ \n\n0:00 The Sweet Science\n2:18 Tee Time \n4:19 Animal Spirits \n7:55 Cory Wong \n12:38 My First Car \n15:42 Daddy, He Got a Tesla\n20:18 Arena Meditation \n24:22 Smile Meditation \n29:38 Running Away \n34:59 Baby I Don't Know Oh Oh\n38:53 1612 \n42:20 Funky Duck \n46:53 Aunt Leslie \n50:55 Wait For The Moment \n57:26 The Hill Climbers (Speech)\n1:02:25 Back Pocket\n1:08:44 Beastly \n1:15:50 Christmas in L.A. (Intro) \n1:21:25 Christmas in L.A.\n1:28:36 Dean Town \n1:33:10 Birds of a Feather\n1:39:09 It Gets Funkier \n1:41:40 Welcome to Vulf Records (Bows) \n\nPerformers\n\nMichael Winograd\nJack Stratton\nWoody Goss\nTheo Katzman\nCory Wong\nJoey Dosik\nRichie Rodriguez\nJoe Dart\nMelissa Gardiner\nAlice Stratton\nNate Smith\nDave Koz\nChris Thile\nCharles Jones\nRyan Lerman\nAntwaun Stanley\nMark Dover\nChris Grymes\n\nProducer\nJack Stratton\n\nMixing and Mastering\nCaleb Parker\n\nProduction Designer\nTricia Robertson\n\nArt Director\nMike Robertson\n\nLighting Director\nChristian Hall\n\nWall Art\nRence Mendoza\nVince Aparo\nHailey Kaufman\nMaybelle Pineda (tapestry artwork)\nAmber Vallance (www.ambervallance.com)\n\nCamera\nRyan Lerman\nTheo Katzman\n\nRecording and Front of House\nJake Hartsfield\n\nMonitors\nAustin Brucker\n\nFonts in Use\nEckmannpsych and Vulf Mono\nby OH no Type Company";
    expect(extractTimestamps(text)).toMatchInlineSnapshot(`
      [
        "0:00",
        "2:18",
        "4:19",
        "7:55",
        "12:38",
        "15:42",
        "20:18",
        "24:22",
        "29:38",
        "34:59",
        "38:53",
        "42:20",
        "46:53",
        "50:55",
        "57:26",
        "1:02:25",
        "1:08:44",
        "1:15:50",
        "1:21:25",
        "1:28:36",
        "1:33:10",
        "1:39:09",
        "1:41:40",
      ]
    `);
  });
});
