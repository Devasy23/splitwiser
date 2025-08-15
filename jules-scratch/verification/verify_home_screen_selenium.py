import random
import string
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def main():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=options)

    try:
        # Generate random user credentials
        random_suffix = "".join(
            random.choices(string.ascii_lowercase + string.digits, k=8)
        )
        email = f"testuser_{random_suffix}@example.com"
        password = "securepassword123"
        name = "Test User"

        # Navigate to the app
        driver.get("http://localhost:8081")

        # Wait for the "Don't have an account? Sign Up" button to be clickable
        signup_button = WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//*[contains(text(), 'Don\\'t have an account? Sign Up')]")
            )
        )
        signup_button.click()

        # Fill in the signup form
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[@placeholder='Name']"))
        ).send_keys(name)
        driver.find_element(By.XPATH, "//*[@placeholder='Email']").send_keys(email)
        driver.find_element(By.XPATH, "//*[@placeholder='Password']").send_keys(
            password
        )

        # Submit the form
        # It's better to wait for the element to be clickable
        submit_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//*[text()='Sign Up']"))
        )
        submit_button.click()

        # Wait for the dashboard header to be visible
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, "//*[text()='Dashboard']"))
        )

        # Take a screenshot
        driver.save_screenshot("jules-scratch/verification/home_screen_selenium.png")

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
