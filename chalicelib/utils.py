import boto3


class DynamoDBTable(object):
    def __init__(self, table_name, key_name):
        self._table_name = table_name
        self._key_name = key_name
        self._dynamodb = boto3.resource('dynamodb')

    def get_value_from_db(self, key, include=None):
        get_item_kwargs = {
            'Key': {self._key_name: key}
        }
        if include is not None:
            get_item_kwargs['ProjectionExpression'] = ', '.join(include)
        response = self._dynamodb.Table(
            self._table_name).get_item(**get_item_kwargs)
        return response.get('Item', None)
