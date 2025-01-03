import React, { Component } from "react";
import { Card } from "./card";
import "./style.css";
import { DeckScore } from "./DeckScore";

type TestDeckProps = {
  // name of the deck
  name: string,

  // deck's cards
  cards: Card[],

  onFinish: () => void
}

type TestDeckState = {
  // array of [Card, 4 answer options for card's front]
  questions: [Card, JSX.Element][],

  // number correct, updated dynamically
  score: bigint,

  // index into questions for current question
  index: number,
}

export class TestDeck extends Component<TestDeckProps, TestDeckState> {

    constructor(props: TestDeckProps) {
      super(props);

      let choices = [];
      for (const card of this.props.cards) {
        choices.push(card.back);
      }

      let questions: [Card, JSX.Element][] = [];
      const shuffledDeck = this.shuffle(this.props.cards);
      for (const card of shuffledDeck) {
        const options = this.renderChoices(choices, card.back);
        questions.push([card, options]);
      }
  
      this.state = {questions: questions, score: 0n, index: 0};
    }
  
    render = (): JSX.Element => {
      if (this.state.index === this.state.questions.length) {
        return <DeckScore name={this.props.name} correct={this.state.score} 
                          incorrect={BigInt(this.state.questions.length) - this.state.score}
                          totalCards={this.props.cards.length} onFinish={this.props.onFinish} />;
      } else {
        return (<div>
          <h2> {this.props.name} </h2>
          <input type="text" value={this.state.questions[this.state.index][0].front} readOnly/>
          <div> {this.state.questions[this.state.index][1]} </div>
          <button type="button" className="buttonpractice" onClick={this.doPrevClick}>Previous</button>
          <button type="button" className="buttonpractice" onClick={this.doNextClick}>Next</button>
        </div>);
      }
    };

    // go to next question
    doNextClick = (): void => {
      this.setState({index: this.state.index + 1});
    }

    // go to prev question
    doPrevClick = (): void => {
      this.setState({index: this.state.index - 1});
    }

    // shuffles given array
    shuffle = (array: any[]): any[] => {
      let currentIndex = array.length;
      let randomIndex = -1;

      // While there remain elements to shuffle
      while (currentIndex > 0) {

        // Pick a remaining element
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // Swap it with the current element
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }

      return array;
    };

    // Randomly choose 3 answer options for current question
    // Render as buttons with onClick event
    renderChoices = (choices: string[], answer: string): JSX.Element => {
      let options = [answer];
      let i = 0;

      while (i < 3) {
        const index = Math.floor(Math.random() * choices.length);
        const choice = choices[index];

        // check choice will be unique addition
        if (options.indexOf(choice) === -1) {
          options.push(choice);
          i += 1;
        }
      }

      // return 4 buttons for options
      const shuffledChoices = this.shuffle(options);
      return (<div>
          <button type="button" className="choice" 
              onClick={() => this.doSelectClick(shuffledChoices[0])}>{shuffledChoices[0]}</button>
          <button type="button" className="choice" 
              onClick={() => this.doSelectClick(shuffledChoices[1])}>{shuffledChoices[1]}</button>
          <button type="button" className="choice" 
              onClick={() => this.doSelectClick(shuffledChoices[2])}>{shuffledChoices[2]}</button>
          <button type="button" className="choice" 
              onClick={() => this.doSelectClick(shuffledChoices[3])}>{shuffledChoices[3]}</button>
        </div>);
    }

    // Update score as needed
    doSelectClick = (choice: string): void => {
      // if option that was clicked matches question's (front's) back, increment score
      if (choice === this.state.questions[this.state.index][0].back) {
        this.setState({score: this.state.score + 1n});
      }
    }
}