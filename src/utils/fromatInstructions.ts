import HowToSection from '../models/HowToSection';
import HowToStep from '../models/HowToStep';
import formatString from './formatString';

export default function fromatInstructions(
  instructions: Array<HowToStep | string | HowToSection>,
) {
  return (
    instructions
      // ensure instruction.text is a string
      .map(
        (instruction) =>
          new HowToStep(
            !instruction || typeof instruction === 'string'
              ? { text: instruction || '' }
              : instruction,
          ),
      )
      // add type
      .map((instruction) => ({ ...instruction, '@type': 'HowToStep' }))
      .map((instruction) => ({
        ...instruction,
        text: formatString(instruction.text),
      }))
      // rename stepImageUrl
      // TODO: check iamge is public
      .map((instruction) => ({
        ...instruction,
        image: instruction.image || instruction.stepImageUrl,
        stepImageUrl: undefined,
        url: undefined,
        name: undefined,
      }))
      // remove empty
      .filter(({ text }) => Boolean(text))
      // ensure ends with punctuation
      .map((instruction) => ({
        ...instruction,
        text: instruction.text,
        // .replace(/([^.!?])$/, '$1.')
        // remove whitespace before punctuation / non-word characters
        // .replace(/\s+(\W)/g, '$1'),
      }))
  );
}
