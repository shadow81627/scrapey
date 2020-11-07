import probe from 'probe-image-size';

interface ImageMeta {
  height?: number;
  width?: number;
  mime?: string;
}

export default class ImageObject implements ImageMeta {
  '@type'?= 'ImageObject';
  url: string;
  height?: number;
  width?: number;
  mime?: string;

  constructor({ url, ...data }: ImageObject) {
    Object.assign(this, data);
    this.url = url;
  }

  public static async fetchMeta(url: string): Promise<ImageMeta> {
    const { width, height, mime } = await probe(url);
    return { width, height, mime };
  }
}
