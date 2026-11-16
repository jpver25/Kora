import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import type { PackagingFrame } from '@/types/vision';

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err ?? new Error('No se pudo leer el tamaño de la imagen')),
    );
  });
}

/**
 * ProductDetection — locate packaging in a camera frame.
 *
 * Expo Go path: center ROI crop (no custom native ML).
 * Future Dev Client: swap `detectionMethod` to ML Kit object detection.
 */
export async function detectPackagingFrame(
  imageUri: string,
  options?: { strength?: number },
): Promise<PackagingFrame> {
  const strength = options?.strength ?? 0.72;
  const inset = (1 - strength) / 2;

  let width = 0;
  let height = 0;
  try {
    const size = await getImageSize(imageUri);
    width = size.width;
    height = size.height;
  } catch {
    // Fall through to resize-only path.
  }

  if (width > 0 && height > 0) {
    const crop = {
      originX: Math.round(width * inset),
      originY: Math.round(height * inset),
      width: Math.round(width * strength),
      height: Math.round(height * strength),
    };
    const cropped = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ crop }, { resize: { width: 768 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );
    return {
      uri: cropped.uri,
      width: cropped.width,
      height: cropped.height,
      crop: { originX: inset, originY: inset, width: strength, height: strength },
      detectionMethod: 'center_roi',
      confidence: 0.7,
    };
  }

  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 768 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return {
    uri: resized.uri,
    width: resized.width,
    height: resized.height,
    crop: { originX: inset, originY: inset, width: strength, height: strength },
    detectionMethod: 'center_roi',
    confidence: 0.55,
  };
}

/** Prepare a frame and return JPEG base64 for cloud OCR / embedding. */
export async function frameToBase64Jpeg(imageUri: string): Promise<{
  frame: PackagingFrame;
  base64: string;
  mimeType: 'image/jpeg';
}> {
  const frame = await detectPackagingFrame(imageUri);
  const withBase64 = await ImageManipulator.manipulateAsync(frame.uri, [], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!withBase64.base64) {
    throw new Error('No se pudo codificar el frame de empaque.');
  }
  return { frame, base64: withBase64.base64, mimeType: 'image/jpeg' };
}
