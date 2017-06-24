from collections import namedtuple

from chalicelib.constants import QUESTIONS_TABLE_NAME
from chalicelib.constants import QUESTIONS_TABLE_KEY_NAME
from chalicelib.utils import DynamoDBTable


Question = namedtuple(
    'Question', ['question_id', 'question', 'possible_answers',
                 'correct_answer'])


class QuestionsTable(DynamoDBTable):
    def __init__(self,
                 table_name=QUESTIONS_TABLE_NAME,
                 key_name=QUESTIONS_TABLE_KEY_NAME):
        super(QuestionsTable, self).__init__(table_name, key_name)

    def get_question(self, question_id):
        data = self.get_value_from_db(question_id)
        if data:
            return Question(
                question_id=data['question_id'],
                question=data['question'],
                possible_answers=data['possible_answers'],
                correct_answer=data['correct_answer']
            )
