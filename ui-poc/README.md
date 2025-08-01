# Splitwiser UI POC

This is a proof of concept UI for the Splitwiser application using Streamlit. It demonstrates the basic functionality of the application, including authentication, group management, and expense tracking.

## Features

- Login and Registration
- Group Management:
  - Create new groups
  - Join existing groups
  - View group details
  - Add expenses to groups
- Friends Management (Coming Soon)

## Setup and Installation

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the application:
   ```
   streamlit run Home.py
   ```

## API Connection

This UI connects to the Splitwiser backend API deployed at:
`https://splitwiser-production.up.railway.app/`

## Session State Management

The application uses Streamlit's session state to manage user authentication and navigation between different views. Key session state variables include:

- `access_token`: User's authentication token
- `user_id`: Current user's ID
- `username`: Current user's username
- `groups_view`: Current view in the Groups page (list or detail)
- `selected_group_id`: ID of the currently selected group for detail view

## Structure

- `Home.py`: Main application file with login/signup and dashboard
- `pages/Groups.py`: Group management functionality
- `pages/Friends.py`: Friends functionality (coming soon)
