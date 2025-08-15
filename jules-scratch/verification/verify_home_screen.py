import asyncio
import random
import string

from playwright.async_api import async_playwright, expect


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Generate random user credentials
        random_suffix = "".join(
            random.choices(string.ascii_lowercase + string.digits, k=8)
        )
        email = f"testuser_{random_suffix}@example.com"
        password = "securepassword123"
        name = "Test User"

        # Navigate to the app (which should be the Login screen)
        await page.goto("http://localhost:8081")

        # --- Navigate to Signup ---
        await page.get_by_role("button", name="Don't have an account? Sign Up").click()

        # --- Fill in the signup form ---
        # Using get_by_placeholder for react-native-web inputs as labels might not be correctly associated
        await page.get_by_placeholder("Name").fill(name)
        await page.get_by_placeholder("Email").fill(email)
        await page.get_by_placeholder("Password").fill(password)

        # Submit the form
        await page.get_by_role("button", name="Sign Up").click()

        # --- Verification ---
        # Wait for the dashboard header to be visible after login
        await expect(page.get_by_text("Dashboard")).to_be_visible(timeout=30000)

        # Take a screenshot of the home screen
        await page.screenshot(path="jules-scratch/verification/home_screen.png")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
