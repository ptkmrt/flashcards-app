import React, { Component } from "react";
import { NewDeck } from "./NewDeck";
import { DeckList } from "./DeckList";
import { isRecord } from "./record";
import { Card } from "./card";
import { PracticeDeck } from "./PracticeDeck";
import { TestDeck } from "./TestDeck";

// Whether to show debugging information in the console.
const DEBUG: boolean = false;

// To indicate which page is showing
type Page = {kind: "list"} 
             // names: names of saved decks
             // deckToModify: [name of deck to edit, string format of its cards], if applicable
             // editingMode: whether or not we are editing a previously saved deck
          | {kind: "new", names: string[], deckToModify: [string, string], editingMode: boolean}
          | {kind: "practice", name: string, cards: Card[]}  // name: name of deck to practice
          | {kind: "test", name: string, cards: Card[]}

type FlashcardAppState = {
  page: Page
}


/** Displays the UI of the Flashcard application. */
export class FlashcardApp extends Component<{}, FlashcardAppState> {

  constructor(props: {}) {
    super(props);

    this.state = {page: {kind: "list"}};
  }
  
  render = (): JSX.Element => {
    if (this.state.page.kind === "list") {
      return <DeckList onNew={this.doNewClick} onPractice={this.doPracticeClick} />;
    }
    else if (this.state.page.kind === "new") {
      return <NewDeck names={this.state.page.names} 
                      deckToModify={this.state.page.deckToModify}
                      editingMode={this.state.page.editingMode}
                      onAdd={this.doAddClick} 
                      onBack={this.doBackClick} />;
    } else if (this.state.page.kind === "test") {
      return <TestDeck name={this.state.page.name} cards={this.state.page.cards} onFinish={this.doFinishClick}/>;
    }
    else { // practice
      return <PracticeDeck name={this.state.page.name} cards={this.state.page.cards} onFinish={this.doFinishClick}
              onEdit={this.doEditClick} onTest={this.doTestClick} />;
    }
  };

  doTestClick = (name: string, cards: Card[]): void => {
    this.setState({page: {kind: "test", name: name, cards: cards}});
  };

  // To create a new deck
  // names param contains names of all pre-existing decks
  doNewClick = (names: string[]): void => {
    if (DEBUG) console.debug("set state to new");
    this.setState({page: {kind: "new", names: names, deckToModify: ["", ""], editingMode: false}});
  };

  // To edit an existing deck
  // name param indicates which deck to edit (note: a deck's name CANNOT be modified, only its contents)
  doEditClick = (name: string): void => {
    // retrieve unparsed, string format of cards
    const url = `api/edit?name=${encodeURIComponent(name)}`;
    fetch(url)
      .then(this.doEditResp)
      .catch(() => this.doEditError("edit failed"));
  }

  doEditResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doEditJson);
    } else if (res.status === 400) {
      res.text().then(this.doEditError)
        .catch(() => this.doEditError("400 response is not text"));
    } else {
      this.doEditError(`bad status code ${res.status}`);
    }
  }

  doEditJson = (data: {name: string, value: string}): void => {
    if (!isRecord(data)) {
      console.error("bad data from /edit: not a record", data);
      return;
    }

    if (typeof data.value !== 'string') {
      console.error("bad data from /edit: cards is not a string.");
    }

    this.setState({page: {kind: "new", names: [], deckToModify: [data.name, data.value], editingMode: true}});
  }

  doEditError = (msg: string): void => {
    console.error("Error fetching /edit: ", msg);
  }
  
  // To practice a deck
  doPracticeClick = (deck: string): void => {
    if (DEBUG) console.debug(`set state to practice "${deck}"`);

    const url = `api/load?name=${encodeURIComponent(deck)}`;
    fetch(url)
      .then(this.doLoadResp)
      .catch(() => this.doLoadError("load failed"));
  };

  doLoadResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doLoadJson);
    } else if (res.status === 400) {
      res.text().then(this.doLoadError)
        .catch(() => this.doLoadError("400 response is not text"));
    } else {
      this.doLoadError(`bad status code ${res.status}`);
    }
  }

  doLoadJson = (data: {name: string, value: Card[]}): void => {
    if (!isRecord(data)) {
      console.error("bad data from /load: not a record", data);
      return;
    }

    if (data.value === undefined) {
      console.error("bad data from /load: cards is undefined.");
    }

    this.setState({page: {kind: "practice", name: data.name, cards: data.value}});
  }

  doLoadError = (msg: string): void => {
    console.error("Error fetching /load: ", msg);
  }
  
  // To save a deck then go back to start page
  doAddClick = (): void => {
    if (DEBUG) console.debug("deck was saved in NewDeck. set state to list");
    this.setState({page: {kind: "list"}});
  };
  
  // To go back to start page, without saving
  doBackClick = (): void => {
    if (DEBUG) console.debug("going back w/o saving. set state to list");
    this.setState({page: {kind: "list"}});
  };

  // To save user's name and score for a deck after completing it
  doFinishClick = (): void => {
    if (DEBUG) console.debug("finished a deck: set state to list");
    this.setState({page: {kind: "list"}});
  }
}