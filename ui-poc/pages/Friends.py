import json
import time
from collections import defaultdict
from datetime import datetime

import requests
import streamlit as st
from streamlit_cookies_manager import EncryptedCookieManager

st.title("Friends")

cookies = EncryptedCookieManager(
    prefix="splitwiser_",
    # note for prod: store this in a env file.
    password="your_super_secret_key",
)
if not cookies.ready():
    st.stop()


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


if not check_cookies():
    st.warning("Please log in first")
    st.stop()

# Base URL for API
API_URL = "https://splitwiser-production.up.railway.app"


# Helper function to retry API calls
def make_api_request(
    method, url, headers=None, json_data=None, max_retries=3, retry_delay=1
):
    retries = 0
    while retries < max_retries:
        try:
            if method.lower() == "get":
                response = requests.get(url, headers=headers)
            elif method.lower() == "post":
                response = requests.post(url, headers=headers, json=json_data)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            retries += 1
            if retries < max_retries:
                if st.session_state.debug_mode:
                    st.sidebar.warning(
                        f"API request failed, retrying ({retries}/{max_retries}): {e}"
                    )
                time.sleep(retry_delay)
            else:
                raise

    return None


# Debug mode toggle
if "debug_mode" not in st.session_state:
    st.session_state.debug_mode = False

# Connection status and refresh button in sidebar
with st.sidebar:
    st.session_state.debug_mode = st.checkbox(
        "Debug Mode", value=st.session_state.debug_mode
    )

    # Connection status check
    try:
        status_response = requests.get(f"{API_URL}/health", timeout=3)
        if status_response.status_code == 200:
            st.success("API Connection: Online")
        else:
            st.error(
                f"API Connection: Error (Status {status_response.status_code})")
    except Exception as e:
        st.error(f"API Connection: Offline")
        if st.session_state.debug_mode:
            st.write(f"Error: {str(e)}")

# Refresh button
refresh_col1, refresh_col2 = st.columns([8, 1])
with refresh_col2:
    if st.button("🔄"):
        st.rerun()


# Function to fetch user's groups
def fetch_user_groups():
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = make_api_request(
            "get", f"{API_URL}/groups", headers=headers)

        if st.session_state.debug_mode:
            st.sidebar.subheader("Debug: /groups response")
            st.sidebar.write(f"Status Code: {response.status_code}")
            try:
                st.sidebar.json(response.json())
            except:
                st.sidebar.write("Failed to parse response as JSON")
                st.sidebar.text(response.text)

        if response.status_code == 200:
            data = response.json()
            if "groups" in data:
                return data["groups"]
            else:
                st.error(
                    f"Unexpected response format: 'groups' key not found in response"
                )
                return []
        else:
            st.error(f"Failed to fetch groups: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"Error fetching groups: {str(e)}")
        return []


# Function to fetch group members
def fetch_group_members(group_id):
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = make_api_request(
            "get", f"{API_URL}/groups/{group_id}/members", headers=headers
        )

        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        if st.session_state.debug_mode:
            st.error(f"Error fetching members for group {group_id}: {str(e)}")
        return []


# Function to fetch group expenses
def fetch_group_expenses(group_id):
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = make_api_request(
            "get", f"{API_URL}/groups/{group_id}/expenses", headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            if "expenses" in data:
                return data["expenses"]
            else:
                return []
        else:
            return []
    except Exception as e:
        if st.session_state.debug_mode:
            st.error(f"Error fetching expenses for group {group_id}: {str(e)}")
        return []


# Function to calculate net balance between current user and a friend across all groups
def calculate_friend_balance(
    current_user_id, friend_user_id, groups, all_members, all_expenses
):
    net_balance = 0.0
    shared_groups = []

    for group in groups:
        group_id = group.get("_id")

        # Check if both users are in this group
        group_members = all_members.get(group_id, [])
        group_member_ids = [m.get("userId") for m in group_members]

        if current_user_id in group_member_ids and friend_user_id in group_member_ids:
            shared_groups.append(group.get("name"))

            # Get expenses for this group
            group_expenses = all_expenses.get(group_id, [])

            for expense in group_expenses:
                splits = expense.get("splits", [])
                payer_id = expense.get("createdBy")
                total_amount = expense.get("amount", 0)

                # Find splits for current user and friend
                current_user_split = next(
                    (s for s in splits if s.get("userId") == current_user_id), None
                )
                friend_split = next(
                    (s for s in splits if s.get("userId") == friend_user_id), None
                )

                if current_user_split or friend_split:
                    current_user_owes = (
                        current_user_split.get(
                            "amount", 0) if current_user_split else 0
                    )
                    friend_owes = friend_split.get(
                        "amount", 0) if friend_split else 0

                    current_user_paid = (
                        total_amount if payer_id == current_user_id else 0
                    )
                    friend_paid = total_amount if payer_id == friend_user_id else 0

                    # Calculate net effect on balance between these two users
                    # If current user paid for friend's share: positive balance (friend owes current user)
                    # If friend paid for current user's share: negative balance (current user owes friend)

                    if payer_id == current_user_id and friend_split:
                        # Current user paid, friend owes
                        net_balance += friend_owes

                    if payer_id == friend_user_id and current_user_split:
                        # Friend paid, current user owes
                        net_balance -= current_user_owes

    return net_balance, shared_groups


# Get current user ID
current_user_id = st.session_state.get("user_id", None)

if not current_user_id:
    st.error("Unable to get current user information. Please log in again.")
    st.stop()

# Fetch all groups
with st.spinner("Loading your groups and friends..."):
    groups = fetch_user_groups()

    if not groups:
        st.info("You haven't joined any groups yet. Join groups to see friends!")
        st.stop()

    # Fetch members and expenses for all groups
    all_members = {}
    all_expenses = {}

    for group in groups:
        group_id = group.get("_id")
        all_members[group_id] = fetch_group_members(group_id)
        all_expenses[group_id] = fetch_group_expenses(group_id)

# Find all unique friends (users who share at least one group)
friends_data = {}
group_names_map = {g.get("_id"): g.get("name") for g in groups}

for group in groups:
    group_id = group.get("_id")
    group_members = all_members.get(group_id, [])

    for member in group_members:
        user_id = member.get("userId")
        user_info = member.get("user", {})
        user_name = user_info.get("name", "Unknown User")

        # Skip current user
        if user_id == current_user_id:
            continue

        if user_id not in friends_data:
            friends_data[user_id] = {
                "name": user_name,
                "shared_groups": set(),
                "balance": 0.0,
            }

        friends_data[user_id]["shared_groups"].add(group_names_map[group_id])

# Calculate balances for each friend
for friend_id in friends_data:
    balance, shared_groups = calculate_friend_balance(
        current_user_id, friend_id, groups, all_members, all_expenses
    )
    friends_data[friend_id]["balance"] = balance

# Display friends
if friends_data:
    st.subheader(f"Your Friends ({len(friends_data)})")
    st.caption("People you share groups with")

    # Sort friends by absolute balance (highest debts/credits first)
    sorted_friends = sorted(
        friends_data.items(), key=lambda x: abs(x[1]["balance"]), reverse=True
    )

    # Summary cards
    total_owed_to_you = sum(max(0, data["balance"])
                            for data in friends_data.values())
    total_you_owe = sum(abs(min(0, data["balance"]))
                        for data in friends_data.values())

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Friends", len(friends_data))
    with col2:
        st.metric("You are owed", f"₹{total_owed_to_you:.2f}")
    with col3:
        st.metric("You owe", f"₹{total_you_owe:.2f}")

    st.divider()

    # Friends list
    for friend_id, friend_data in sorted_friends:
        with st.container():
            col1, col2, col3 = st.columns([3, 1, 1])

            with col1:
                st.subheader(friend_data["name"])
                shared_groups_text = ", ".join(
                    sorted(friend_data["shared_groups"]))
                st.caption(f"Shared groups: {shared_groups_text}")

            with col2:
                balance = friend_data["balance"]
                if balance > 0:
                    st.markdown(f":green[**₹{balance:.2f}**]")
                    st.caption("owes you")
                elif balance < 0:
                    st.markdown(f":red[**₹{abs(balance):.2f}**]")
                    st.caption("you owe")
                else:
                    st.markdown("**₹0.00**")
                    st.caption("settled up")

            with col3:
                if st.button("View Details", key=f"friend_details_{friend_id}"):
                    # Store friend details in session state for detailed view
                    st.session_state.selected_friend = {
                        "id": friend_id,
                        "name": friend_data["name"],
                        "balance": balance,
                        "shared_groups": friend_data["shared_groups"],
                    }
                    st.rerun()

            st.divider()

else:
    st.info("No friends found. Join groups with other people to see them here!")

# Show detailed view if a friend is selected
if "selected_friend" in st.session_state:
    friend = st.session_state.selected_friend

    st.subheader(f"Details with {friend['name']}")

    # Clear selection button
    if st.button("← Back to Friends List"):
        del st.session_state.selected_friend
        st.rerun()

    # Show balance
    balance = friend["balance"]
    if balance > 0:
        st.success(f"{friend['name']} owes you ₹{balance:.2f}")
    elif balance < 0:
        st.error(f"You owe {friend['name']} ₹{abs(balance):.2f}")
    else:
        st.info(f"You and {friend['name']} are settled up!")

    # Show shared groups
    st.write("### Shared Groups")
    for group_name in sorted(friend["shared_groups"]):
        st.write(f"• {group_name}")

    # TODO: Add detailed expense breakdown by group
    st.info("Detailed expense breakdown coming soon!")

# Debug information display
if st.session_state.debug_mode:
    st.subheader("Debug Information")
    st.write("API URL:", API_URL)
    st.write("Current User ID:", current_user_id)
    st.write("Groups Count:", len(groups) if groups else 0)
    st.write(
        "Friends Data:", friends_data if "friends_data" in locals() else "Not loaded"
    )
