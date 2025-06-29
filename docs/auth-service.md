# Auth Service Design for Splitwiser App

## API Endpoint Summary

| Method | Endpoint                                  | Description                             |
|--------|-------------------------------------------|-----------------------------------------|
| POST   | [`/auth/signup/email`](#1-emailpassword-sign-up--sign-in) | Register a new user with email+password |
| POST   | [`/auth/login/email`](#1-emailpassword-sign-up--sign-in)  | Login with email+password               |
| POST   | [`/auth/login/google`](#3-google-sign-in-via-firebase)    | Login / signup via Google OAuth token   |
| POST   | [`/auth/refresh`](#2-token-storage--rotation)           | Refresh JWT when access token expires   |
| POST   | `/auth/password/reset/request`            | Send password-reset email link          |
| POST   | `/auth/password/reset/confirm`            | Set new password via reset token        |
| POST   | [`/auth/token/verify`](#4-access-token-verification-auto-login)                | Verify access token and auto-login      |
| POST   | `/auth/token`                                     | OAuth2 compatible token login (for Swagger UI/OpenAPI) |

*Refer to the [Micro-Level API Specification](./micro-plan.md#1-authentication-service) for more details on password reset endpoints. Basic request/response for password reset are also summarized below.*

## 1. Email/Password Sign-Up & Sign-In

1. **Sign-Up**

   * **Request**:

     ```json
     POST /auth/signup/email
     {
       "email": "...",
       "password": "...",
       "name": "..."
     }
     ```
   * **Server**:

     1. Hash the password (e.g. using bcrypt).
     2. Create a new User document in MongoDB (see [`users` collection schema](../nonrelational-database-schema.md#1-users-collection)) with `hashed_password`, email, name, etc.
     3. (Optionally) create & store a **refresh token** record in a `refresh_tokens` collection, tied to the user and device/browser.
     4. Generate a short-lived **Access Token** (JWT, e.g. 15 min) and a longer-lived **Refresh Token** (e.g. 30 days).
   * **Response**:

     ```json
     200 OK
     {
       "access_token": "...jwt...",
       "refresh_token": "...opaque-or-jwt...",
       "user": { "id": "...", "email": "...", "name": "..." }
     }
     ```

2. **Sign-In**

   * **Request**:

     ```json
     POST /auth/login/email
     {
       "email": "...",
       "password": "..."
     }
     ```
   * **Server**:

     1. Look up the user by email.
     2. Compare submitted password with the stored hash.
     3. If OK, issue new Access + Refresh tokens (and store/rotate the refresh token in DB).
   * **Response**: same shape as Sign-Up.

---

## 2. Token Storage & Rotation

* **Access Token (JWT)**

  * **Lifespan**: short (e.g. 15 min)
  * **Usage**: attached to every protected request as

    ```
    Authorization: Bearer <access_token>
    ```
  * **Storage (Client)**: in memory (e.g. React state / Redux store).

    * Why not localStorage? To reduce XSS risk.

* **Refresh Token**

  * **Lifespan**: long (e.g. 30 days)
  * **Usage**: call

    ```
    POST /auth/refresh
    { "refresh_token": "..." }
    ```

    to get a new Access Token.
  * **Storage (Client)**: in a secure persistent store:
  * **Web**: `httpOnly`, `Secure` cookie (preferred), or if you must use localStorage, encrypt it.
  * **React Native / Expo**: use `SecureStore` (or `AsyncStorage` with encryption).

* **Server-Side Tracking**

  * Keep a collection `refresh_tokens` with fields

    ```js
    { token, user_id, device_info, created_at, expires_at, revoked: bool }
    ```
  * On every `refresh` call, you can rotate the token (issue a brand-new refresh token and mark the old one revoked). That way, you can:

    * Immediately revoke sessions (e.g. on password change).
    * Detect token reuse attacks.

---

## 3. Google Sign-In via Firebase

1. **In Your Expo App UI**

   * Use `expo-auth-session` or `firebase/auth` to do Google OAuth and get back a Firebase **ID Token** (JWT) on the client.
   * Example (pseudo):

     ```js
     const result = await Google.logInAsync({ … });
     const idToken = result.idToken;
     ```

2. **Backend Endpoint**

   * **Request**:

     ```json
     POST /auth/login/google
     { "id_token": "<firebase-id-token>" }
     ```
   * **Server** (FastAPI):

     1. Verify `id_token` with the Firebase Admin SDK (or by calling Google’s tokeninfo endpoint).
     2. Extract `uid`, email, name, picture.
     3. Look up or **auto-provision** a User in your MongoDB ([`users` collection](../nonrelational-database-schema.md#1-users-collection)).
     4. Issue your own Access + Refresh tokens (just like email/password flow), and store the Refresh token record.
   * **Response**:

     ```json
     {
       "access_token": "...",
       "refresh_token": "...",
       "user": { "id": "...", "email": "...", "name": "...", "avatar": "..." }
     }
     ```

3. **Client Side**

   * Receive your own tokens in the response.
   * Store them exactly the same way as in the email/password flow (Access in memory, Refresh in SecureStore/cookie).
   * All subsequent API calls (to `/groups`, `/expenses`, etc.) use your own Access token.

---

## 4. Access Token Verification (Auto-Login)

This endpoint allows the client application to verify an existing access token, typically on application startup, to automatically log the user in without requiring credentials.

*   **Request**:
    ```json
    POST /auth/token/verify
    {
      "access_token": "..."
    }
    ```
*   **Server**:
    1.  Validate the provided `access_token` (check signature, expiry, etc.).
    2.  If the token is valid, retrieve the associated user details.
    3.  If the token is invalid or expired, return an appropriate error (e.g., 401 Unauthorized).
*   **Response (Success)**:
    ```json
    200 OK
    {
      "user": { "id": "...", "email": "...", "name": "..." }
    }
    ```
*   **Response (Failure)**:
    ```json
    401 Unauthorized
    {
      "error": "Invalid or expired token"
    }
    ```

This endpoint helps in providing a seamless login experience if a valid session token is already present on the client. If this verification fails, the client should then attempt to use the refresh token via the [`/auth/refresh`](#2-token-storage--rotation) endpoint or prompt the user for a full login.

---

## 5. Password Reset Endpoints

These endpoints manage the password reset flow.

### a. Request Password Reset

*   **Endpoint**: `POST /auth/password/reset/request`
*   **Description**: Initiates the password reset process by sending a reset link/token to the user's email.
*   **Request**:
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Response (Success)**:
    ```json
    200 OK
    {
      "success": true,
      "message": "If the email exists, a reset link has been sent"
    }
    ```

### b. Confirm Password Reset

*   **Endpoint**: `POST /auth/password/reset/confirm`
*   **Description**: Allows a user to set a new password using a valid reset token.
*   **Request**:
    ```json
    {
      "reset_token": "valid_reset_token_string",
      "new_password": "newSecurePassword123"
    }
    ```
*   **Response (Success)**:
    ```json
    200 OK
    {
      "success": true,
      "message": "Password has been reset successfully"
    }
    ```

---

## 6. OAuth2 Token Endpoint (Primarily for Swagger/OpenAPI)

This endpoint is standard for OAuth2 password flow and primarily used by tools like Swagger UI for interactive API documentation. It allows users to authenticate within the Swagger interface to test protected endpoints.

*   **Endpoint**: `POST /auth/token`
*   **Description**: OAuth2 compatible token login. Expects `username` (as email) and `password` in form-data.
*   **Request (form-data)**:
    ```
    username=user@example.com
    password=userpassword
    ```
*   **Response (Success)**:
    ```json
    200 OK
    {
      "access_token": "...jwt...",
      "token_type": "bearer"
    }
    ```
    *(Note: This endpoint, as implemented in `auth/routes.py` for Swagger, returns only an access_token. The main `/auth/login/email` should be used by clients for full auth token pair.)*

---

## 7. Client-Side Persistence & UX

* **On App Launch**

  1. Check SecureStore (or cookies) for a stored Refresh Token.
  2. If found, call `/auth/refresh` to get a fresh Access token (and possibly a rotated Refresh token).
  3. If no valid tokens, show the Login/Sign-Up screen.

* **On Login / Sign-Up**

  1. Save the returned Access token in React state.
  2. Save the Refresh token in SecureStore or an HttpOnly cookie.
  3. Redirect into your logged-in UI.

* **On API Calls**

  * Automatically inject the `Authorization: Bearer <access_token>` header via an Axios or Fetch interceptor.
  * If you get a 401 (Access token expired), automatically call `/auth/refresh` once and retry the original request.

* **On Logout**

  1. Call `/auth/logout` (if you implement a logout endpoint that revokes the refresh token).
  2. Clear tokens from SecureStore and in-memory state.
  3. Redirect back to the Login screen.

---

### Why This Feels Smooth

* **Token Rotation & Auto-Refresh** means users rarely see login screens once they’ve signed in.
* **SecureStore / HttpOnly Cookies** keep tokens safe from attackers.
* **Centralized Refresh-Token Store** on the server lets you revoke stolen tokens instantly (e.g. via an “Active Sessions” screen).
* **Single Codepath** for both Email/Password and Google Sign-In after the initial identity check (you end up issuing your own tokens in both cases, interacting with the [User Service](./user-service.md) for profile data).


