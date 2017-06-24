import chalice
import chalicelib.questions
import chalicelib.users
import chalicelib.constants


app = chalice.Chalice(app_name='chalice-trivia')


cognito_authorizer = chalice.CognitoUserPoolAuthorizer(
    'MyCognitoAuthorizer', provider_arns=[chalicelib.constants.POOL_ARN])


@app.route('/questions/{question_id}', cors=True)
def get_question(question_id):
    table = chalicelib.questions.QuestionsTable()
    question = table.get_question(question_id)
    if not question:
        raise chalice.NotFoundError('Requested resource does not exist')
    return {
        'question_id': question.question_id,
        'question': question.question,
        'possible_answers': question.possible_answers
    }


@app.route('/questions/{question_id}', methods=['POST'], cors=True)
def answer_question(question_id):
    if 'answer' not in app.current_request.json_body:
        raise chalice.BadRequestError(
            'Missing "answer" in request body'
        )
    provided_answer = app.current_request.json_body['answer']
    table = chalicelib.questions.QuestionsTable()
    question = table.get_question(question_id)
    if not question:
        raise chalice.NotFoundError('Requested resource does not exist')
    elif provided_answer not in question.possible_answers:
        raise chalice.BadRequestError(
            'Provided answer: %s is not a valid answer. Please submit an '
            'answer from the list of possible answers: %s' % (
                provided_answer, question.possible_answers)

        )
    return {
        'is_correct': provided_answer == question.correct_answer,
        'provided_answer': provided_answer,
        'correct_answer': question.correct_answer,
        'question_id': question.question_id
    }


@app.route('/questions/{question_id}/user', methods=['POST'],
           authorizer=cognito_authorizer, cors=True)
def answer_question_for_user(question_id):
    answer_data = answer_question(question_id)
    username = _get_authenticated_username()
    user_table = chalicelib.users.UsersTable()
    try:
        user_table.update_user_score(
            username, question_id, answer_data['provided_answer'],
            answer_data['is_correct']
        )
    except chalicelib.users.UserAlreadyAnsweredError as e:
        raise chalice.BadRequestError(str(e))
    return answer_data


@app.route('/user', authorizer=cognito_authorizer, cors=True)
def get_user_data():
    username = _get_authenticated_username()
    user_table = chalicelib.users.UsersTable()
    user = user_table.get_user(username)
    return {
        'usersname': user.username,
        'answers': user.answers,
        'total_correct': user.total_correct,
        'total_answered': user.total_answered
    }


def _get_authenticated_username():
    return app.current_request.context[
            'authorizer']['claims']['cognito:username']


@app.lambda_function()
def autoconfirm_user(event, context):
    event['response']['autoConfirmUser'] = True
    return event


@app.lambda_function()
def add_user(event, context):
    username = event['userName']
    user_table = chalicelib.users.UsersTable()
    user_table.add_new_user(username)
    return event
