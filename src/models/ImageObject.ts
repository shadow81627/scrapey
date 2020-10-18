export default class ImageObject {
  '@type': 'ImageObject';
  height?: number;
  url: string;
  width?: number;

  constructor({ url, ...data }: ImageObject) {
    Object.assign(this, data);
    this.url = url;
  }
}
