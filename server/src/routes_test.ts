import * as assert from 'assert';
import * as httpMocks from 'node-mocks-http';
import { addDeck, resetForTesting, loadDeck, listDecks, parseCards, addScore, listScores } from './routes';

type Card = {
  front: string,
  back: string
};

describe('routes', function() {

  const spanish = "lunes|monday\nmartes|tuesday";
  const math = "1+1|2\n3*3|9\n4 - 2|2\n64 / 8|8";
  const colors = "green|forest\nblue|ocean \norange|oranges\nred| apples";
  const english = "a longer sentence|with a back side\nmore words|even more words\nfront side  |   back side";
  const faulty = "no divider\njust a front|\n|just a back";
  const faulty2 = "no divider\njust a front|\nthis is|actually correct\n|just a back";

  it('addDeck', function() {
    // Error branch: invalid name param

    // no name param or empty string or not of type string
    const reqNoName = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {cards: colors}});
    const resNoName = httpMocks.createResponse();
    addDeck(reqNoName, resNoName);

    assert.deepStrictEqual(resNoName._getStatusCode(), 400);
    assert.deepStrictEqual(resNoName._getData(), 'save: invalid "name" parameter');

    const reqEmptyName = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {name: "", cards: colors}});
    const resEmptyName = httpMocks.createResponse();
    addDeck(reqEmptyName, resEmptyName);

    assert.deepStrictEqual(resEmptyName._getStatusCode(), 400);
    assert.deepStrictEqual(resEmptyName._getData(), 'save: invalid "name" parameter');

    const reqNotString = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {name: 123, cards: math}});
    const resNotString = httpMocks.createResponse();
    addDeck(reqNotString, resNotString);

    assert.deepStrictEqual(resNotString._getStatusCode(), 400);
    assert.deepStrictEqual(resNotString._getData(), 'save: invalid "name" parameter');

    // Error branch: invalid cards param

    // no cards or cards is empty string or not of type string
    const reqNoCards = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {name: "english"}});
    const resNoCards = httpMocks.createResponse();
    addDeck(reqNoCards, resNoCards);

    assert.deepStrictEqual(resNoCards._getStatusCode(), 400);
    assert.deepStrictEqual(resNoCards._getData(), 'save: invalid "cards" parameter');

    const reqEmptyCards = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {name: "english", cards: ""}});
    const resEmptyCards = httpMocks.createResponse();
    addDeck(reqEmptyCards, resEmptyCards);

    assert.deepStrictEqual(resEmptyCards._getStatusCode(), 400);
    assert.deepStrictEqual(resEmptyCards._getData(), 'save: invalid "cards" parameter');

    const reqNotString2 = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {name: "math", cards: 1234}});
    const resNotString2 = httpMocks.createResponse();
    addDeck(reqNotString2, resNotString2);

    assert.deepStrictEqual(resNotString2._getStatusCode(), 400);
    assert.deepStrictEqual(resNotString2._getData(), 'save: invalid "cards" parameter');

    // No errors: straight line code
    const req1 = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {name: "spanish", cards: spanish}});
    const res1 = httpMocks.createResponse();
    addDeck(req1, res1);

    assert.deepStrictEqual(res1._getStatusCode(), 200);
    assert.deepStrictEqual(res1._getData(), {name: "spanish", cards: spanish});

    const req2 = httpMocks.createRequest(
      {method: 'POST', url: '/addDeck', body: {name: "english", cards: english}});
    const res2 = httpMocks.createResponse();
    addDeck(req2, res2);

    assert.deepStrictEqual(res2._getStatusCode(), 200);
    assert.deepStrictEqual(res2._getData(), {name: "english", cards: english});

    resetForTesting();
  })


  it('loadDeck', function() {
    // Save 2 decks in order to load them
    const spanishCards = [{front: "lunes", back: "monday"}, {front: "martes", back: "tuesday"}]
    const mathCards = [{front: "1+1", back: "2"}, {front: "3*3", back: "9"}, 
                       {front: "4 - 2", back: "2"}, {front: "64 / 8", back: "8"}];

    // spanish deck
    const saveReq1 = httpMocks.createRequest({method: 'POST', url: '/addDeck',
        body: {name: "spanish", cards: spanish}});
    const saveResp1 = httpMocks.createResponse();
    addDeck(saveReq1, saveResp1);

    // math deck
    const saveReq2 = httpMocks.createRequest({method: 'POST', url: '/addDeck',
        body: {name: "math", cards: math}});
    const saveResp2 = httpMocks.createResponse();
    addDeck(saveReq2, saveResp2);

    // Error: name is undefined (just testing once, since only one possible input for 'name' param gives this error)
    const loadReqNoName = httpMocks.createRequest(
      {method: 'GET', url: '/loadDeck', query: {}});
    const loadResNoName = httpMocks.createResponse();
    loadDeck(loadReqNoName, loadResNoName);
    assert.deepStrictEqual(loadResNoName._getStatusCode(), 400);
    assert.deepStrictEqual(loadResNoName._getData(), 'load: missing "name" parameter for deck');

    // Error: name doesn't exist in decks
    const loadReqNone = httpMocks.createRequest(
      {method: 'GET', url: '/loadDeck', query: {name: "fruits"}});
    const loadResNone = httpMocks.createResponse();
    loadDeck(loadReqNone, loadResNone);
    assert.deepStrictEqual(loadResNone._getStatusCode(), 404);
    assert.deepStrictEqual(loadResNone._getData(), 'load: given deck name does not exist');

    const loadReqNone2 = httpMocks.createRequest(
      {method: 'GET', url: '/loadDeck', query: {name: "colors"}});
    const loadResNone2 = httpMocks.createResponse();
    loadDeck(loadReqNone2, loadResNone2);
    assert.deepStrictEqual(loadResNone2._getStatusCode(), 404);
    assert.deepStrictEqual(loadResNone2._getData(), 'load: given deck name does not exist');   
    
    // No errors
    const loadReq1 = httpMocks.createRequest(
        {method: 'GET', url: '/loadDeck', query: {name: "spanish"}});
    const loadRes1 = httpMocks.createResponse();
    loadDeck(loadReq1, loadRes1);
    assert.deepStrictEqual(loadRes1._getStatusCode(), 200);
    assert.deepStrictEqual(loadRes1._getData(), {name: "spanish", value: spanishCards});

    const loadReq2 = httpMocks.createRequest(
        {method: 'GET', url: '/loadDeck', query: {name: "math"}});
    const loadRes2 = httpMocks.createResponse();
    loadDeck(loadReq2, loadRes2);
    assert.deepStrictEqual(loadRes2._getStatusCode(), 200);
    assert.deepStrictEqual(loadRes2._getData(), {name: "math", value: mathCards});

    resetForTesting();
  })


  it('listDecks', function() {
    // First save some decks   
    // Straight line code: function is just one line; check that list updates
    // after each new deck is added

    // spanish deck
    const req1 = httpMocks.createRequest({method: 'POST', url: '/addDeck',
        body: {name: "spanish", cards: spanish}});
    const resp1 = httpMocks.createResponse();
    addDeck(req1, resp1);

    // test one deck
    const resA = httpMocks.createResponse();
    listDecks(req1, resA);
    assert.deepStrictEqual(resA._getData(), {values: ['spanish']});

    // math deck
    const saveReq2 = httpMocks.createRequest({method: 'POST', url: '/addDeck',
        body: {name: "math", cards: math}});
    const saveResp2 = httpMocks.createResponse();
    addDeck(saveReq2, saveResp2);

    // test two decks
    const resB = httpMocks.createResponse();
    listDecks(req1, resB);
    assert.deepStrictEqual(resB._getData(), {values: ['spanish', 'math']});

    resetForTesting();
  })


  it('addScore', function() {
    // Error: invalid user param
    const reqNoUser = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {name: "colors", score: "50"}});
    const resNoUser = httpMocks.createResponse();
    addScore(reqNoUser, resNoUser);

    assert.deepStrictEqual(resNoUser._getStatusCode(), 400);
    assert.deepStrictEqual(resNoUser._getData(), 'score: invalid "user" parameter');

    const reqEmptyUser = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "", name: "spanish", score: "80"}});
    const resEmptyUser = httpMocks.createResponse();
    addScore(reqEmptyUser, resEmptyUser);

    assert.deepStrictEqual(resEmptyUser._getStatusCode(), 400);
    assert.deepStrictEqual(resEmptyUser._getData(), 'score: invalid "user" parameter');

    const reqNotString2 = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: 208, name: "math", score: "60"}});
    const resNotString2 = httpMocks.createResponse();
    addScore(reqNotString2, resNotString2);

    assert.deepStrictEqual(resNotString2._getStatusCode(), 400);
    assert.deepStrictEqual(resNotString2._getData(), 'score: invalid "user" parameter');

    // Error: invalid name param
    const reqNoName = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "jane", score: "50"}});
    const resNoName = httpMocks.createResponse();
    addScore(reqNoName, resNoName);

    assert.deepStrictEqual(resNoName._getStatusCode(), 400);
    assert.deepStrictEqual(resNoName._getData(), 'score: invalid "name" parameter');

    const reqEmptyName = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "sarah", name: "", score: "80"}});
    const resEmptyName = httpMocks.createResponse();
    addScore(reqEmptyName, resEmptyName);

    assert.deepStrictEqual(resEmptyName._getStatusCode(), 400);
    assert.deepStrictEqual(resEmptyName._getData(), 'score: invalid "name" parameter');

    const reqNotString = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "bob", name: 123, score: "60"}});
    const resNotString = httpMocks.createResponse();
    addScore(reqNotString, resNotString);

    assert.deepStrictEqual(resNotString._getStatusCode(), 400);
    assert.deepStrictEqual(resNotString._getData(), 'score: invalid "name" parameter');

    // Error: invalid score param
    const reqNoScore = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "jane", name: "spanish"}});
    const resNoScore = httpMocks.createResponse();
    addScore(reqNoScore, resNoScore);

    assert.deepStrictEqual(resNoScore._getStatusCode(), 400);
    assert.deepStrictEqual(resNoScore._getData(), 'score: invalid "score" parameter');

    const reqEmptyScore = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "sarah", name: "english", score: ""}});
    const resEmptyScore = httpMocks.createResponse();
    addScore(reqEmptyScore, resEmptyScore);

    assert.deepStrictEqual(resEmptyScore._getStatusCode(), 400);
    assert.deepStrictEqual(resEmptyScore._getData(), 'score: invalid "score" parameter');

    const reqNotString3 = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "bob", name: "colors", score: 90}});
    const resNotString3 = httpMocks.createResponse();
    addScore(reqNotString3, resNotString3);

    assert.deepStrictEqual(resNotString3._getStatusCode(), 400);
    assert.deepStrictEqual(resNotString3._getData(), 'score: invalid "score" parameter');

    
    // No errors: straight line code
    const req1 = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "jane", name: "spanish", score: "100"}});
    const res1 = httpMocks.createResponse();
    addScore(req1, res1);

    assert.deepStrictEqual(res1._getStatusCode(), 200);
    assert.deepStrictEqual(res1._getData(), {user: "jane", name: "spanish", score: "100"});

    const req2 = httpMocks.createRequest(
      {method: 'POST', url: '/addScore', body: {user: "sally", name: "english", score: "75"}});
    const res2 = httpMocks.createResponse();
    addScore(req2, res2);

    assert.deepStrictEqual(res2._getStatusCode(), 200);
    assert.deepStrictEqual(res2._getData(), {user: "sally", name: "english", score: "75"});

    resetForTesting();
  })
 
  
  it('listScores', function() {
    // First save some scores
    // Straight line code: function is just one line

    const req1 = httpMocks.createRequest({method: 'POST', url: '/addScore',
        body: {user: "jane", name: "spanish", score: "100"}});
    const resp1 = httpMocks.createResponse();
    addScore(req1, resp1);

    // test one score
    const resA = httpMocks.createResponse();
    listScores(req1, resA);
    assert.deepStrictEqual(resA._getData(), {values: [{user: "jane", name: "spanish", score: "100"}]});

    const req2 = httpMocks.createRequest({method: 'POST', url: '/addScore',
        body: {user: "jane", name: "english", score: "95"}});
    const resp2 = httpMocks.createResponse();
    addScore(req2, resp2);

    // test two scores
    const resB = httpMocks.createResponse();
    listScores(req2, resB);
    assert.deepStrictEqual(resA._getData(), {values: [{user: "jane", name: "spanish", score: "100"}, 
                                                      {user: "jane", name: "english", score: "95"}]});

    resetForTesting();
  })


  it('parseCards', function() {
    // Check that properly formatted cards are parsed correctly
    const colorCards = [{front: "green", back: "forest"}, 
                        {front: "blue", back: "ocean "}, 
                        {front: "orange", back: "oranges"},
                        {front: "red", back: " apples"}];
    
    const englishCards = [{front: "a longer sentence", back: "with a back side"}, 
                          {front: "more words", back: "even more words"}, 
                          {front: "front side  ", back: "   back side"}];
    
    assert.deepStrictEqual(parseCards(colors), colorCards);
    assert.deepStrictEqual(parseCards(english), englishCards);

    // Check that in faulty cards, invalid cards are skipped
    const faultyCards: Card[] = [];
    const faultyCards2 = [{front: "this is", back: "actually correct"}];

    assert.deepStrictEqual(parseCards(faulty), faultyCards);
    assert.deepStrictEqual(parseCards(faulty2), faultyCards2);
  })

});
