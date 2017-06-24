from collections import namedtuple

from boto3.dynamodb.conditions import Attr

from chalicelib.constants import USERS_TABLE_NAME
from chalicelib.constants import USERS_TABLE_KEY_NAME
from chalicelib.utils import DynamoDBTable


User = namedtuple(
    'User', ['username', 'answers', 'total_correct', 'total_answered'])


class UserAlreadyAnsweredError(Exception):
    pass


class UsersTable(DynamoDBTable):
    def __init__(self,
                 table_name=USERS_TABLE_NAME,
                 key_name=USERS_TABLE_KEY_NAME):
        super(UsersTable, self).__init__(table_name, key_name)

    def get_user(self, username):
        data = self.get_value_from_db(username)
        if data:
            return User(
                username=data['username'],
                answers=data['answers'],
                total_correct=data['total_correct'],
                total_answered=data['total_answered']
            )

    def add_new_user(self, username):
        self._dynamodb.Table(self._table_name).put_item(
            Item={
                'username': username,
                'answers': {},
                'total_correct': 0,
                'total_answered': 0
            }
        )

    def update_user_score(self, username, question_id, provided_answer,
                          is_correct):
        update_expression_components = []
        expression_attribute_names = {}
        expression_attribute_values = {}

        update_expression_components.append('#ans.#qid = :answer')
        expression_attribute_names['#ans'] = 'answers'
        expression_attribute_names['#qid'] = question_id
        expression_attribute_values[':answer'] = {
            'provided_answer': provided_answer,
            'is_correct': is_correct,
        }

        update_expression_components.append(
            'total_answered = total_answered + :inc')
        expression_attribute_values[':inc'] = 1

        if is_correct:
            update_expression_components.append(
                'total_correct = total_correct + :inc')

        try:
            self._dynamodb.Table(self._table_name).update_item(
                Key={
                    'username': username
                },
                UpdateExpression='SET ' + ', '.join(
                    update_expression_components),
                ExpressionAttributeNames=expression_attribute_names,
                ConditionExpression=Attr(
                    'answers.' + question_id).not_exists(),
                ExpressionAttributeValues=expression_attribute_values
            )
        except self._dynamodb.meta.client.exceptions.\
                ConditionalCheckFailedException:
            raise UserAlreadyAnsweredError(
                'User \'%s\' has already answered this question. A specific '
                'user is only allowed to answer a question once.' % username
            )
