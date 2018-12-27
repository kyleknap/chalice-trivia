import React, { Component } from 'react';
import './App.css';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'

import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {
  Table,
  TableBody,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import {Dispatcher} from 'flux'

import injectTapEventPlugin from 'react-tap-event-plugin';


injectTapEventPlugin();
var TriviaDispatcher = new Dispatcher();

var UserStore = {
  username: null,
  idToken: null,
  totalCorrect: 0,
  totalAnswered: 0
};
var CurrentQuestionStore = {
  questionId: '1'
};


TriviaDispatcher.register(function(payload) {
  if (payload.actionType === 'update-user') {
    UserStore.username = payload.username;
    UserStore.idToken = payload.idToken;
    UserStore.totalCorrect = payload.totalCorrect;
    UserStore.totalAnswered = payload.totalAnswered
  }
  if (payload.actionType === 'change-question') {
    CurrentQuestionStore.questionId = payload.questionId;
  }
});

/*global apigClientFactory*/

var poolData = {
  UserPoolId: 'us-west-2_Q55mBivo4',
  ClientId: '37pmcs5oesqe4sjr0ub8qstr9c'
};


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentQuestionId: CurrentQuestionStore.questionId,
      currentUser: UserStore.username
    };

    var that = this;
    TriviaDispatcher.register(function (payload) {
      if (payload.actionType === 'change-question') {
        that.setState({
          currentQuestionId: payload.questionId
        });
      }

    });
    TriviaDispatcher.register(function (payload) {
      if (payload.actionType === 'update-user') {
        console.log('here');
        console.log(payload);
        that.setState({
          currentUser: payload.username
        });
      }
    });
  }


  render() {
    let userLogIn = null;
    if (this.state.currentUser) {
      userLogIn = <LoggedInUsernameDialog username={this.state.currentUser}/>;
    } else {
      userLogIn = <LoginDialog/>;
    }

    return (
      <MuiThemeProvider>
        <div className="App">
          <div className="App-header">
            <h1>Chalice Trivia</h1>
            {userLogIn}
            <SignUpDialog/>
          </div>
          <div className="App-intro">
            <QuestionWithAnswers questionId={this.state.currentQuestionId}/>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

class LoggedInUsernameDialog extends Component {
  state = {
    open: false,
    totalCorrect: 0,
    totalAnswered: 0
  };

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  handleLogOut() {
    TriviaDispatcher.dispatch({
      actionType: 'update-user',
      username: null,
      idToken: null,
      totalCorrect: 0,
      totalAnswered: 0
    });
    TriviaDispatcher.dispatch({
      actionType: 'change-question',
      questionId: '1'
    });
    this.handleClose();
  }

  render() {
    const actions = [
      <FlatButton
        label="Close"
        primary={true}
        onTouchTap={this.handleClose}
      />,
      <FlatButton
        label="Log Out"
        primary={true}
        onTouchTap={this.handleLogOut.bind(this)}
      />,
    ];

    let userTable =  (
      <Table>
      <TableBody displayRowCheckbox={false}>
        <TableRow>
          <TableRowColumn><b>Username</b></TableRowColumn>
          <TableRowColumn>{this.props.username}</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn><b>Total Correct</b></TableRowColumn>
          <TableRowColumn>{UserStore.totalCorrect}</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn><b>Total Answered</b></TableRowColumn>
          <TableRowColumn>{UserStore.totalAnswered}</TableRowColumn>
        </TableRow>
      </TableBody>
    </Table>
    );


    return (
      <div>
        <RaisedButton label={this.props.username} onTouchTap={this.handleOpen} />
        <Dialog
          actions={actions}
          modal={true}
          open={this.state.open}
        >
          {userTable}
        </Dialog>
      </div>
    );
  }
}

class UsernamePasswordDialog extends Component {
  state = {
    open: false,
    username: null,
    password: null
  };
  name = '';

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  handleSubmit() {
    console.alert('must implement')
  };

  handleUsernameChange(e) {
    this.setState({
      username: e.target.value
    });
  }

  handlePasswordChange(e) {
    this.setState({
      password: e.target.value
    });
  }

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.handleClose}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        onTouchTap={this.handleSubmit.bind(this)}
      />,
    ];

    return (
      <div>
        <RaisedButton label={this.name} onTouchTap={this.handleOpen} />
        <Dialog
          title="Enter a username and password:"
          actions={actions}
          modal={true}
          open={this.state.open}
        >
          <TextField
            hintText="Username Field"
            floatingLabelText="Username"
            errorText="This field is required"
            onChange={this.handleUsernameChange.bind(this)}
          /><br />
          <TextField
            hintText="Password Field"
            floatingLabelText="Password"
            type="password"
            errorText="This field is required"
            onChange={this.handlePasswordChange.bind(this)}
          /><br />
        </Dialog>
      </div>
    );
  }
}
class SignUpDialog extends UsernamePasswordDialog {
  name = 'Sign Up';

  handleSubmit() {
    let userPool = new CognitoUserPool(poolData);
    userPool.signUp(this.state.username, this.state.password, [], null, function (err, result) {
      if (err) {
        alert(err);
        return;
      }
      let cognitoUser = result.user;
      console.log('user name is ' + cognitoUser.getUsername());
    });
    this.handleClose();
  }
}

class LoginDialog extends UsernamePasswordDialog{
  name = 'Login';

  handleSubmit() {
    let authenticationData = {
      Username: this.state.username,
      Password: this.state.password,
    };
    let authenticationDetails = new AuthenticationDetails(authenticationData);
    let userPool = new CognitoUserPool(poolData);
    let userData = {
      Username: this.state.username,
      Pool: userPool
    };
    let cognitoUser = new CognitoUser(userData);
    var that = this;
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        console.log(result);
        let apigClient = apigClientFactory.newClient();
        let additionalParams = {
          headers: {
            Authorization: result.getIdToken().getJwtToken(),
          }
        };
        apigClient.userGet({}, null, additionalParams).then( function(user_result){
          console.log(user_result);
          TriviaDispatcher.dispatch({
            actionType: 'update-user',
            username: that.state.username,
            idToken: result.getIdToken().getJwtToken(),
            totalCorrect: user_result.data.total_correct,
            totalAnswered: user_result.data.total_answered
          });
          TriviaDispatcher.dispatch({
            actionType: 'change-question',
            questionId: that.getNextQuestion(user_result.data.answers)
          });
        }).catch( function(result) {
          console.log(result)
          // Add error callback code here.
        });
      },
      onFailure: function (err) {
        alert(err);
      },

    });
    this.handleClose();
  }

  getNextQuestion(userAnswers) {
    let highestId = '0';
    var questionsAnsweredArray = Object.keys(userAnswers);
    for (var i = 0; i < questionsAnsweredArray.length; i++) {
      if (questionsAnsweredArray[i] > highestId) {
        highestId = questionsAnsweredArray[i];
      }
    }
    return +highestId + 1;
  }
}


class QuestionWithAnswers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      question: '',
      answers: [],
      questionId: null
    };
    this.getQuestion(this.props.questionId);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return ((nextState.questionId !== this.state.questionId) || (nextProps.questionId !== this.props.questionId));
  }

  componentWillUpdate(nextProps, nextState) {
    this.getQuestion(nextProps.questionId);
  }

  getQuestion(questionId) {
    let apigClient = apigClientFactory.newClient();
    var that = this;
    apigClient.questionsQuestionIdGet({question_id: questionId}).then( function(result){
        that.setState(
          {
            question: result.data.question,
            answers: result.data.possible_answers,
            questionId: result.data.question_id
          }
        );
      }).catch( function(result) {
        if (result.data.Code === 'NotFoundError') {
          alert('There are no more questions left. Thanks for playing!');
        }
        console.log(result)
        // Add error callback code here.
      });
  }

  render() {
    return (
      <div>
        <Question question={this.state.question}/>
        <Answers answers={this.state.answers} questionId={this.props.questionId}/>
      </div>
    );
  }
}


class Question extends Component {
  render() {
    return <p>{this.props.question}</p>
  }
}


class Answers extends Component {
  state = {
    selected: [-1],
    correctAnswer: null,
    selectedAnswer: null,
    isCorrect: null
  };

  isSelected = (index) => {
    return this.state.selected.indexOf(index) !== -1;
  };

  handleRowSelection = (selectedRows) => {
    this.setState({
      selected: selectedRows,
    });
  };

  postAnswer(event) {
    let apigClient = apigClientFactory.newClient();
    var that = this;
    var answer = this.props.answers[this.state.selected[0]];
    console.log(UserStore.idToken);
    if (UserStore.idToken) {
      var additionalParams = {
        headers: {
          Authorization: UserStore.idToken,
        }
      };
      apigClient.questionsQuestionIdUserPost({question_id: this.props.questionId}, {answer: answer}, additionalParams).then(function (result) {
        that.setState({
          selectedAnswer: answer,
          correctAnswer: result.data.correct_answer,
          isCorrect: result.data.is_correct,
          selected: [-1]
        });
        console.log(result)
      }).catch(function (result) {
        console.log(result)
        // Add error callback code here.
      });
    } else {
      apigClient.questionsQuestionIdPost({question_id: this.props.questionId}, {answer: answer}).then(function (result) {
        that.setState({
          selectedAnswer: answer,
          correctAnswer: result.data.correct_answer,
          isCorrect: result.data.is_correct,
          selected: [-1]
        });
        console.log(result)
      }).catch(function (result) {
        console.log(result)
        // Add error callback code here.
      });
    }
  }

  nextQuestion() {
    TriviaDispatcher.dispatch({
      actionType: 'change-question',
      questionId: +this.props.questionId + +1,
    });
    this.setState({
      selected: [-1],
      correctAnswer: null,
      selectedAnswer: null,
      isCorrect: null
    });

  }

  render() {
    var that = this;
    return (
      <div>
        <Table onRowSelection={this.handleRowSelection}>
          <TableBody>
            {this.props.answers.map(function(answer, index) {
              return (
                  that.getTableRow(answer, index)
              );
            })}
          </TableBody>
        </Table>
        <RaisedButton
          label='Submit'
          disabled={this.state.selected[0] === -1}
          primary={true}
          onTouchTap={this.postAnswer.bind(this)}
        />
        <RaisedButton
          label='Next Question'
          disabled={this.state.correctAnswer === null}
          secondary={true}
          onTouchTap={this.nextQuestion.bind(this)}
        />
      </div>
    );
  }

  getTableRow(answer, index) {
    if (this.state.isCorrect && this.state.selectedAnswer === answer) {
      return (
        <TableRow selected={this.isSelected(index)} key={index} style={{backgroundColor:'#79d279'}}>
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    } else if (!this.state.isCorrect && this.state.selectedAnswer === answer) {
      return (
        <TableRow selected={this.isSelected(index)} key={index} style={{backgroundColor:'#ff4d4d'}}>
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    } else if (!this.state.isCorrect && this.state.correctAnswer === answer) {
      return (
        <TableRow selected={this.isSelected(index)} key={index} style={{backgroundColor:'#79d279'}}>
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    } else {
      return (
        <TableRow selected={this.isSelected(index)} key={index}>
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    }
  }
}

export default App