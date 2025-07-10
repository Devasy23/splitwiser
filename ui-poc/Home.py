import streamlit as st
import requests
from datetime import datetime
import json

# Configure the page
st.set_page_config(
    page_title="Splitwiser",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state variables
if "access_token" not in st.session_state:
    st.session_state.access_token = None
if "user_id" not in st.session_state:
    st.session_state.user_id = None
if "username" not in st.session_state:
    st.session_state.username = None

# Base URL for API
API_URL = "https://splitwiser-production.up.railway.app"

def login(email, password):
    """Login user and store access token in session state"""
    try:
        response = requests.post(
            f"{API_URL}/auth/login/email",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            st.session_state.access_token = data.get("access_token")
            # Update user_id from the response format
            user_data = data.get("user", {})
            st.session_state.user_id = user_data.get("_id")  # Changed from user_id to _id
            st.session_state.username = user_data.get("name")  # Changed from username to name
            return True, "Login successful!"
        else:
            return False, f"Login failed: {response.json().get('detail', 'Unknown error')}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def signup(username, email, password):
    """Register a new user"""
    try:
        response = requests.post(
            f"{API_URL}/auth/signup/email",
            json={"name": username, "email": email, "password": password}
        )
        if response.status_code == 200:
            return True, "Registration successful! Please login."
        else:
            return False, f"Registration failed: {response.json().get('detail', 'Unknown error')}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def logout():
    """Clear session state and log out user"""
    for key in list(st.session_state.keys()):
        del st.session_state[key]
    st.rerun()

# Main app
def main():
    # Sidebar for app navigation
    with st.sidebar:
        st.title("Splitwiser 💰")
        
        if st.session_state.access_token:
            st.success(f"Logged in as {st.session_state.username}")
            if st.button("Logout", key="logout_btn"):
                logout()
        
    # Main content
    if not st.session_state.access_token:
        display_auth_page()
    else:
        display_main_app()

def display_auth_page():
    """Display login/signup interface"""
    st.title("Welcome to Splitwiser")
    st.write("Track and split expenses with friends and groups")
    
    # Create tabs for login and signup
    login_tab, signup_tab = st.tabs(["Login", "Sign Up"])
    
    # Login tab
    with login_tab:
        with st.form("login_form", clear_on_submit=False):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            submit_button = st.form_submit_button("Login")
            
            if submit_button:
                if email and password:
                    success, message = login(email, password)
                    if success:
                        st.success(message)
                        st.rerun()
                    else:
                        st.error(message)
                else:
                    st.warning("Please fill in all fields")
    
    # Sign up tab
    with signup_tab:
        with st.form("signup_form", clear_on_submit=True):
            username = st.text_input("Username", key="signup_username")
            email = st.text_input("Email", key="signup_email")
            password = st.text_input("Password", type="password", key="signup_password")
            confirm_password = st.text_input("Confirm Password", type="password", key="signup_confirm_password")
            submit_button = st.form_submit_button("Sign Up")
            
            if submit_button:
                if username and email and password and confirm_password:
                    if password != confirm_password:
                        st.error("Passwords don't match")
                    else:
                        success, message = signup(username, email, password)
                        if success:
                            st.success(message)
                        else:
                            st.error(message)
                else:
                    st.warning("Please fill in all fields")

def display_main_app():
    """Display the main application after login"""
    st.title("Splitwiser Dashboard")
    
    # Create tabs for Groups and Friends
    groups_tab, friends_tab = st.tabs(["Groups", "Friends"])
    
    # Groups Tab
    with groups_tab:
        st.header("Groups")
        
        # Join Group Expander
        with st.expander("Join a Group", expanded=False):
            with st.form("join_group_form", clear_on_submit=True):
                group_code = st.text_input("Enter Group Code", key="join_group_code")
                submit_button = st.form_submit_button("Join Group")
                
                if submit_button and group_code:
                    try:
                        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                        response = requests.post(
                            f"{API_URL}/groups/join",
                            json={"joinCode": group_code},
                            headers=headers
                        )
                        if response.status_code == 200:
                            st.success("Successfully joined the group!")
                            st.rerun()
                        else:
                            st.error(f"Failed to join group: {response.json().get('detail', 'Unknown error')}")
                    except Exception as e:
                        st.error(f"Error: {str(e)}")
        
        # Create Group Expander
        with st.expander("Create a New Group", expanded=False):
            with st.form("create_group_form", clear_on_submit=True):
                group_name = st.text_input("Group Name", key="create_group_name")
                group_description = st.text_area("Description (Optional)", key="create_group_desc")
                submit_button = st.form_submit_button("Create Group")
                
                if submit_button and group_name:
                    try:
                        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                        response = requests.post(
                            f"{API_URL}/groups/",
                            json={"name": group_name, "description": group_description or ""},
                            headers=headers
                        )
                        if response.status_code == 201:
                            st.success("Group created successfully!")
                            group_data = response.json()
                            st.info(f"Group Code: {group_data.get('joinCode', 'N/A')}")
                            st.rerun()
                        else:
                            st.error(f"Failed to create group: {response.json().get('detail', 'Unknown error')}")
                    except Exception as e:
                        st.error(f"Error: {str(e)}")
        
        # Display User's Groups
        try:
            headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
            response = requests.get(
                f"{API_URL}/groups",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                groups = data.get('groups', [])
                if groups:
                    for group in groups:
                        with st.container():
                            col1, col2 = st.columns([3, 1])
                            with col1:
                                st.subheader(group.get("name", "Unnamed Group"))
                                st.caption(f"Group Code: {group.get('joinCode', 'N/A')}")
                                if group.get("description"):
                                    st.write(group.get("description"))
                            with col2:
                                if st.button("View Details", key=f"view_group_{group.get('_id')}"):
                                    st.session_state.selected_group = group
                                    st.rerun()
                else:
                    st.info("You haven't joined any groups yet.")
            else:
                st.error("Failed to fetch groups.")
        except Exception as e:
            st.error(f"Error fetching groups: {str(e)}")
        
        # Display Group Details if selected
        if "selected_group" in st.session_state:
            group = st.session_state.selected_group
            st.divider()
            st.subheader(f"Group Details: {group.get('name')}")
            
            # Group Info
            with st.expander("Group Information", expanded=True):
                st.write(f"**Description:** {group.get('description', 'No description')}")
                st.write(f"**Group Code:** {group.get('joinCode')}")
                st.write(f"**Created On:** {datetime.fromisoformat(group.get('createdAt').replace('Z', '+00:00')).strftime('%Y-%m-%d')}")
            
            # Group Members
            with st.expander("Members", expanded=True):
                try:
                    headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                    response = requests.get(
                        f"{API_URL}/groups/{group.get('_id')}/members",
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        members = response.json()
                        for member in members:
                            st.write(f"• {member.get('user', {}).get('name', 'Unknown User')}")
                    else:
                        st.error("Failed to fetch group members.")
                except Exception as e:
                    st.error(f"Error fetching members: {str(e)}")
            
            # Add Expense
            with st.expander("Add New Expense", expanded=False):
                with st.form(f"add_expense_form_{group.get('_id')}", clear_on_submit=True):
                    expense_title = st.text_input("Expense Title", key=f"expense_title_{group.get('_id')}")
                    expense_amount = st.number_input("Amount", min_value=0.01, format="%.2f", key=f"expense_amount_{group.get('_id')}")
                    expense_description = st.text_area("Description (Optional)", key=f"expense_desc_{group.get('_id')}")
                    expense_date = st.date_input("Date", key=f"expense_date_{group.get('_id')}")
                    submit_button = st.form_submit_button("Add Expense")
                    
                    if submit_button and expense_title and expense_amount:
                        try:
                            headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                            # Get group members for splitting
                            try:
                                members_response = requests.get(
                                    f"{API_URL}/groups/{group.get('_id')}/members",
                                    headers=headers
                                )
                                members = members_response.json()
                                
                                # Create equal splits for all members
                                equal_split_amount = round(expense_amount / len(members), 2)
                                splits = [
                                    {
                                        "userId": member.get("userId"),
                                        "amount": equal_split_amount,
                                        "type": "equal"
                                    }
                                    for member in members
                                ]
                                
                                expense_data = {
                                    "description": expense_title + (f" - {expense_description}" if expense_description else ""),
                                    "amount": expense_amount,
                                    "splits": splits,
                                    "splitType": "equal",
                                    "tags": []
                                }
                            except Exception as e:
                                st.error(f"Error creating expense data: {str(e)}")
                                st.stop()
                            
                            response = requests.post(
                                f"{API_URL}/groups/{group.get('_id')}/expenses",
                                json=expense_data,
                                headers=headers
                            )
                            
                            if response.status_code == 201:
                                st.success("Expense added successfully!")
                            else:
                                st.error(f"Failed to add expense: {response.json().get('detail', 'Unknown error')}")
                        except Exception as e:
                            st.error(f"Error adding expense: {str(e)}")
            
            # Group Expenses
            with st.expander("Expenses", expanded=True):
                try:
                    headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                    response = requests.get(
                        f"{API_URL}/groups/{group.get('_id')}/expenses",
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        expenses = data.get('expenses', [])
                        if expenses:
                            for expense in expenses:
                                with st.container():
                                    col1, col2, col3 = st.columns([3, 1, 1])
                                    with col1:
                                        st.write(f"**{expense.get('description', 'Unnamed Expense')}**")
                                    with col2:
                                        st.write(f"**₹{expense.get('amount', 0):.2f}**")
                                    with col3:
                                        date_str = expense.get('createdAt', '')
                                        if date_str:
                                            try:
                                                date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                                                st.write(date_obj.strftime('%Y-%m-%d'))
                                            except:
                                                st.write(date_str)
                                    
                                    # Get payer info
                                    payer_id = expense.get('createdBy')
                                    st.caption(f"Paid by: {next((m.get('user', {}).get('name', 'Unknown') for m in members if m.get('userId') == payer_id), 'Unknown')}")
                                    
                                    st.divider()
                        else:
                            st.info("No expenses in this group yet.")
                    else:
                        st.error("Failed to fetch expenses.")
                except Exception as e:
                    st.error(f"Error fetching expenses: {str(e)}")
    
    # Friends Tab (Coming Soon)
    with friends_tab:
        st.header("Friends")
        st.info("Coming Soon!")

if __name__ == "__main__":
    main()
