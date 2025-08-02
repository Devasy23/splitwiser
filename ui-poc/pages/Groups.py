import json
import time
from datetime import datetime

import requests
import streamlit as st
from streamlit_cookies_manager import EncryptedCookieManager

st.title("Groups")

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

    return None  # This shouldn't be reached, but added for safety


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
            st.error(f"API Connection: Error (Status {status_response.status_code})")
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
        response = make_api_request("get", f"{API_URL}/groups", headers=headers)

        # Debug info
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
            error_msg = "Unknown error"
            try:
                error_data = response.json()
                if "detail" in error_data:
                    error_msg = error_data["detail"]
            except:
                error_msg = f"HTTP {response.status_code}"

            st.error(f"Failed to fetch groups: {error_msg}")
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

        # Debug info
        if st.session_state.debug_mode:
            st.sidebar.subheader(f"Debug: /groups/{group_id}/members response")
            st.sidebar.write(f"Status Code: {response.status_code}")
            try:
                st.sidebar.json(response.json())
            except:
                st.sidebar.write("Failed to parse response as JSON")
                st.sidebar.text(response.text)

        if response.status_code == 200:
            return response.json()
        else:
            error_msg = "Unknown error"
            try:
                error_data = response.json()
                if "detail" in error_data:
                    error_msg = error_data["detail"]
            except:
                error_msg = f"HTTP {response.status_code}"

            st.error(f"Failed to fetch group members: {error_msg}")
            return []
    except Exception as e:
        st.error(f"Error fetching members: {str(e)}")
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


# Function to fetch optimized settlements for a group
def fetch_group_optimized_settlements(group_id):
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = make_api_request(
            "post", f"{API_URL}/groups/{group_id}/settlements/optimize", headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            if "optimizedSettlements" in data:
                return data["optimizedSettlements"]
            else:
                return []
        else:
            return []
    except Exception as e:
        if st.session_state.debug_mode:
            st.error(
                f"Error fetching optimized settlements for group {group_id}: {str(e)}"
            )
        return []


# Function to calculate user balances within a group
def calculate_group_balances(expenses, members):
    # Initialize balances for all members
    balances = {member.get("userId"): 0 for member in members}

    for expense in expenses:
        payer_id = expense.get("createdBy")
        amount = expense.get("amount", 0)
        splits = expense.get("splits", [])

        # Add the full amount to the payer's balance (positive = gets money back)
        balances[payer_id] = balances.get(payer_id, 0) + amount

        # Subtract each person's share from their balance (negative = owes money)
        for split in splits:
            user_id = split.get("userId")
            split_amount = split.get("amount", 0)
            balances[user_id] = balances.get(user_id, 0) - split_amount

    return balances


# Initialize session state for this page
if "groups_view" not in st.session_state:
    st.session_state.groups_view = "list"  # Can be "list" or "detail"
if "selected_group_id" not in st.session_state:
    st.session_state.selected_group_id = None

# Join Group Expander
with st.expander("Join a Group", expanded=False):
    with st.form("join_group_form_page", clear_on_submit=True):
        group_code = st.text_input("Enter Group Code", key="join_group_code_page")
        submit_button = st.form_submit_button("Join Group")

        if submit_button and group_code:
            try:
                headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                response = make_api_request(
                    "post",
                    f"{API_URL}/groups/join",
                    headers=headers,
                    json_data={"joinCode": group_code},
                )
                if response.status_code == 200:
                    st.success("Successfully joined the group!")
                    st.rerun()
                else:
                    st.error(
                        f"Failed to join group: {response.json().get('detail', 'Unknown error')}"
                    )
            except Exception as e:
                st.error(f"Error: {str(e)}")

# Create Group Expander
with st.expander("Create a New Group", expanded=False):
    with st.form("create_group_form_page", clear_on_submit=True):
        group_name = st.text_input("Group Name", key="create_group_name_page")
        group_description = st.text_area(
            "Description (Optional)", key="create_group_desc_page"
        )
        submit_button = st.form_submit_button("Create Group")

        if submit_button and group_name:
            try:
                headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                # Fix: Remove description field as it's not in the schema
                group_data = {"name": group_name}
                if group_description:
                    # Since description is not in the schema, we could add it to the name
                    pass  # For now, ignore description

                response = make_api_request(
                    "post",
                    f"{API_URL}/groups",  # Remove trailing slash
                    headers=headers,
                    json_data=group_data,
                )
                if response.status_code == 201:
                    st.success("Group created successfully!")
                    group_data = response.json()
                    st.info(
                        f"Group Code: {group_data.get('joinCode', 'N/A')}"
                    )  # Fix: use joinCode instead of group_code
                    st.rerun()
                else:
                    st.error(
                        f"Failed to create group: {response.json().get('detail', 'Unknown error')}"
                    )
                    if st.session_state.debug_mode:
                        st.error(f"Response: {response.text}")
            except Exception as e:
                st.error(f"Error: {str(e)}")

# Display based on view state
if st.session_state.groups_view == "list":
    # Fetch and display user's groups
    groups = fetch_user_groups()

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
                    if st.button(
                        "View Details", key=f"view_group_page_{group.get('_id')}"
                    ):
                        st.session_state.groups_view = "detail"
                        st.session_state.selected_group_id = group.get("_id")
                        st.session_state.selected_group = group
                        st.rerun()
                st.divider()
    else:
        st.info("You haven't joined any groups yet.")

elif st.session_state.groups_view == "detail" and st.session_state.selected_group_id:
    # Back button
    if st.button("← Back to Groups", key="back_to_groups"):
        st.session_state.groups_view = "list"
        st.session_state.selected_group_id = None
        st.rerun()

    # Get group details
    group = st.session_state.selected_group

    # Group header
    st.header(group.get("name"))
    st.caption(f"Group Code: {group.get('joinCode')}")

    # Group Info
    with st.expander("Group Information", expanded=True):
        st.write(f"**Description:** {group.get('description', 'No description')}")
        st.write(
            f"**Created On:** {datetime.fromisoformat(group.get('createdAt').replace('Z', '+00:00')).strftime('%Y-%m-%d')}"
        )

    # Group Members
    with st.expander("Members", expanded=True):
        members = fetch_group_members(group.get("_id"))
        if members:
            for member in members:
                st.write(f"• {member.get('user', {}).get('name', 'Unknown User')}")
        else:
            st.write("No members found.")

    # Add Expense
    with st.expander("Add New Expense", expanded=False):
        with st.form(f"add_expense_form_page_{group.get('_id')}", clear_on_submit=True):
            expense_title = st.text_input(
                "Expense Title", key=f"expense_title_page_{group.get('_id')}"
            )
            expense_amount = st.number_input(
                "Amount",
                min_value=0.01,
                format="%.2f",
                key=f"expense_amount_page_{group.get('_id')}",
            )
            expense_description = st.text_area(
                "Description (Optional)", key=f"expense_desc_page_{group.get('_id')}"
            )
            expense_date = st.date_input(
                "Date", key=f"expense_date_page_{group.get('_id')}"
            )

            # Fetch members for payer selection
            members = fetch_group_members(group.get("_id"))
            member_options = {
                member.get("user", {}).get("name", f"User {i}"): member.get("userId")
                for i, member in enumerate(members, 1)
            }

            col1, col2 = st.columns([3, 1])
            with col1:
                selected_payer = st.selectbox(
                    "Paid by",
                    options=list(member_options.keys()),
                    key=f"expense_payer_page_{group.get('_id')}",
                )
            with col2:
                st.write("💰 **Total Amount**")
                st.write(f"**₹{expense_amount:.2f}**")

            # Split options with tabs
            st.write("### Split Options")
            split_method_tooltip = """
            - Equally: Split the amount equally between selected members
            - By Percentages: Specify what percentage of the bill each person pays
            - By Shares: Assign shares to each person (e.g., 1 share = 1 portion)
            - By Exact Value: Enter the exact amount each person should pay
            """
            st.info(split_method_tooltip)

            # Set up tab tracking - make the radio button visually match the tabs
            tab_options = ["Equally", "By Percentages", "By Shares", "By Exact Value"]
            tab_key = f"active_tab_{group.get('_id')}"

            if tab_key not in st.session_state:
                st.session_state[tab_key] = "Equally"

            # Create a visible tab selector using radio buttons
            active_tab = st.radio(
                "Split Method", tab_options, horizontal=True, key=tab_key
            )

            # Create the tabs that show content based on the active tab
            split_tabs = st.tabs(tab_options)

            # Only show the content for the active tab
            active_tab_index = tab_options.index(active_tab)

            # Initialize session state for member selection
            if f"selected_members_{group.get('_id')}" not in st.session_state:
                st.session_state[f"selected_members_{group.get('_id')}"] = [
                    m.get("userId") for m in members
                ]

            # Tab 1: Split Equally
            with split_tabs[0]:
                st.write("Split equally between:")

                # Initialize selected members dict if not exists
                tab_key = f"equal_members_{group.get('_id')}"
                if tab_key not in st.session_state:
                    st.session_state[tab_key] = {m.get("userId"): True for m in members}

                # Select/Deselect All checkbox
                all_selected_key = f"all_members_equal_{group.get('_id')}"

                # Check if all are currently selected
                all_currently_selected = all(st.session_state[tab_key].values())

                # The checkbox for Select All / Deselect All
                all_selected = st.checkbox(
                    "Select/Deselect All",
                    value=all_currently_selected,
                    key=all_selected_key,
                )

                # If the checkbox state changes, update all members
                if all_selected != all_currently_selected:
                    for member in members:
                        st.session_state[tab_key][member.get("userId")] = all_selected

                # Individual member checkboxes
                member_cols = st.columns(
                    2
                )  # Display in 2 columns for better space usage
                for i, member in enumerate(members):
                    user_name = member.get("user", {}).get("name", "Unknown User")
                    with member_cols[i % 2]:
                        is_selected = st.checkbox(
                            user_name,
                            value=st.session_state[tab_key].get(
                                member.get("userId"), True
                            ),
                            key=f"equal_member_{member.get('userId')}_{group.get('_id')}",
                        )
                        st.session_state[tab_key][member.get("userId")] = is_selected

                # Get list of selected member IDs
                selected_member_ids = [
                    member_id
                    for member_id, is_selected in st.session_state[tab_key].items()
                    if is_selected
                ]

                # Display warning if no members are selected
                if not selected_member_ids:
                    st.warning(
                        "Please select at least one member to split the expense."
                    )

            # Tab 2: By Percentages
            with split_tabs[1]:
                st.write("Split by percentages")

                # Initialize percentages
                percentage_inputs = {}
                total_percentage = 0

                for member in members:
                    user_name = member.get("user", {}).get("name", "Unknown User")
                    default_value = (
                        round(100 / len(members), 2) if len(members) > 0 else 0
                    )
                    percentage = st.number_input(
                        f"{user_name} (%)",
                        min_value=0.0,
                        max_value=100.0,
                        value=default_value,
                        step=0.1,
                        format="%.2f",
                        key=f"percent_{member.get('userId')}",
                    )
                    percentage_inputs[member.get("userId")] = percentage
                    total_percentage += percentage

                # Show total percentage
                if total_percentage != 100:
                    st.warning(
                        f"Total percentage: {total_percentage}% (should be 100%)"
                    )
                else:
                    st.success(f"Total percentage: {total_percentage}%")

            # Tab 3: By Shares
            with split_tabs[2]:
                st.write("Split by shares")

                # Initialize shares
                share_inputs = {}
                total_shares = 0

                for member in members:
                    user_name = member.get("user", {}).get("name", "Unknown User")
                    shares = st.number_input(
                        f"{user_name} (shares)",
                        min_value=0,
                        value=1,
                        step=1,
                        key=f"shares_{member.get('userId')}",
                    )
                    share_inputs[member.get("userId")] = shares
                    total_shares += shares

                # Show total shares
                if total_shares == 0:
                    st.error("Total shares cannot be 0")
                else:
                    st.info(f"Total shares: {total_shares}")

                    # Show preview of amount per person
                    st.write("### Preview:")
                    for member in members:
                        user_name = member.get("user", {}).get("name", "Unknown User")
                        user_id = member.get("userId")
                        if user_id in share_inputs and total_shares > 0:
                            share_percentage = share_inputs[user_id] / total_shares
                            amount = expense_amount * share_percentage
                            st.write(
                                f"{user_name}: ₹{amount:.2f} ({share_percentage*100:.2f}%)"
                            )

            # Tab 4: By Exact Value
            with split_tabs[3]:
                st.write("Split by exact amounts")

                # Initialize exact amounts
                exact_inputs = {}
                total_exact = 0

                for member in members:
                    user_name = member.get("user", {}).get("name", "Unknown User")
                    exact_amount = st.number_input(
                        f"{user_name} (₹)",
                        min_value=0.0,
                        max_value=float(expense_amount),
                        value=(
                            round(expense_amount / len(members), 2)
                            if len(members) > 0
                            else 0
                        ),
                        step=0.01,
                        format="%.2f",
                        key=f"exact_{member.get('userId')}",
                    )
                    exact_inputs[member.get("userId")] = exact_amount
                    total_exact += exact_amount

                # Show total amount
                if abs(total_exact - expense_amount) > 0.01:
                    st.warning(
                        f"Total: ₹{total_exact:.2f} (should be ₹{expense_amount:.2f})"
                    )
                else:
                    st.success(f"Total: ₹{total_exact:.2f}")

            # Active tab is already set by the set_active_tab function in each tab
            # This ensures we're using the correctly selected tab for calculations

            # Show a summary of the split
            st.write("---")
            st.write("### Split Summary")

            # Calculate and display split summary based on the active tab
            if active_tab == "Equally":
                # Get the list of selected members from the session state
                equal_tab_key = f"equal_members_{group.get('_id')}"
                selected_member_ids = [
                    member_id
                    for member_id, is_selected in st.session_state[
                        equal_tab_key
                    ].items()
                    if is_selected
                ]

                if selected_member_ids:
                    equal_split_amount = round(
                        expense_amount / len(selected_member_ids), 2
                    )
                    for member in members:
                        user_name = member.get("user", {}).get("name", "Unknown User")
                        if member.get("userId") in selected_member_ids:
                            st.write(f"• {user_name}: ₹{equal_split_amount:.2f}")
                        else:
                            st.write(f"• {user_name}: ₹0.00")
                else:
                    st.warning("No members selected for splitting")

            elif active_tab == "By Percentages":
                for member in members:
                    user_name = member.get("user", {}).get("name", "Unknown User")
                    percentage = percentage_inputs.get(member.get("userId"), 0)
                    amount = round(expense_amount * percentage / 100, 2)
                    st.write(f"• {user_name}: ₹{amount:.2f} ({percentage}%)")

            elif active_tab == "By Shares":
                if total_shares > 0:
                    for member in members:
                        user_name = member.get("user", {}).get("name", "Unknown User")
                        shares = share_inputs.get(member.get("userId"), 0)
                        amount = (
                            round(expense_amount * shares / total_shares, 2)
                            if shares > 0
                            else 0
                        )
                        st.write(f"• {user_name}: ₹{amount:.2f} ({shares} shares)")
                else:
                    st.warning("Total shares must be greater than 0")

            elif active_tab == "By Exact Value":
                for member in members:
                    user_name = member.get("user", {}).get("name", "Unknown User")
                    amount = exact_inputs.get(member.get("userId"), 0)
                    st.write(f"• {user_name}: ₹{amount:.2f}")

                if abs(total_exact - expense_amount) > 0.01:
                    remaining = expense_amount - total_exact
                    st.warning(f"Remaining amount to be allocated: ₹{remaining:.2f}")

            submit_button = st.form_submit_button("Add Expense")

            if submit_button and expense_title and expense_amount:
                try:
                    headers = {
                        "Authorization": f"Bearer {st.session_state.access_token}"
                    }
                    # Create splits based on selected tab
                    try:
                        if not members:
                            st.error(
                                "No members found in group. Cannot create expense."
                            )
                            st.stop()

                        splits = []
                        split_type = "equal"

                        if active_tab == "Equally":
                            # Get the list of selected members from the session state
                            equal_tab_key = f"equal_members_{group.get('_id')}"
                            selected_member_ids = [
                                member_id
                                for member_id, is_selected in st.session_state[
                                    equal_tab_key
                                ].items()
                                if is_selected
                            ]

                            if not selected_member_ids:
                                st.error(
                                    "No members selected for splitting the expense."
                                )
                                st.stop()

                            equal_split_amount = round(
                                expense_amount / len(selected_member_ids), 2
                            )
                            splits = [
                                {
                                    "userId": member_id,
                                    "amount": equal_split_amount,
                                    "type": "equal",
                                }
                                for member_id in selected_member_ids
                            ]
                            split_type = "equal"

                        elif active_tab == "By Percentages":
                            if abs(total_percentage - 100) > 0.01:
                                st.error("Total percentage must be 100%.")
                                st.stop()

                            splits = [
                                {
                                    "userId": member.get("userId"),
                                    "amount": round(
                                        expense_amount
                                        * percentage_inputs[member.get("userId")]
                                        / 100,
                                        2,
                                    ),
                                    "type": "percentage",
                                }
                                for member in members
                                if percentage_inputs.get(member.get("userId"), 0) > 0
                            ]
                            split_type = "percentage"

                        elif active_tab == "By Shares":
                            if total_shares == 0:
                                st.error("Total shares cannot be 0.")
                                st.stop()

                            splits = [
                                {
                                    "userId": member.get("userId"),
                                    "amount": round(
                                        expense_amount
                                        * share_inputs[member.get("userId")]
                                        / total_shares,
                                        2,
                                    ),
                                    "type": "unequal",
                                }
                                for member in members
                                if share_inputs.get(member.get("userId"), 0) > 0
                            ]
                            split_type = "unequal"

                        elif active_tab == "By Exact Value":
                            if abs(total_exact - expense_amount) > 0.01:
                                st.error(
                                    f"Total amount must be equal to ₹{expense_amount:.2f}."
                                )
                                st.stop()

                            splits = [
                                {
                                    "userId": member.get("userId"),
                                    "amount": exact_inputs[member.get("userId")],
                                    "type": "exact",
                                }
                                for member in members
                                if exact_inputs.get(member.get("userId"), 0) > 0
                            ]
                            split_type = "exact"

                        # Get the payer's ID from the selected name
                        payer_id = member_options.get(selected_payer)

                        expense_data = {
                            "description": expense_title
                            + (
                                f" - {expense_description}"
                                if expense_description
                                else ""
                            ),
                            "amount": expense_amount,
                            "splits": splits,
                            "splitType": split_type,
                            "paidBy": payer_id,  # Add the payer ID
                            "tags": [],
                        }

                        if st.session_state.debug_mode:
                            st.sidebar.subheader("Debug: Expense data being sent")
                            st.sidebar.json(expense_data)
                    except Exception as e:
                        st.error(f"Error creating expense data: {str(e)}")
                        st.stop()

                    with st.spinner("Creating expense..."):
                        response = make_api_request(
                            "post",
                            f"{API_URL}/groups/{group.get('_id')}/expenses",
                            headers=headers,
                            json_data=expense_data,
                        )

                    if response.status_code == 201:
                        st.success("Expense added successfully!")
                        st.rerun()
                    else:
                        st.error(
                            f"Failed to add expense: {response.json().get('detail', 'Unknown error')}"
                        )
                except Exception as e:
                    st.error(f"Error adding expense: {str(e)}")

    # Group Summary and Settlements
    st.subheader("Group Summary")
    expenses = fetch_group_expenses(group.get("_id"))
    members = fetch_group_members(group.get("_id"))

    # Create a dictionary for quick member name lookup
    member_names = {
        m.get("userId"): m.get("user", {}).get("name", "Unknown") for m in members
    }

    # Current user ID for highlighting
    current_user_id = st.session_state.get("user_id", None)

    # Calculate all user balances within the group
    balances = calculate_group_balances(expenses, members)

    # Display group metrics
    col1, col2 = st.columns(2)

    with col1:
        # Count total expenses in the group
        st.metric("Total Expenses", len(expenses) if expenses else 0)

    with col2:
        # Calculate total amount of all expenses
        total_amount = (
            sum(expense.get("amount", 0) for expense in expenses) if expenses else 0
        )
        st.metric("Total Amount", f"₹{total_amount:.2f}")

    # Show current user's balance first
    if current_user_id and current_user_id in balances:
        user_balance = balances[current_user_id]
        if user_balance > 0:
            st.success(f"Your total balance: You are owed ₹{user_balance:.2f}")
        elif user_balance < 0:
            st.error(f"Your total balance: You owe ₹{abs(user_balance):.2f}")
        else:
            st.info("Your total balance: You're all settled up!")

    # Settlement Summary Section
    st.subheader("Settlement Summary")

    # Show everyone's balances in an expandable section
    with st.expander("See everyone's balance"):
        balance_cols = st.columns(2)
        i = 0
        sorted_balances = sorted(balances.items(), key=lambda x: x[1], reverse=True)

        for user_id, balance in sorted_balances:
            user_name = member_names.get(user_id, "Unknown User")
            is_current_user = user_id == current_user_id

            # Format the name with (You) if it's the current user
            display_name = f"{user_name} (You)" if is_current_user else user_name

            with balance_cols[i % 2]:
                if balance > 0:
                    st.markdown(f"**{display_name}**: :green[Is owed ₹{balance:.2f}]")
                elif balance < 0:
                    st.markdown(f"**{display_name}**: :red[Owes ₹{abs(balance):.2f}]")
                else:
                    st.markdown(f"**{display_name}**: Settled up")
            i += 1

    # Get optimized settlements
    optimized_settlements = fetch_group_optimized_settlements(group.get("_id"))

    # Show the optimized settlements
    st.markdown("### How to settle up")

    if optimized_settlements:
        # Calculate total settlements involving current user
        user_to_pay_total = 0
        user_to_receive_total = 0

        for settlement in optimized_settlements:
            from_user_id = settlement.get("fromUserId")
            to_user_id = settlement.get("toUserId")
            amount = settlement.get("amount", 0)

            if from_user_id == current_user_id:
                user_to_pay_total += amount
            elif to_user_id == current_user_id:
                user_to_receive_total += amount

        # Display summary metrics for current user
        if current_user_id:
            col1, col2 = st.columns(2)
            with col1:
                if user_to_pay_total > 0:
                    st.metric("You need to pay", f"₹{user_to_pay_total:.2f}")
                else:
                    st.metric("You need to pay", "₹0.00")

            with col2:
                if user_to_receive_total > 0:
                    st.metric("You will receive", f"₹{user_to_receive_total:.2f}")
                else:
                    st.metric("You will receive", "₹0.00")

        st.caption("Here's how to settle all debts with minimum transactions:")

        # Group settlements by whether they involve the current user
        user_settlements = []
        other_settlements = []

        for settlement in optimized_settlements:
            from_user_id = settlement.get("fromUserId")
            to_user_id = settlement.get("toUserId")

            if from_user_id == current_user_id or to_user_id == current_user_id:
                user_settlements.append(settlement)
            else:
                other_settlements.append(settlement)

        # Display the user's settlements first
        if user_settlements:
            st.markdown("#### Your settlements")
            for settlement in user_settlements:
                from_user_id = settlement.get("fromUserId")
                to_user_id = settlement.get("toUserId")
                amount = settlement.get("amount", 0)

                # Format names for display
                from_name = settlement.get(
                    "fromUserName", member_names.get(from_user_id, "Unknown")
                )
                to_name = settlement.get(
                    "toUserName", member_names.get(to_user_id, "Unknown")
                )

                with st.container():
                    # Create a card-like container for each settlement
                    col1, col2 = st.columns([5, 1])

                    with col1:
                        if from_user_id == current_user_id:
                            # Current user needs to pay
                            st.markdown(f"**:red[You pay {to_name} ₹{amount:.2f}]**")

                            # Add payment details as an expandable section
                            with st.expander("Payment details"):
                                st.write(
                                    f"Pay **{to_name}** ₹{amount:.2f} to settle your debt in this group."
                                )

                                # Could add payment options or UPI ID here in future versions
                                payment_text = f"Payment for group: {group.get('name')} - Amount: ₹{amount:.2f}"
                                st.code(payment_text, language="text")

                        elif to_user_id == current_user_id:
                            # Current user gets money
                            st.markdown(
                                f"**:green[{from_name} pays you ₹{amount:.2f}]**"
                            )

        # Then display other settlements
        if other_settlements:
            if user_settlements:
                st.markdown("#### Other settlements")

            # Group other settlements by who is paying
            settlements_by_payer = {}
            for settlement in other_settlements:
                from_user_id = settlement.get("fromUserId")
                if from_user_id not in settlements_by_payer:
                    settlements_by_payer[from_user_id] = []
                settlements_by_payer[from_user_id].append(settlement)

            # Display each payer's settlements
            for payer_id, payer_settlements in settlements_by_payer.items():
                payer_name = member_names.get(payer_id, "Unknown")

                with st.expander(f"{payer_name}'s settlements"):
                    for settlement in payer_settlements:
                        to_user_id = settlement.get("toUserId")
                        amount = settlement.get("amount", 0)
                        to_name = settlement.get(
                            "toUserName", member_names.get(to_user_id, "Unknown")
                        )

                        st.markdown(f"• Pays {to_name} ₹{amount:.2f}")
    else:
        st.info("No settlements needed. Everyone is settled up!")

    # Group Expenses Section
    st.subheader("Expenses")

    if expenses:
        for expense in expenses:
            with st.container():
                col1, col2, col3 = st.columns([3, 1, 1])
                with col1:
                    st.write(f"**{expense.get('description', 'Unnamed Expense')}**")
                with col2:
                    st.write(f"**₹{expense.get('amount', 0):.2f}**")
                with col3:
                    date_str = expense.get("createdAt", "")
                    if date_str:
                        try:
                            date_obj = datetime.fromisoformat(
                                date_str.replace("Z", "+00:00")
                            )
                            st.write(date_obj.strftime("%Y-%m-%d"))
                        except:
                            st.write(date_str)

                # Get payer info
                payer_id = expense.get("createdBy")
                payer_name = next(
                    (
                        m.get("user", {}).get("name", "Unknown")
                        for m in members
                        if m.get("userId") == payer_id
                    ),
                    "Unknown",
                )

                # Calculate current user's involvement and balance
                if current_user_id:
                    splits = expense.get("splits", [])

                    # Find current user's split (amount they owe)
                    user_split = next(
                        (
                            split
                            for split in splits
                            if split.get("userId") == current_user_id
                        ),
                        None,
                    )

                    if user_split:
                        # User is included in the expense
                        amount_owed = user_split.get("amount", 0)
                        amount_paid = (
                            expense.get("amount", 0)
                            if payer_id == current_user_id
                            else 0
                        )
                        net_balance = amount_paid - amount_owed

                        if net_balance > 0:
                            # User gets money back (green)
                            st.markdown(f":green[Paid by: {payer_name}]")
                            st.markdown(f":green[You get back: ₹{net_balance:.2f}]")
                        elif net_balance < 0:
                            # User owes money (red)
                            st.markdown(f":red[Paid by: {payer_name}]")
                            st.markdown(f":red[You owe: ₹{abs(net_balance):.2f}]")
                        else:
                            # User is even
                            st.caption(f"Paid by: {payer_name}")
                            st.caption("You're even on this expense")
                    else:
                        # User is not included in the expense (grey)
                        st.markdown(f":gray[Paid by: {payer_name}]")
                        st.markdown(f":gray[You are not included in this expense]")
                else:
                    # Fallback if user ID not available
                    st.caption(f"Paid by: {payer_name}")

                st.divider()
    else:
        st.info("No expenses in this group yet.")

# Debug information display
if st.session_state.debug_mode:
    st.subheader("Debug Information")
    st.write("API URL:", API_URL)
    st.write("Session State:", dict(st.session_state))
