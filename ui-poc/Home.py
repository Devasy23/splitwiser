import json
from datetime import datetime

import requests
import streamlit as st
from streamlit_cookies_manager import EncryptedCookieManager

# Configure the page
st.set_page_config(
    page_title="Splitwiser",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
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

cookies = EncryptedCookieManager(
    prefix="splitwiser_",
    # note for prod: store this in a env file.
    password="your_super_secret_key",
)
if not cookies.ready():
    st.stop()


def login(email, password):
    """Login user and store access token in session state"""
    try:
        response = requests.post(
            f"{API_URL}/auth/login/email", json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            st.session_state.access_token = data.get("access_token")
            # Update user_id from the response format
            user_data = data.get("user", {})
            st.session_state.user_id = user_data.get(
                "_id"
            )  # Changed from user_id to _id
            st.session_state.username = user_data.get(
                "name"
            )  # Changed from username to name

            cookies["access_token"] = data.get("access_token")
            cookies["user_id"] = user_data.get("_id")
            cookies["username"] = user_data.get("name")
            cookies.save()

            return True, "Login successful!"
        else:
            return (
                False,
                f"Login failed: {response.json().get('detail', 'Unknown error')}",
            )
    except Exception as e:
        return False, f"Error: {str(e)}"


def signup(username, email, password):
    """Register a new user"""
    try:
        response = requests.post(
            f"{API_URL}/auth/signup/email",
            json={"name": username, "email": email, "password": password},
        )
        if response.status_code == 200:
            return True, "Registration successful! Please login."
        else:
            return (
                False,
                f"Registration failed: {response.json().get('detail', 'Unknown error')}",
            )
    except Exception as e:
        return False, f"Error: {str(e)}"


def logout():
    """Clear session state and log out user"""
    # Clear session state keys by deleting them
    keys_to_clear = ["access_token", "user_id", "username"]
    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]
        cookies[key] = ""
    cookies.save()

    st.rerun()


def check_cookies():
    access_token = cookies.get("access_token")
    user_id = cookies.get("user_id")
    username = cookies.get("username")

    if access_token == "" or not access_token:
        st.session_state.access_token = None
        st.session_state.user_id = None
        st.session_state.username = None
        return False
    st.session_state.access_token = access_token
    st.session_state.user_id = user_id
    st.session_state.username = username
    return True


# Main app
def main():
    # Sidebar for app navigation
    cookie_check = False
    with st.sidebar:
        st.title("Splitwiser 💰")

        if cookie_check := check_cookies():
            st.success(f"Logged in as {st.session_state.username}")
            if st.button("Logout", key="logout_btn"):
                logout()

    # Main content
    if not cookie_check:
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
            password = st.text_input(
                "Password", type="password", key="login_password")
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
            password = st.text_input(
                "Password", type="password", key="signup_password")
            confirm_password = st.text_input(
                "Confirm Password", type="password", key="signup_confirm_password"
            )
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

    # Welcome message and quick stats
    st.write(f"Welcome back, {st.session_state.username}! 👋")

    # Quick actions section
    st.header("Quick Actions")
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("📱 View Groups", use_container_width=True):
            st.switch_page("pages/Groups.py")

    with col2:
        if st.button("👥 Manage Friends", use_container_width=True):
            st.switch_page("pages/Friends.py")

    with col3:
        if st.button("📊 View Analytics", use_container_width=True):
            st.info("Analytics page coming soon!")

    # Recent activity section
    st.header("Recent Activity")

    # Show recent groups and expenses summary
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = requests.get(f"{API_URL}/groups", headers=headers)

        if response.status_code == 200:
            data = response.json()
            groups = data.get("groups", [])

            if groups:
                st.subheader("Your Groups")
                for group in groups[:3]:  # Show only first 3 groups
                    with st.container():
                        col1, col2 = st.columns([3, 1])
                        with col1:
                            st.write(
                                f"**{group.get('name', 'Unnamed Group')}**")
                            st.caption(
                                f"Group Code: {group.get('joinCode', 'N/A')}")
                        with col2:
                            if st.button(
                                "View", key=f"view_group_home_{group.get('_id')}"
                            ):
                                st.switch_page("pages/Groups.py")

                if len(groups) > 3:
                    st.caption(f"And {len(groups) - 3} more groups...")
            else:
                st.info(
                    "You haven't joined any groups yet. Create or join a group to get started!"
                )
                if st.button("Get Started - Create a Group"):
                    st.switch_page("pages/Groups.py")
        else:
            st.error("Failed to fetch your recent activity.")
    except Exception as e:
        st.error(f"Error loading dashboard: {str(e)}")

    # Quick tips section
    with st.expander("💡 Tips for Getting Started"):
        st.markdown(
            """
        - **Create a Group**: Start by creating a group for your household, trips, or shared activities
        - **Invite Friends**: Share the group code with friends to start splitting expenses
        - **Add Expenses**: Record expenses and automatically split them among group members
        - **Track Balances**: See who owes what and settle up easily
        """
        )


# Legacy group functionality (moved to Groups page)
def legacy_groups_section():
    """This section has been moved to the Groups page"""


if __name__ == "__main__":
    main()
