import React, { Component } from "react";
import { Card } from "./card";
import { DeckScore } from "./DeckScore";
import "./style.css";

type PracticeDeckProps = {
  // name of the deck
  name: string,

  // deck's cards
  cards: Card[],

  // callback to FlashcardApp for when deck + score report is complete
  onFinish: () => void,

  // callback to FlashcardApp to edit (& maybe save) current deck
  onEdit: (name: string) => void,

  onTest: (name: string, cards: Card[]) => void
}

type PracticeDeckState = {
  // how many questions user has gotten correct/incorrect
  correct: bigint,
  incorrect: bigint,

  // current card being displayed
  currCardIndex: number,

  // whether currCard's front or back is currently displayed
  isFront: boolean;

  // current text being displayed (either current card's front or back)
  text: string
}

/** Displays the current deck being practiced. */
export class PracticeDeck extends Component<PracticeDeckProps, PracticeDeckState> {

  constructor(props: PracticeDeckProps) {
    super(props);

    this.state = {correct: 0n, incorrect: 0n, currCardIndex: 0, isFront: true, text: this.props.cards[0].front};
  }

  render = (): JSX.Element => {
    if (this.state.currCardIndex < this.props.cards.length) {   
      return (<div className="practice">
        <h2>{this.props.name}</h2>
        <h3 className="h3">Correct: {this.state.correct.toString()} | Incorrect: {this.state.incorrect.toString()}</h3>
        <div style={{marginTop: '15px'}}>
        <input type="text" className="card" value={this.state.text} readOnly />
        </div>
        <br/>  
        <button type="button" className="buttonpractice" onClick={this.doFlipClick}>Flip</button>
        <button type="button" className="buttonpractice" onClick={this.doCorrectClick}>Correct</button>
        <button type="button" className="buttonpractice" onClick={this.doIncorrectClick}>Incorrect</button>
        <button type="button" className="buttonpractice" onClick={this.doEditClick}>Edit deck</button>
        <button type="button" className="buttonpractice" onClick={this.doTestClick}>MCQ test</button>
      </div>)
    } else {
      // Deck complete: show final scores
      return <DeckScore name={this.props.name} correct={this.state.correct} incorrect={this.state.incorrect}
                        totalCards={this.props.cards.length} onFinish={this.props.onFinish} />;
    }
    
  };

  doTestClick = (): void => {
    this.props.onTest(this.props.name, this.props.cards);
  }

  // Edit the deck -- go to NewDeck page but load prev deck into textbox
  doEditClick = (): void => {
    // passing in deck name
    // FlashcardApp is responsible for retrieving unparsed string format of deck
    this.props.onEdit(this.props.name);
  }
  
  // Flip the card
  doFlipClick = (): void => {
    const card = this.props.cards[this.state.currCardIndex];
    if (this.state.isFront) {
      this.setState({text: card.back, isFront: false});
    } else {
      this.setState({text: card.front, isFront: true});
    }
  };

  // Increment correct count
  doCorrectClick = (): void => {
    const correct = this.state.correct + 1n;
    const index = this.state.currCardIndex + 1;
    this.setState({correct: correct, currCardIndex: index, isFront: true});

    // make sure index is not out of bounds
    if (index < this.props.cards.length) {
      this.setState({text: this.props.cards[index].front});
    }
  };

  // Increment incorrect count
  doIncorrectClick = (): void => {
    const incorrect = this.state.incorrect + 1n;
    const index = this.state.currCardIndex + 1;
    this.setState({incorrect: incorrect, currCardIndex: index, isFront: true});

    // make sure index is not out of bounds
    if (index < this.props.cards.length) {
      this.setState({text: this.props.cards[index].front});
    }
  };
}