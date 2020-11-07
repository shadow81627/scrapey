export default class ImageObject {
  '@type'?= 'ImageObject';
  url: string;
  height?: number;
  width?: number;
  mime?: string;

  constructor({ url, ...data }: ImageObject) {
    Object.assign(this, data);
    this.url = url;
  }
}
