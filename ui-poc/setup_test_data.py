#!/usr/bin/env python3
"""
Splitwiser Test Data Setup Script

This script creates a realistic test environment with multiple users, groups, and various types of expenses
to simulate real-world scenarios for testing the Splitwiser application.

Features:
- Creates 5 different user accounts
- Sets up 3 groups with different member combinations
- Adds various types of expenses (equal splits, unequal splits, percentages)
- Creates a complex web of debts and credits between users
- Includes different scenarios like travel, dining, utilities, etc.
"""

import json
import random
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List

import requests

# API Configuration
API_URL = "https://splitwiser-production.up.railway.app"


class SplitWiserTestSetup:
    def __init__(self):
        self.users = {}
        self.groups = {}
        self.expenses = []

    def signup_user(self, name: str, email: str, password: str) -> Dict[str, Any]:
        """Sign up a new user and return user data with tokens"""
        url = f"{API_URL}/auth/signup/email"
        data = {"name": name, "email": email, "password": password}

        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Created user: {name} ({email})")
            return result
        elif response.status_code == 400 or response.status_code == 409:
            # User might already exist, try to login instead
            print(f"⚠️  User {name} already exists, attempting login...")
            return self.login_user(email, password)
        else:
            print(
                f"❌ Failed to create user {name}: Status {response.status_code}, {response.text}"
            )
            # Still try to login in case the user exists
            print(f"⚠️  Attempting login for {name} anyway...")
            return self.login_user(email, password)

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login an existing user"""
        url = f"{API_URL}/auth/login/email"
        data = {"email": email, "password": password}

        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Logged in existing user: {result['user']['name']} ({email})")
            return result
        else:
            print(f"❌ Failed to login user {email}: {response.text}")
            return None

    def create_group(self, user_token: str, name: str) -> Dict[str, Any]:
        """Create a new group"""
        url = f"{API_URL}/groups"
        headers = {"Authorization": f"Bearer {user_token}"}
        data = {"name": name}

        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Created group: {name}")
            return result
        else:
            print(f"❌ Failed to create group {name}: {response.text}")
            print(f"Request URL: {url}")
            print(f"Request headers: {headers}")
            print(f"Request data: {data}")
            return None

    def join_group(self, user_token: str, join_code: str, user_name: str) -> bool:
        """Join a group using join code"""
        url = f"{API_URL}/groups/join"
        headers = {"Authorization": f"Bearer {user_token}"}
        data = {"joinCode": join_code}

        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            print(f"✅ {user_name} joined group with code: {join_code}")
            return True
        else:
            print(
                f"❌ Failed to join group {join_code} for {user_name}: {response.text}"
            )
            return False

    def get_existing_expenses(
        self, user_token: str, group_id: str
    ) -> List[Dict[str, Any]]:
        """Get existing expenses for a group"""
        url = f"{API_URL}/groups/{group_id}/expenses"
        headers = {"Authorization": f"Bearer {user_token}"}

        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get("expenses", [])
        else:
            return []

    def expense_exists(self, expenses: List[Dict], description: str) -> bool:
        """Check if an expense with the given description already exists"""
        for expense in expenses:
            if expense.get("description") == description:
                return True
        return False

    def create_expense(
        self,
        user_token: str,
        group_id: str,
        description: str,
        amount: float,
        splits: List[Dict],
        split_type: str = "equal",
    ) -> Dict[str, Any]:
        """Create a new expense"""
        url = f"{API_URL}/groups/{group_id}/expenses"
        headers = {"Authorization": f"Bearer {user_token}"}
        data = {
            "description": description,
            "amount": amount,
            "splits": splits,
            "splitType": split_type,
            "tags": [],
            "receiptUrls": [],
        }

        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Created expense: {description} (₹{amount})")
            return result
        else:
            print(f"❌ Failed to create expense {description}: {response.text}")
            print(f"Request URL: {url}")
            print(f"Request data: {data}")
            return None

    def create_expense_if_not_exists(
        self,
        user_token: str,
        group_id: str,
        description: str,
        amount: float,
        splits: List[Dict],
        split_type: str = "equal",
    ) -> Dict[str, Any]:
        """Create an expense only if it doesn't already exist"""
        existing_expenses = self.get_existing_expenses(user_token, group_id)

        if self.expense_exists(existing_expenses, description):
            print(f"⚠️  Expense '{description}' already exists, skipping...")
            return {"skipped": True}

        return self.create_expense(
            user_token, group_id, description, amount, splits, split_type
        )

    def setup_users(self):
        """Create test users"""
        print("\n🔧 Setting up test users...")

        user_data = [
            {
                "name": "Alice Johnson",
                "email": "alice@example.com",
                "password": "password123",
            },
            {
                "name": "Bob Smith",
                "email": "bob@example.com",
                "password": "password123",
            },
            {
                "name": "Charlie Brown",
                "email": "charlie@example.com",
                "password": "password123",
            },
            {
                "name": "Diana Prince",
                "email": "diana@example.com",
                "password": "password123",
            },
            {
                "name": "Eve Wilson",
                "email": "eve@example.com",
                "password": "password123",
            },
        ]

        for user in user_data:
            result = self.signup_user(user["name"], user["email"], user["password"])
            if result:
                self.users[user["name"]] = {
                    "id": result["user"]["_id"],
                    "email": user["email"],
                    "access_token": result["access_token"],
                    "refresh_token": result["refresh_token"],
                }
                time.sleep(0.5)  # Rate limiting

    def get_existing_groups(self, user_token: str) -> List[Dict[str, Any]]:
        """Get list of existing groups for a user"""
        url = f"{API_URL}/groups"
        headers = {"Authorization": f"Bearer {user_token}"}

        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get("groups", [])
        else:
            print(f"⚠️  Failed to fetch existing groups: {response.text}")
            return []

    def find_group_by_name(self, groups: List[Dict], name: str) -> Dict[str, Any]:
        """Find a group by name in the list of groups"""
        for group in groups:
            if group.get("name") == name:
                return group
        return None

    def setup_groups(self):
        """Create test groups and add members"""
        print("\n🏠 Setting up test groups...")

        # Check if groups already exist
        existing_groups = self.get_existing_groups(
            self.users["Alice Johnson"]["access_token"]
        )

        # Group 1: House Share (Alice, Bob, Charlie)
        house_group = self.find_group_by_name(existing_groups, "House Share")
        if house_group:
            print(f"✅ Group 'House Share' already exists")
            self.groups["House Share"] = house_group
        else:
            house_group = self.create_group(
                self.users["Alice Johnson"]["access_token"], "House Share"
            )
            if house_group:
                self.groups["House Share"] = house_group
                # Add Bob and Charlie to the group
                self.join_group(
                    self.users["Bob Smith"]["access_token"],
                    house_group["joinCode"],
                    "Bob Smith",
                )
                self.join_group(
                    self.users["Charlie Brown"]["access_token"],
                    house_group["joinCode"],
                    "Charlie Brown",
                )
                time.sleep(1)

        # Group 2: Trip to Goa (Alice, Diana, Eve)
        existing_groups_diana = self.get_existing_groups(
            self.users["Diana Prince"]["access_token"]
        )
        trip_group = self.find_group_by_name(existing_groups_diana, "Trip to Goa")
        if trip_group:
            print(f"✅ Group 'Trip to Goa' already exists")
            self.groups["Trip to Goa"] = trip_group
        else:
            trip_group = self.create_group(
                self.users["Diana Prince"]["access_token"], "Trip to Goa"
            )
            if trip_group:
                self.groups["Trip to Goa"] = trip_group
                # Add Alice and Eve to the group
                self.join_group(
                    self.users["Alice Johnson"]["access_token"],
                    trip_group["joinCode"],
                    "Alice Johnson",
                )
                self.join_group(
                    self.users["Eve Wilson"]["access_token"],
                    trip_group["joinCode"],
                    "Eve Wilson",
                )
                time.sleep(1)

        # Group 3: Office Lunch Group (Bob, Charlie, Diana, Eve)
        existing_groups_bob = self.get_existing_groups(
            self.users["Bob Smith"]["access_token"]
        )
        lunch_group = self.find_group_by_name(existing_groups_bob, "Office Lunch Group")
        if lunch_group:
            print(f"✅ Group 'Office Lunch Group' already exists")
            self.groups["Office Lunch Group"] = lunch_group
        else:
            lunch_group = self.create_group(
                self.users["Bob Smith"]["access_token"], "Office Lunch Group"
            )
            if lunch_group:
                self.groups["Office Lunch Group"] = lunch_group
                # Add Charlie, Diana, and Eve to the group
                self.join_group(
                    self.users["Charlie Brown"]["access_token"],
                    lunch_group["joinCode"],
                    "Charlie Brown",
                )
                self.join_group(
                    self.users["Diana Prince"]["access_token"],
                    lunch_group["joinCode"],
                    "Diana Prince",
                )
                self.join_group(
                    self.users["Eve Wilson"]["access_token"],
                    lunch_group["joinCode"],
                    "Eve Wilson",
                )
                time.sleep(1)

    def setup_house_expenses(self):
        """Create expenses for the House Share group"""
        print("\n🏠 Creating House Share expenses...")

        group_id = self.groups["House Share"]["_id"]
        alice_id = self.users["Alice Johnson"]["id"]
        bob_id = self.users["Bob Smith"]["id"]
        charlie_id = self.users["Charlie Brown"]["id"]

        # Rent payment (equal split)
        self.create_expense(
            self.users["Alice Johnson"]["access_token"],
            group_id,
            "Monthly Rent - March",
            45000.0,
            [
                {"userId": alice_id, "amount": 15000.0, "type": "equal"},
                {"userId": bob_id, "amount": 15000.0, "type": "equal"},
                {"userId": charlie_id, "amount": 15000.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Electricity bill (unequal - Charlie uses AC more)
        self.create_expense(
            self.users["Bob Smith"]["access_token"],
            group_id,
            "Electricity Bill - March",
            3600.0,
            [
                {"userId": alice_id, "amount": 1000.0, "type": "unequal"},
                {"userId": bob_id, "amount": 1000.0, "type": "unequal"},
                {"userId": charlie_id, "amount": 1600.0, "type": "unequal"},
            ],
            "unequal",
        )
        time.sleep(0.5)

        # Groceries (Alice paid, equal split)
        self.create_expense(
            self.users["Alice Johnson"]["access_token"],
            group_id,
            "Weekly Groceries",
            2400.0,
            [
                {"userId": alice_id, "amount": 800.0, "type": "equal"},
                {"userId": bob_id, "amount": 800.0, "type": "equal"},
                {"userId": charlie_id, "amount": 800.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Internet bill (equal split)
        self.create_expense(
            self.users["Charlie Brown"]["access_token"],
            group_id,
            "Internet Bill - March",
            1500.0,
            [
                {"userId": alice_id, "amount": 500.0, "type": "equal"},
                {"userId": bob_id, "amount": 500.0, "type": "equal"},
                {"userId": charlie_id, "amount": 500.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # House cleaning service
        self.create_expense(
            self.users["Bob Smith"]["access_token"],
            group_id,
            "House Cleaning Service",
            1800.0,
            [
                {"userId": alice_id, "amount": 600.0, "type": "equal"},
                {"userId": bob_id, "amount": 600.0, "type": "equal"},
                {"userId": charlie_id, "amount": 600.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

    def setup_trip_expenses(self):
        """Create expenses for the Trip to Goa group"""
        print("\n✈️ Creating Trip to Goa expenses...")

        group_id = self.groups["Trip to Goa"]["_id"]
        alice_id = self.users["Alice Johnson"]["id"]
        diana_id = self.users["Diana Prince"]["id"]
        eve_id = self.users["Eve Wilson"]["id"]

        # Hotel booking (Diana paid, equal split)
        self.create_expense(
            self.users["Diana Prince"]["access_token"],
            group_id,
            "Hotel Booking - 3 nights",
            18000.0,
            [
                {"userId": alice_id, "amount": 6000.0, "type": "equal"},
                {"userId": diana_id, "amount": 6000.0, "type": "equal"},
                {"userId": eve_id, "amount": 6000.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Flight tickets (Alice paid for all)
        self.create_expense(
            self.users["Alice Johnson"]["access_token"],
            group_id,
            "Flight Tickets - Round Trip",
            24000.0,
            [
                {"userId": alice_id, "amount": 8000.0, "type": "equal"},
                {"userId": diana_id, "amount": 8000.0, "type": "equal"},
                {"userId": eve_id, "amount": 8000.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Car rental (percentage split - Diana 50%, others 25% each)
        self.create_expense(
            self.users["Diana Prince"]["access_token"],
            group_id,
            "Car Rental - 3 days",
            4800.0,
            [
                {"userId": alice_id, "amount": 1200.0, "type": "percentage"},
                {"userId": diana_id, "amount": 2400.0, "type": "percentage"},
                {"userId": eve_id, "amount": 1200.0, "type": "percentage"},
            ],
            "percentage",
        )
        time.sleep(0.5)

        # Beach restaurant dinner
        self.create_expense(
            self.users["Eve Wilson"]["access_token"],
            group_id,
            "Beach Restaurant Dinner",
            3600.0,
            [
                {"userId": alice_id, "amount": 1200.0, "type": "equal"},
                {"userId": diana_id, "amount": 1200.0, "type": "equal"},
                {"userId": eve_id, "amount": 1200.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Water sports (Diana and Eve participated, Alice didn't)
        self.create_expense(
            self.users["Diana Prince"]["access_token"],
            group_id,
            "Water Sports Activities",
            3000.0,
            [
                {"userId": diana_id, "amount": 1500.0, "type": "equal"},
                {"userId": eve_id, "amount": 1500.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Souvenirs and shopping
        self.create_expense(
            self.users["Alice Johnson"]["access_token"],
            group_id,
            "Souvenirs and Local Shopping",
            2700.0,
            [
                {"userId": alice_id, "amount": 900.0, "type": "equal"},
                {"userId": diana_id, "amount": 900.0, "type": "equal"},
                {"userId": eve_id, "amount": 900.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

    def setup_lunch_expenses(self):
        """Create expenses for the Office Lunch Group"""
        print("\n🍽️ Creating Office Lunch Group expenses...")

        group_id = self.groups["Office Lunch Group"]["_id"]
        bob_id = self.users["Bob Smith"]["id"]
        charlie_id = self.users["Charlie Brown"]["id"]
        diana_id = self.users["Diana Prince"]["id"]
        eve_id = self.users["Eve Wilson"]["id"]

        # Monday lunch (Bob paid)
        self.create_expense(
            self.users["Bob Smith"]["access_token"],
            group_id,
            "Monday Lunch - Pizza Palace",
            1600.0,
            [
                {"userId": bob_id, "amount": 400.0, "type": "equal"},
                {"userId": charlie_id, "amount": 400.0, "type": "equal"},
                {"userId": diana_id, "amount": 400.0, "type": "equal"},
                {"userId": eve_id, "amount": 400.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Tuesday lunch (Charlie paid, Diana was vegetarian so different pricing)
        self.create_expense(
            self.users["Charlie Brown"]["access_token"],
            group_id,
            "Tuesday Lunch - Chinese Restaurant",
            1800.0,
            [
                {"userId": bob_id, "amount": 500.0, "type": "unequal"},
                {"userId": charlie_id, "amount": 500.0, "type": "unequal"},
                {"userId": diana_id, "amount": 350.0, "type": "unequal"},
                {"userId": eve_id, "amount": 450.0, "type": "unequal"},
            ],
            "unequal",
        )
        time.sleep(0.5)

        # Wednesday lunch (Diana paid, Charlie was absent)
        self.create_expense(
            self.users["Diana Prince"]["access_token"],
            group_id,
            "Wednesday Lunch - South Indian",
            1200.0,
            [
                {"userId": bob_id, "amount": 400.0, "type": "equal"},
                {"userId": diana_id, "amount": 400.0, "type": "equal"},
                {"userId": eve_id, "amount": 400.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Thursday lunch (Eve paid)
        self.create_expense(
            self.users["Eve Wilson"]["access_token"],
            group_id,
            "Thursday Lunch - Biryani House",
            2000.0,
            [
                {"userId": bob_id, "amount": 500.0, "type": "equal"},
                {"userId": charlie_id, "amount": 500.0, "type": "equal"},
                {"userId": diana_id, "amount": 500.0, "type": "equal"},
                {"userId": eve_id, "amount": 500.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

        # Friday special lunch (Bob paid, percentage split based on orders)
        self.create_expense(
            self.users["Bob Smith"]["access_token"],
            group_id,
            "Friday Special - Italian Restaurant",
            3200.0,
            [
                {"userId": bob_id, "amount": 960.0, "type": "percentage"},  # 30%
                {"userId": charlie_id, "amount": 800.0, "type": "percentage"},  # 25%
                {"userId": diana_id, "amount": 640.0, "type": "percentage"},  # 20%
                {"userId": eve_id, "amount": 800.0, "type": "percentage"},  # 25%
            ],
            "percentage",
        )
        time.sleep(0.5)

        # Office birthday celebration (Charlie paid)
        self.create_expense(
            self.users["Charlie Brown"]["access_token"],
            group_id,
            "Office Birthday Cake and Treats",
            1500.0,
            [
                {"userId": bob_id, "amount": 375.0, "type": "equal"},
                {"userId": charlie_id, "amount": 375.0, "type": "equal"},
                {"userId": diana_id, "amount": 375.0, "type": "equal"},
                {"userId": eve_id, "amount": 375.0, "type": "equal"},
            ],
        )
        time.sleep(0.5)

    def print_summary(self):
        """Print a summary of created test data"""
        print("\n" + "=" * 60)
        print("📊 TEST DATA SETUP SUMMARY")
        print("=" * 60)

        print(f"\n👥 Users Created: {len(self.users)}")
        for name, data in self.users.items():
            print(f"   • {name} ({data['email']})")

        print(f"\n🏠 Groups Created: {len(self.groups)}")
        for name, data in self.groups.items():
            print(f"   • {name} (Code: {data['joinCode']})")

        print("\n💰 Expense Scenarios Created:")
        print("   • House Share: Rent, utilities, groceries, services")
        print("   • Trip to Goa: Travel, accommodation, activities")
        print("   • Office Lunch: Daily meals with various split types")

        print("\n🔗 Relationships Created:")
        print("   • Alice ↔ Bob, Charlie (House Share)")
        print("   • Alice ↔ Diana, Eve (Trip to Goa)")
        print("   • Bob ↔ Charlie, Diana, Eve (Office Lunch)")
        print("   • Diana ↔ Eve (Trip + Office Lunch)")
        print("   • Charlie ↔ Diana, Eve (Office Lunch)")

        print("\n✅ Test environment ready for:")
        print("   • Testing Friends page balance calculations")
        print("   • Verifying expense color coding")
        print("   • Testing group interactions")
        print("   • Validating settlement calculations")
        print("   • UI/UX testing with realistic data")

        print("\n📋 Login Credentials (for manual testing):")
        for name, data in self.users.items():
            print(f"   • {name}: {data['email']} / password123")

    def run_setup(self):
        """Run the complete test data setup"""
        print("🚀 Starting Splitwiser Test Data Setup...")
        print("This will create users, groups, and expenses for testing.")

        try:
            self.setup_users()
            self.setup_groups()
            self.setup_house_expenses()
            self.setup_trip_expenses()
            self.setup_lunch_expenses()
            self.print_summary()

            print("\n🎉 Test data setup completed successfully!")
            print("You can now test the Splitwiser application with realistic data.")

        except Exception as e:
            print(f"\n❌ Error during setup: {str(e)}")
            print("Please check your API connection and try again.")


def main():
    """Main function to run the test setup"""
    setup = SplitWiserTestSetup()
    setup.run_setup()


if __name__ == "__main__":
    main()
