export default function parseDuration(duration: string): string {
  return `PT${((duration || '').match(/(\d+)/g) || [''])[0]}${(duration || '').search('mins') ? 'M' : 'H'
    }`;
}
