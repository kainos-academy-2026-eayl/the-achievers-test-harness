import { randomUUID } from "node:crypto";

export interface ImageFile {
	name: string;
	mimeType: string;
	buffer: Buffer;
}

// The backend checks magic bytes, so a signature followed by unique filler is a valid upload.
const PNG_SIGNATURE = Buffer.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

export function pngFile(): ImageFile {
	return {
		name: "cue.png",
		mimeType: "image/png",
		buffer: Buffer.concat([PNG_SIGNATURE, Buffer.from(randomUUID())]),
	};
}

export function jpegFile(): ImageFile {
	return {
		name: "cue.jpg",
		mimeType: "image/jpeg",
		buffer: Buffer.concat([JPEG_SIGNATURE, Buffer.from(randomUUID())]),
	};
}

export function unsupportedFile(): ImageFile {
	return {
		name: "notes.txt",
		mimeType: "text/plain",
		buffer: Buffer.from("These are notes, not an image."),
	};
}
