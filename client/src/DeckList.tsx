import React, { Component, MouseEvent } from "react";
import { Score } from "./score";
import { isRecord } from "./record";
import "./style.css";


type DeckListProps = {
  onNew: (names: string[]) => void;
  onPractice: (deck: string) => void;
}

type DeckListState = {
  // list of user scores for decks
  scores: Score[];

  // names of all current decks
  decks: string[];
}

// Displays the main page of the Flashcard application.
export class DeckList extends Component<DeckListProps, DeckListState> {

  constructor(props: DeckListProps) {
    super(props);

    this.state = {decks: [], scores: []};
  }

  render = (): JSX.Element => {
    return (<div className="style">
      <h1> Flip The Bit </h1>
      <div className="list"> 
        <h2 className="h2"> Flashcard Sets </h2>
        {this.renderNames()}
      </div>
      <button type="button" className="button" onClick={this.doNewClick}>Create a new deck</button>
      <div className="list"> 
        <h2 className="h2"> Scores </h2>
        {this.renderScores()}
      </div>
    </div>)
  };

  // Render deck names
  renderNames = (): JSX.Element => {
    // Fetch deck names
    fetch("api/listDecks")
      .then(this.doListDecksResp)
      .catch(() => this.doListError("list failed"));
      
    // process into proper display format
      const deckNames: JSX.Element[] = [];
    for (const [index, deck] of this.state.decks.entries()) {
      deckNames.push(<li key={index}>
        <a href="#" onClick={() => this.doPracticeClick(deck)}>{deck}</a>
        </li>);
    }     
    return <ul>{deckNames}</ul>;
  };

  doListDecksResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doListDecksJson);
    } else if (res.status === 400) {
      res.text().then(this.doListError)
        .catch(() => this.doListError("400 response is not text"));
    } else {
      this.doListError(`bad status code ${res.status}`);
    }  
  };

  doListDecksJson = (data: {values: string[]}): void => {
    if (!isRecord(data)) {
      console.error("bad data from /listDecks: not a record", data);
      return;
    }

    this.setState({decks: data.values });
  };

  doListError = (msg: string): void => {
    console.error("Error fetching /listDecks and/or /listScores: ", msg);
  };

  renderScores = (): JSX.Element => {
    // Fetch scores
    fetch("api/listScores")
      .then(this.doListScoresResp)
      .catch(() => this.doListError("list failed"));

    if (this.state.scores === undefined) {
      return <p>Loading scores...</p>;
    }
      
    // process into proper display format
    const scores: JSX.Element[] = [];
    for (const [index, score] of this.state.scores.entries()) {
      scores.push(<li key={index}>
        <p>{score.user}, {score.name}: {score.score.toString()}</p>
        </li>);
    }     
    return <ul>{scores}</ul>;
  };

  doListScoresResp = (res: Response): void => {
    if (res.status === 200) {
      res.json().then(this.doListScoresJson);
    } else if (res.status === 400) {
      res.text().then(this.doListError)
        .catch(() => this.doListError("400 response is not text"));
    } else {
      this.doListError(`bad status code ${res.status}`);
    }  
  };

  doListScoresJson = (data: { values: Score[] }): void => {
    if (!isRecord(data)) {
      console.error("bad data from /listScores: not a record", data);
      return;
    }

    this.setState({ scores: data.values });
  };

  doNewClick = (_: MouseEvent<HTMLButtonElement>): void => {
    this.props.onNew(this.state.decks);
  };

  doPracticeClick = (deck: string): void => {
    this.props.onPractice(deck);
  }
}
