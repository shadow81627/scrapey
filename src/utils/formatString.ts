import he from 'he';
import _ from 'lodash';
import { normalizeWhiteSpaces } from 'normalize-text';
import pipe from './pipe';

function formatString(value: string): string {
  const removeDuplicateSpaces = (str: string) => str.replace(/\s+/g, ' ');
  const removeHtml = (str: string) => str.replace(/(<([^>]+)>)/gi, '');
  const replaceFractionSlash = (str: string) =>
    str
      .normalize('NFKD')
      .replace(/(\d)⁄(\d+)/g, ' $1/$2 ')
      .normalize();
  const removeDuplicateParenthesis = (str: string) =>
    str.replace(/([()])(?=[()])/g, '');
  const removeDuplicatePunctuation = (str: string) =>
    str.replace(/([.!?,;])(?=[.!?,;])/g, '');
  const removeSpaceBeforePunctuation = (str: string) =>
    str.replace(/\s+([.!?,;])/g, '$1');

  return pipe(
    String,
    he.decode,
    removeHtml,
    replaceFractionSlash,
    // normalizeDiacritics,
    normalizeWhiteSpaces,
    removeDuplicateSpaces,
    removeDuplicateParenthesis,
    removeSpaceBeforePunctuation,
    removeDuplicatePunctuation,
    // punctuation,
    _.trim,
  )(value);
}

export default formatString;
