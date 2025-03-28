import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
// import axios from "axios";


// Require type checking of request body.
type SafeRequest = Request<ParamsDictionary, {}, Record<string, unknown>>;
type SafeResponse = Response;  // only writing, so no need to check

const decks: Map<string, Card[]> = new Map();
const decksUnparsed: Map<string, string> = new Map();
const scores: Score[] = [];

require('dotenv').config();  // Load variables from .env file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type Card = {
  front: string,
  back: string
};

type Score = {
  user: string,  // name of person
  name: string,  // name of deck
  score: string  // final score
};

/** Handles request for /addDeck by storing a newly created deck. */
export const addDeck = (req: SafeRequest, res: SafeResponse): void => {
  const name = req.body.name;
  if (name === undefined || name === "" || typeof name !== 'string') {
    res.status(400).send('save: invalid "name" parameter');
    return;
  }

  const cards = req.body.cards;
  if (cards === undefined || cards === "" || typeof cards !== 'string') {
    res.status(400).send('save: invalid "cards" parameter');
    return;
  } 
  
  // store the passed in contents in the map
  const parsed = parseCards(cards);
  decks.set(name, parsed[0]);
  decksUnparsed.set(name, parsed[1]);

  // return a record of new deck (in format matching type Deck)
  res.send({name: name, cards: cards});
}

/** Handles request for /addScore by storing someone's final score report on a deck. */
export const addScore = (req: SafeRequest, res: SafeResponse): void => {
  const user = req.body.user;
  const name = req.body.name;
  const score = req.body.score;

  if (user === undefined || user === '' || typeof user !== 'string') {
    res.status(400).send('score: invalid "user" parameter');
    return;
  }

  if (name === undefined || name === '' || typeof name !== 'string') {
    res.status(400).send('score: invalid "name" parameter');
    return;
  }

  if (score === undefined || score === '' || typeof score !== 'string') {
    res.status(400).send('score: invalid "score" parameter');
    return;
  }

  // store the information as a Score
  scores.push({user: user, name: name, score: score});

  // return a record of information
  res.send({user: user, name: name, score: score});
}

/** Helper function to transform cards string into Card[] to save in map */
// Invalid inputs are SKIPPED (e.g. no divider |, or front and/or back is missing)
export const parseCards = (cardsStr: string): [Card[], string] => {
  let cards: Card[] = [];  
  let modString = "";
  const lines = cardsStr.split('\n');

  for (const line of lines) {
    const divider = line.indexOf('|');
    if (divider === -1) continue;

    const front = line.substring(0, divider);
    const back = line.substring(divider + 1);
    if (front === "" || back === "") continue;

    cards.push({front: front, back: back});
    modString += front + "|" + back + "\n";
  }
  
  return [cards, modString];
};

/** Handles request for /load by returning the desired deck's flashcards */
export const loadDeck = (req: SafeRequest, res: SafeResponse): void => {
  const name = first(req.query.name);

  if (name === undefined) {
    res.status(400).send('load: missing "name" parameter for deck');
  } else if (!decks.has(name)){
    res.status(404).send('load: given deck name does not exist');
  } else {
    res.send({name: name, value: decks.get(name)});
  }
}

/** Handles request for /edit by returning the desired deck's flashcards as string */
export const editDeck = (req: SafeRequest, res: SafeResponse): void => {
  const name = first(req.query.name);

  if (name === undefined) {
    res.status(400).send('edit: missing "name" parameter for deck');
  } else if (!decks.has(name)){
    res.status(404).send('edit: given deck name does not exist');
  } else {
    res.send({name: name, value: decksUnparsed.get(name)});
  }
}

/** Handles request for /generate by AI generating desired deck
 * req contains text to generate from flashcards from, desired title, and num cards
 */
export const generateDeck = (req: SafeRequest, res: SafeResponse): void => {
  const text = req.body.text;
  const num = req.body.num;

  if (text === undefined || text === '' || typeof text !== 'string') {
    res.status(400).send('generate: invalid "text" parameter - file not uploaded or erroneous upload.');
    return;
  }

  if (num === undefined) {
    res.status(400).send('generate: invalid "num" parameter');
    return;
  }

  // generate cards
  // const question_only_prompt = "Generate " + String(num) + " questions about: " + text;
  const question_answer_prompt = "Generate " + String(num) + " question-answer pairs about the following text, " +
                                 "formatted as <question>|<answer>, each pair on its own line: " + text;

  getModelOutput(question_answer_prompt)
    .then((result) => {
      console.log("Generated text:", result);
      res.send({text: result});
    })
    .catch((error) => {
      console.error("Failed to generate text:", error);
    });
}

/** Returns a list of all saved deck names */
export const listDecks = (_req: SafeRequest, res: SafeResponse): void => {
  res.send({values: Array.from(decks.keys())});
}

/** Returns a list of all saved score details */
export const listScores = (_req: SafeRequest, res: SafeResponse): void => {
  res.send({values: scores});
}

// Helper to return the (first) value of the parameter if any was given.
// (This is mildly annoying because the client can also give mutiple values,
// in which case, express puts them into an array.)
const first = (param: unknown): string|undefined => {
  if (Array.isArray(param)) {
    return first(param[0]);
  } else if (typeof param === 'string') {
    return param;
  } else {
    return undefined;
  }
};

/** Used in tests to set the files map back to empty. */
export const resetForTesting = (): void => {
  decks.clear();
  scores.splice(0, scores.length);
};


async function getModelOutput (input: string): Promise<string> {
  const { GoogleGenerativeAI } = require("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = input;

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  return result.response.text();
}