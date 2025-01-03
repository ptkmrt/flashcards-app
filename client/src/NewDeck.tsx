import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { isRecord } from './record';
import "./style.css";

type NewDeckProps = {
  // names of all pre-existing decks
  names: string[];

  // if applicable: deck to be edited [name, cards as unparsed string]
  deckToModify: [string, string];

  // whether or not we are editing previously-made deck
  editingMode: boolean;

  // callbacks
  onAdd: () => void;
  onBack: () => void;
};

type NewDeckState = {
  // name of the deck
  name: string,

  // deck's cards' content (to be parsed properly into a Card[])
  cards: string

  // for AI gen: input file from which to generate cards from
  file: File | null

  // for AI gen: parsed file content
  fileContent: string

  // for AI gen: number of cards to create
  num: number  // bigint?

  // error message to display, if needed
  error: string
};

/** Page for user to create a new flashcard deck. */
export class NewDeck extends Component<NewDeckProps, NewDeckState> {

  constructor(props: NewDeckProps) {
    super(props);
    if (this.props.editingMode === false) {
      this.state = {name: "", cards: "", error: "", file: null, fileContent: "", num: 0};
    } else {
      this.state = {name: this.props.deckToModify[0], 
                    cards: this.props.deckToModify[1],
                    error: "",
                    file: null,
                    fileContent: "",
                    num: 0};
    }
  }

  render = (): JSX.Element => {
    return (<div className="style">
      <h1>Create</h1>
      <label>
          Name: <input name="name" value={this.state.name} onChange={this.doNameChange} />
      </label>   
      <label>
          Number of cards: <input name="num" type="number" placeholder="Only for AI Gen"
                            min="1" max="20" 
                            value={this.state.num}
                            onInput={(e) => this.setState({ num: Number((e.target as HTMLInputElement).value) })} />
      </label>
      <br/>
      <br/>      
      <div>
        <label htmlFor="textbox">Options: one per line, formatted as front|back</label>
        <br/>
        <textarea id="textbox" rows={10} cols={80} value={this.state.cards} onChange={this.doCardsChange}>
        </textarea>
      </div>
      <button type="button" className="button" onClick={this.doAddClick}>Add</button>
      <button type="button" className="button" onClick={this.doBackClick}>Back</button>
      <button type="button" className="button" onClick={this.doGenClick}>Generate with AI</button>
      <br/>
      <div>
          <input type="file" onChange={this.doFileChange} />
          <button type="button" className="buttonupload" onClick={this.doUploadClick}>Upload file</button>
       </div>
      <div className="error">
        {this.renderError()}
      </div>
    </div>)
  };

  // Displays error if user entered anything incorrectly
  renderError = (): JSX.Element => {
    if (this.state.error.length === 0) {
      return <div></div>;
    } else {
      return <p> Error: {this.state.error}</p>
    }
  };

  // Creates and saves new deck
  doAddClick = (_evt: MouseEvent<HTMLButtonElement>): void => {
    // First check that name and card contents are valid
    // Note: invalid inputs in the content will be SKIPPED (e.g. no '|', no front and/or back)
    if (this.state.name === "") {
      this.setState({error: "name field cannot be empty."});
      return;
    } else if (this.props.names.includes(this.state.name)) {
      this.setState({error: "deck name already exists."});
      return;
    } else if (this.state.cards === "") {
      this.setState({error: "no cards entered."});
      return;
    }

    // Then fetch to add deck to server's deck list
    fetch("/api/add", {
      method: "POST", body: JSON.stringify({name: this.state.name, cards: this.state.cards}),
      headers: {"Content-Type": "application/json"} })
    .then(this.doAddResp)
    .catch(() => this.doAddError("failed to connect to server"));
  }

  doAddResp = (resp: Response): void => {
    if (resp.status === 200) {
      resp.json().then(this.doAddJson)
          .catch(() => this.doAddError("200 response is not JSON"));
    } else if (resp.status === 400) {
      resp.text().then(this.doAddError)
          .catch(() => this.doAddError("400 response is not text"));
    } else {
      this.doAddError(`bad status code from /api/add: ${resp.status}`);
    }
  };

  doAddJson = (data: unknown): void => {
    if (!isRecord(data)) {
      console.error("bad data from /api/add: not a record", data);
      return;
    }

    // return to main page, displaying updated list of decks
    this.props.onAdd();
  };

  doAddError = (msg: string): void => {
    this.setState({error: msg})
  };

  doBackClick = (_: MouseEvent<HTMLButtonElement>): void => {
    this.props.onBack();
  };

  // To generate deck with AI
  doGenClick = (_: MouseEvent<HTMLButtonElement>): void => {
    // check that file was uploaded, # desired cards was entered
    if (this.state.name === "") {
      this.setState({error: "name field cannot be empty."});
      return;
    } else if (this.props.names.includes(this.state.name)) {
      this.setState({error: "deck name already exists."});
      return;
    } else if (this.state.file === null) {
      this.setState({error: "no file uploaded."});
      return;
    } else if (this.state.num <= 0) {
      this.setState({error: "invalid number of cards entered."});
    }

    // 1) parse uploaded file to create model input
    // 2) pass input thru model, get json output
    console.log("Fetching /api/generate");
    fetch("/api/generate", {
      method: "POST", body: JSON.stringify({text: this.state.fileContent, num: this.state.num}),
      headers: {"Content-Type": "application/json"} })
    .then(this.doGenResp)
    .catch(() => this.doGenError("failed to connect to server"));
  }

  doGenResp = (resp: Response): void => {
    if (resp.status === 200) {
      resp.json().then(this.doGenJson)  // update what's displayed in text field
          .catch(() => this.doGenError("200 response is not JSON"));
    } else if (resp.status === 400) {
      resp.text().then(this.doGenError)
          .catch(() => this.doGenError("400 response is not text"));
    } else {
      this.doAddError(`bad status code from /api/generate: ${resp.status}`);
    }
  };

  doGenJson = (data: {text: string}): void => {
    if (!isRecord(data)) {
      console.error("bad data from /api/generate: not a record", data);
      return;
    }

    // user can now modify generated cards as they wish, then add deck
    // as normal by clicking add button
    this.setState({cards: data.text});
  };

  doGenError = (msg: string): void => {
    this.setState({error: msg});
  };

  doNameChange = (evt: ChangeEvent<HTMLInputElement>): void => { 
    if (this.props.editingMode === true) {
      this.setState({error: "cannot modify name of pre-existing deck."});
    } else {
      this.setState({name: evt.target.value}); 
    }
  };

  doCardsChange = (evt: React.ChangeEvent<HTMLTextAreaElement>): void => { 
    this.setState({cards: evt.target.value}); 
  };  


  // // // FILE OPERATIONS // // //
  
  doUploadClick = (_: MouseEvent<HTMLButtonElement>): void => {
    if (this.state.file) {
      // formData may not be needed
      const formData = new FormData();
      formData.append("file", this.state.file);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const fileContent = e.target.result as string;

          this.setState({fileContent: fileContent}, () => {
            console.log(this.state.fileContent); // Logs the updated state
          });
        }
      };
      reader.readAsText(this.state.file);  // readAsText or readAsArrayBuffer for PDFs
    }
  }
  
  doFileChange = (evt: React.ChangeEvent<HTMLInputElement>): void => {
    if (evt.target.files === null || evt.target.files.length <= 0) {
      this.setState({error: "invalid file upload."});
    } else {
      this.setState({file: evt.target.files[0]});
    }
  }
}