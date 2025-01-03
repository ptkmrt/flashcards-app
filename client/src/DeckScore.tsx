import React, { ChangeEvent, Component } from "react";
import { isRecord } from "./record";
import "./style.css";

type DeckScoreProps = {
  // name of deck
  name: string,
  
  // num correct and incorrect
  correct: bigint,
  incorrect: bigint,
  
  // total cards in deck
  totalCards: number

  // callback
  onFinish: () => void;
}

type DeckScoreState = {
  // name of user who completed deck
  user: string,

  // user's final score
  score: number
}

export class DeckScore extends Component<DeckScoreProps, DeckScoreState> { 

  constructor(props: DeckScoreProps) {
      super(props);
  
      this.state = {user: "", score: 0};
  }

  render = (): JSX.Element => {
    return (<div className="result">
      <h2> {this.props.name} </h2>
      <h3> Correct: {this.props.correct.toString()} | Incorrect: {this.props.incorrect.toString()} </h3>
      <p> End of quiz</p>
      <label className="label">
          Enter name: <input name="user" value={this.state.user} onChange={this.doNameChange} />
      </label>
      <button type="button" className="button" onClick={this.doFinishClick}>Finish</button>
    </div>)
  };

  // Display the name user inputs
  doNameChange = (evt: ChangeEvent<HTMLInputElement>): void => { 
    this.setState({user: evt.target.value}); 
  };

  doFinishClick = (): void => {
    // calculate final score
    const score = Math.round(Number(this.props.correct) /this.props.totalCards * 100);
    this.setState({score: score});

    // send user + deck name + score to server
    fetch("/api/score", {
      method: "POST", body: JSON.stringify({user: this.state.user, name: this.props.name, score: score.toString()}),
      headers: {"Content-Type": "application/json"} })
    .then(this.doFinishResp)
    .catch(() => this.doFinishError("failed to connect to server"));
  };

  doFinishResp = (resp: Response): void => {
    if (resp.status === 200) {
      resp.json().then(this.doFinishJson)
          .catch(() => this.doFinishError("200 response is not JSON"));
    } else if (resp.status === 400) {
      resp.text().then(this.doFinishError)
          .catch(() => this.doFinishError("400 response is not text"));
    } else {
      this.doFinishError(`bad status code from /api/score: ${resp.status}`);
    }
  };

  doFinishJson = (data: unknown): void => {
    if (!isRecord(data)) {
      console.error("bad data from /api/score: not a record", data);
      return;
    }

    // return to main page
    this.props.onFinish();
  };

  doFinishError = (msg: string): void => {
    console.error("Error fetching /score: ", msg);
  };
}