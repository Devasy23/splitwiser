# Splitwiser - Smart Expense Splitting App 💰

Splitwiser is a modern expense tracking and splitting application built with Expo/React Native. It simplifies group expense management, making it easy to track shared costs, split bills fairly, and settle debts among friends, roommates, or travel groups.

## ✨ Key Features

- **Multi-Platform**: Built with Expo for iOS, Android, and Web
- **Smart Expense Splitting**: Flexible splitting options (equal, percentage, custom amounts)
- **Group Management**: Create and manage multiple expense groups
- **Real-Time Sync**: Live updates across all devices
- **Secure Authentication**: Email/password and Google OAuth integration
- **Receipt Management**: Upload and attach receipts to expenses
- **Debt Simplification**: Advanced algorithms to minimize payment transactions
- **Multi-Currency Support**: Handle expenses in different currencies
- **Settlement Tracking**: Record and track payments between group members

## 🏗️ Architecture

### Frontend (Expo/React Native)
- **Framework**: Expo with TypeScript
- **Navigation**: File-based routing
- **State Management**: React Context/Redux (TBD)
- **Authentication**: Secure token storage with refresh token rotation
- **UI**: Modern, responsive design

### Backend (FastAPI)
- **Framework**: FastAPI with Python
- **Database**: MongoDB for document storage
- **Authentication**: JWT with refresh token rotation
- **File Storage**: S3-compatible storage for receipts
- **Real-time**: WebSocket support for live updates

### Key Services
1. **Authentication Service**: Secure login with email/password and Google OAuth
2. **User Service**: Profile management and preferences
3. **Group Service**: Group creation, member management, and invitations
4. **Expense Service**: Expense tracking, splitting algorithms, and attachments
5. **Settlement Service**: Payment recording and debt resolution
6. **Notification Service**: Real-time updates and notifications

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- MongoDB (for backend)
- Python 3.9+ (for backend)

### Development Setup

#### Frontend (Expo App)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

#### Mobile Development

**Android**: Android previews are defined as a `workspace.onStart` hook and started as a vscode task when the workspace is opened/started.

Note, if you can't find the task, either:
- Rebuild the environment (using command palette: `IDX: Rebuild Environment`), or
- Run `npm run android -- --tunnel` command manually run android and see the output in your terminal. The device should pick up this new command and switch to start displaying the output from it.

In the output of this command/task, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You'll also find options to open the app's developer menu, reload the app, and more.

**Web**: Web previews will be started and managed automatically. Use the toolbar to manually refresh.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

#### Backend (FastAPI)

1. **Set up Python environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and other config
   ```

4. **Start the server**:
   ```bash
   uvicorn main:app --reload
   ```
#### Proof-of-Concept UI (Streamlit)

This project includes a Streamlit UI for demonstration purposes, available on the `ui-poc` branch.

1.  **Switch Branch**: Ensure you are on the `ui-poc` branch (`git checkout ui-poc`).
2.  **Start Backend**: Make sure the backend server is running.
3.  **Install Dependencies**: Navigate to the UI directory and install its requirements:
    ```bash
    cd ui 
    pip install -r requirements.txt
    ```
4.  **Run UI**: Start the Streamlit app:
    ```bash
    streamlit run app.py
    ```
## 📱 Features in Detail

### Authentication & Security
- **Secure Token Storage**: Access tokens in memory, refresh tokens in secure storage
- **Token Rotation**: Automatic refresh token rotation for enhanced security
- **Multi-Provider Auth**: Support for email/password and Google OAuth
- **Session Management**: Track and revoke active sessions across devices

### Expense Management
- **Flexible Splitting**: Equal splits, percentage-based, or custom amounts
- **Receipt Attachments**: Upload and store receipt images
- **Categories & Tags**: Organize expenses with custom categories
- **Multi-Currency**: Handle expenses in different currencies with real-time conversion
- **Edit History**: Track all changes to expenses with full audit trail

### Group Features
- **Invite System**: Email-based invitations with secure tokens
- **Role Management**: Admin and member roles with different permissions
- **Group Settings**: Customizable group preferences and currencies
- **Member Management**: Add, remove, and manage group members

### Smart Debt Resolution
- **Debt Simplification**: Advanced graph algorithms to minimize transactions
- **Settlement Tracking**: Record real payments and update balances
- **Balance Overview**: Clear visualization of who owes what to whom
- **Payment Reminders**: Optional notifications for pending settlements

## 🛠️ Development

### Project Structure
```
splitwiser/
├── app/                    # Expo app source code
├── backend/               # FastAPI backend (when implemented)
├── docs/                  # Technical documentation
│   ├── auth-service.md   # Authentication service design
│   └── micro-plan.md     # Detailed API specifications
└── README.md
```

### API Documentation
- **Authentication**: See `docs/auth-service.md` for detailed auth flow
- **API Endpoints**: See `docs/micro-plan.md` for complete API specification
- **Interactive Docs**: FastAPI auto-generates docs at `/docs` when backend is running

### Technology Stack
- **Frontend**: Expo, React Native, TypeScript
- **Backend**: FastAPI, Python, MongoDB
- **Authentication**: JWT with refresh tokens, Firebase Auth (Google)
- **Storage**: MongoDB for data, S3-compatible for file storage
- **Real-time**: WebSockets for live updates

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Project setup and documentation
- [ ] Basic authentication system
- [ ] User management
- [ ] Group creation and management
- [ ] Basic expense tracking and splitting

### Phase 2: Enhanced Features
- [ ] Receipt upload and management
- [ ] Advanced splitting algorithms
- [ ] Settlement tracking and debt simplification
- [ ] Real-time synchronization
- [ ] Multi-currency support

### Phase 3: Advanced Features
- [ ] Analytics and reporting
- [ ] Push notifications
- [ ] Offline support
- [ ] Advanced group permissions
- [ ] Export functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- **[Authentication Service Design](docs/auth-service.md)**: Detailed authentication flow and security
- **[API Specification](docs/micro-plan.md)**: Complete API endpoint documentation
- **Technical Specification**: See attached PDF for comprehensive project requirements

## 🏃‍♂️ Quick Start for Development

When you're ready to reset the starter template, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## 📖 Learning Resources

To learn more about the technologies used in this project:

- **[Expo Documentation](https://docs.expo.dev/)**: Learn Expo fundamentals and advanced topics
- **[React Native Tutorial](https://docs.expo.dev/tutorial/introduction/)**: Step-by-step tutorial for mobile development
- **[FastAPI Documentation](https://fastapi.tiangolo.com/)**: Backend API framework documentation
- **[MongoDB Documentation](https://docs.mongodb.com/)**: Database setup and operations

## 👥 Community

Join our community of developers creating universal apps:

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Share ideas and get help from the community
- **Discord**: Real-time chat and collaboration (link TBD)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for splitting expenses the smart way!**

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
