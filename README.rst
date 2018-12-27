Chalice Trivia
==============

This is a trivia application powered by chalice. You can find a deployed
version of the application `here <http://chalice-trivia.s3-website-us-west-2.amazonaws.com/>`__. You can also watch the following
`EuroPython talk <https://www.youtube.com/watch?v=33-0xdxp9-I>`__ I gave
about Chalice where I use this application as the main talking point.
To learn more about Chalice, please refer to its `documentation <https://chalice.readthedocs.io/en/latest/>`__.

Repository Structure
--------------------
The repository is broken into three components:

* Chalice application: This consists of the following components that
  run the backend of the application:

  * ``app.py``: Contains core logic of application
  * ``requirements.txt``: Declares dependencies for application
  * ``chalicelib`` directory: Contains helper modules for the application
  * ``.chalice`` directory: Contains various files for configuring the
    application.

* ``ui`` directory: This is the source code that powers the frontend of the
  application. The frontend is a single page web application that utilizes
  React.

* ``scripts`` directory: Contains scripts useful for managing the
  application. Current scripts include:

  * ``add-questions``: A script that adds questions to the DynamoDB table
  * ``delete-users``: A script for deleting all users from the Cognito
    user pool. Note: This script needs to be generalized more for
    general consumption. It only works right now on the deployed
    application linked in the beginning of the README. 

