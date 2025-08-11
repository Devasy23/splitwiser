from playwright.sync_api import expect, sync_playwright


def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Log in
        page.goto("http://localhost:8081", timeout=120000)

        # Wait for the app to load
        login_button = page.get_by_role("button", name="Login")
        expect(login_button).to_be_visible(timeout=120000)

        # Use more robust locators for React Native Web
        email_input = page.get_by_placeholder("Email")
        password_input = page.get_by_placeholder("Password")

        expect(email_input).to_be_visible()
        email_input.fill("alice@example.com")

        expect(password_input).to_be_visible()
        password_input.fill("password123")

        login_button.click()

        # 2. Navigate to the "House Share" group
        house_share_group = page.get_by_text("House Share")
        expect(house_share_group).to_be_visible(timeout=30000)

        # 3. Take a screenshot
        page.screenshot(path="jules-scratch/verification/groups_screen.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()


with sync_playwright() as playwright:
    run(playwright)
