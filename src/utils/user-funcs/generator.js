import { ADJECTIVES, NOUNS } from "../wordsArray.js";

const generator = async () => {
  const nounsArray = NOUNS;
  const adjectivesArray = ADJECTIVES;
  const noun = nounsArray[Math.floor(Math.random() * nounsArray.length)];
  const adjective =
    adjectivesArray[Math.floor(Math.random() * adjectivesArray.length)];
  const number = Math.floor(Math.random() * 100);
  const adjNounNum = adjective + noun + number;
  const username = adjNounNum.replace(" ", "");
  return username;
};

export default generator;
