import _ from 'lodash';
import HowToSection from '../models/HowToSection';
import HowToStep from '../models/HowToStep';
import formatString from './formatString';

export default function parseInstructions(
  instructions: string | Array<string | HowToSection | HowToStep>,
): Array<HowToStep> {
  if (typeof instructions === 'string') {
    return (
      formatString(instructions)
        .match(/[^.!?]+[.!?]+[^)]/g)
        ?.map((text) => new HowToStep({ text })) || []
    );
  }
  if (Array.isArray(instructions)) {
    const head = _.head(instructions) as HowToSection;
    if (head && head.itemListElement) {
      return head.itemListElement as Array<HowToStep>;
    } else {
      return instructions as Array<HowToStep>;
    }
  }
  return instructions;
}
